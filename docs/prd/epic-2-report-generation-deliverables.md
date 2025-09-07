# Epic 2: Report Generation & Deliverables

## Overview
Transforms completed assessments into professional, branded deliverables for advisors, founders, and investors. This epic delivers the client-facing value that justifies advisor fees and provides actionable strategic guidance.

## User Stories

### User Story 2: Generate a Board-Ready Report
**Story Points:** 13  
**Priority:** High (Sprint 1)

**As an** advisor,  
**I want to** generate a professional, branded report from a completed assessment  
**So that** I can present defensible, board-ready outputs to my client without manual formatting work.

#### Acceptance Criteria:
1. Advisor can generate a report from any completed assessment
2. Report includes readiness scores, breakdowns, recommendations, and investor comparisons
3. Reports render in both PDF and PowerPoint formats
4. Branding supports advisor and client (logos, colors, company names)
5. Visualizations (radar charts, heatmaps, matrices) render consistently
6. Reports maintain version control with identifiers
7. All reports logged for auditability and retrieval

#### Technical Requirements
- **Data Models:** Jobs Table (async report generation)
- **API Contracts:** Report Generation Service (async job creation, status polling, signed URLs)
- **Performance:** Report generation must complete within 30 seconds
- **Formats:** PDF and PowerPoint export capabilities
- **Visualizations:** Radar charts, heatmaps, comparison matrices

---

### User Story 3: Securely Share Reports with Stakeholders
**Story Points:** 8  
**Priority:** High (Sprint 1)

**As an** advisor,  
**I want to** securely share a generated report with selected stakeholders  
**So that** collaboration is controlled and auditable.

#### Acceptance Criteria:
1. Authenticated Advisor can create secure share links for reports
2. Links include permissions (view/download), expiration, and optional email restrictions
3. Expired or revoked links return a clear error
4. Advisors can revoke links at any time
5. All sharing activity (create, access, revoke) logged for auditability

#### Technical Requirements
- **Data Models:** Shares Table (secure sharing metadata)
- **API Contracts:** Sharing Service (create/revoke links, access validation)
- **Security:** Time-limited signed URLs with permission controls
- **Audit:** Complete sharing activity log

---

### User Story 4: Founder Viewing of Reports
**Story Points:** Not Estimated  
**Priority:** Medium (Future Sprint)

**As a** founder,  
**I want to** securely view and share my company's readiness report  
**So that** I can align my leadership team, board, and investors.

#### Acceptance Criteria:
1. Authenticated Founder can log in to view reports for their company
2. Reports display readiness scores, breakdowns, and recommendations
3. Visualizations render in online view
4. Founder can download PDF/PPT
5. Secure sharing of reports available with permissions
6. Reports clearly labeled with version control
7. All access logged for auditability

#### Technical Requirements
- **Authentication:** Founder-specific access controls
- **UI/UX:** Clean, professional report viewing interface
- **Download:** PDF/PowerPoint export for founders
- **Sharing:** Founder-initiated secure sharing capabilities

## Sprint Assignment
- **Sprint 1** (29 points total):
  - User Story 2: Generate Board-Ready Report (13 pts)
  - User Story 3: Securely Share Reports (8 pts)
- **Future Sprint:**
  - User Story 4: Founder Viewing (Not estimated)

## Dependencies
- Epic 1: Requires completed assessments to generate reports
- Core platform: Authentication, user management, file storage

## Risk Level
High - Complex report generation with multiple formats and security requirements

## Related Epics
- Epic 1: Assessment completion feeds into report generation
- Epic 3: Investor comparison data included in reports

## Success Metrics
- Report generation success rate (>95%)
- Average report generation time (<30 seconds)
- Report sharing usage and engagement rates
- Client satisfaction with report quality and branding
- Report download and view analytics

## Definition of Done
- [ ] PDF and PowerPoint report generation functional
- [ ] Branding customization working (advisor + client logos)
- [ ] All visualizations rendering correctly
- [ ] Secure sharing with permissions implemented
- [ ] Version control and audit logging complete
- [ ] Performance benchmarks met
- [ ] All acceptance criteria tested and validated