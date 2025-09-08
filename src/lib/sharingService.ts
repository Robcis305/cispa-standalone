import { supabase } from './supabase';
import { CreateShareRequest, Share, ShareAccessLog } from '@/types/sharing.types';

export class SharingService {
  /**
   * Create a new secure share link for a report
   */
  static async createShare(request: CreateShareRequest, userId: string): Promise<{ data: Share | null, error: string | null }> {
    try {
      // First, check if the user has permission to share this report
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .select('report_id, assessment_id, assessments(advisor_id)')
        .eq('report_id', request.report_id)
        .single();

      if (reportError || !report) {
        return { data: null, error: 'Report not found or access denied' };
      }

      // Check if user owns the assessment
      if ((report as any).assessments?.advisor_id !== userId) {
        return { data: null, error: 'You do not have permission to share this report' };
      }

      // Create the share record
      const shareData = {
        report_id: request.report_id,
        shared_by_user_id: userId,
        permissions: request.permissions,
        expiration_date: request.expiration_date,
        email_restrictions: request.email_restrictions || [],
      };

      const { data, error } = await supabase
        .from('shares')
        .insert(shareData)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      // Log the sharing activity
      await this.logSharingActivity('share_created', data.share_id, userId);

      return { data, error: null };
    } catch (error) {
      return { data: null, error: `Failed to create share: ${error}` };
    }
  }

  /**
   * Get share information by token
   */
  static async getShareByToken(token: string): Promise<{ data: Share | null, error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('shares')
        .select(`
          *,
          reports(
            report_id,
            title,
            file_path,
            assessment_id,
            assessments(
              company_name,
              title as assessment_title,
              overall_readiness_score
            )
          )
        `)
        .eq('share_token', token)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return { data: null, error: 'Share link not found or expired' };
      }

      // Check if expired
      if ((data as any).expiration_date && new Date((data as any).expiration_date) < new Date()) {
        return { data: null, error: 'Share link has expired' };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: `Failed to get share: ${error}` };
    }
  }

  /**
   * Access a shared report (increment access count and log)
   */
  static async accessShare(
    token: string, 
    email?: string, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<{ data: any | null, error: string | null }> {
    try {
      const { data: share, error: shareError } = await this.getShareByToken(token);
      
      if (shareError || !share) {
        return { data: null, error: shareError || 'Share not found' };
      }

      // Check email restrictions if any
      if ((share as any).email_restrictions && (share as any).email_restrictions.length > 0) {
        if (!email || !(share as any).email_restrictions.includes(email)) {
          return { data: null, error: 'Access restricted to specific email addresses' };
        }
      }

      // Update access count and last accessed
      const { error: updateError } = await supabase
        .from('shares')
        .update({
          access_count: (share as any).access_count + 1,
          last_accessed_at: new Date().toISOString(),
        })
        .eq('share_id', (share as any).share_id);

      if (updateError) {
        console.error('Failed to update access count:', updateError);
      }

      // Log the access
      await this.logShareAccess((share as any).share_id, email, ipAddress, userAgent);

      return { data: share, error: null };
    } catch (error) {
      return { data: null, error: `Failed to access share: ${error}` };
    }
  }

  /**
   * Revoke a share link
   */
  static async revokeShare(shareId: string, userId: string): Promise<{ error: string | null }> {
    try {
      // Check if user has permission to revoke
      const { data: share, error: shareError } = await supabase
        .from('shares')
        .select('shared_by_user_id')
        .eq('share_id', shareId)
        .single();

      if (shareError || !share || (share as any).shared_by_user_id !== userId) {
        return { error: 'Share not found or access denied' };
      }

      // Revoke the share
      const { error } = await supabase
        .from('shares')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
        })
        .eq('share_id', shareId);

      if (error) {
        return { error: error.message };
      }

      // Log the revocation
      await this.logSharingActivity('share_revoked', shareId, userId);

      return { error: null };
    } catch (error) {
      return { error: `Failed to revoke share: ${error}` };
    }
  }

  /**
   * Get all shares for a report
   */
  static async getSharesForReport(reportId: string, userId: string): Promise<{ data: Share[] | null, error: string | null }> {
    try {
      // First verify user has access to this report
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .select('assessment_id, assessments(advisor_id)')
        .eq('report_id', reportId)
        .single();

      if (reportError || !report || (report as any).assessments?.advisor_id !== userId) {
        return { data: null, error: 'Report not found or access denied' };
      }

      const { data, error } = await supabase
        .from('shares')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: `Failed to get shares: ${error}` };
    }
  }

  /**
   * Log sharing activity for audit trail
   */
  private static async logSharingActivity(activity: string, shareId: string, userId: string) {
    try {
      // For now, we'll use a simple console log. In production, this would go to a dedicated audit log table
      console.log(`Sharing Activity: ${activity}`, {
        shareId,
        userId,
        timestamp: new Date().toISOString(),
      });
      
      // TODO: Implement proper audit logging table in future iteration
    } catch (error) {
      console.error('Failed to log sharing activity:', error);
    }
  }

  /**
   * Log share access for audit trail
   */
  private static async logShareAccess(shareId: string, email?: string, ipAddress?: string, userAgent?: string) {
    try {
      // For now, we'll use a simple console log. In production, this would go to a dedicated access log table
      console.log('Share Access:', {
        shareId,
        email,
        ipAddress,
        userAgent,
        timestamp: new Date().toISOString(),
      });
      
      // TODO: Implement proper access logging table in future iteration
    } catch (error) {
      console.error('Failed to log share access:', error);
    }
  }

  /**
   * Generate a shareable URL for a token
   */
  static generateShareUrl(token: string, baseUrl?: string): string {
    const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base}/shared/${token}`;
  }
}