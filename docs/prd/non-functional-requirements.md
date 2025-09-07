# Non-Functional Requirements

## 1. Performance
- All standard pages (dashboard, assessment forms, results) must load in ≤3 seconds under normal load.
- Assessment completion (score + recommendations generation) must occur in ≤5 seconds post-submission.
- The platform must support real-time rendering of visual outputs (radar charts, investor matrices) without lag.
- System response must remain consistent with up to 1,000 concurrent active users.

## 2. Security & Compliance
- All data in transit must use TLS 1.3 encryption; all data at rest must be encrypted with AES-256.
- The system must implement role-based access control (e.g., Founder, Advisor, Investor) with least-privilege principles.
- Sensitive shared reports must support link expiration and revocation.
- The platform must be designed to meet SOC 2 Type II and ISO 27001 compliance within 24 months.
- User activity logs must be immutable and retained for 24 months for auditability.

## 3. Scalability & Availability
- The system must scale to support 10x user growth within 3 years without significant refactoring.
- Platform uptime must meet 99.9% availability (measured monthly).
- Horizontal scaling must be supported for assessment processing and report generation.
- Database must support partitioning/sharding to handle increasing assessment data volume.

## 4. Usability & Accessibility
- The platform must allow a first-time user (non-technical founder) to complete an assessment without training.
- Navigation must be consistent across personas with role-specific dashboards.
- The platform must adhere to WCAG 2.1 AA accessibility guidelines (screen readers, color contrast, keyboard navigation).
- Visual outputs (charts, heatmaps) must include tooltips/explanations for non-technical users.

## 5. Reliability & Data Integrity
- All user input must autosave every 30 seconds or on field exit to prevent data loss.
- The system must support full recovery of assessments in the event of unexpected termination.
- Database backups must occur hourly with daily offsite replication.
- Data consistency must be maintained across modules (scores, recommendations, investor comparison).

## 6. Maintainability & Extensibility
- Codebase must follow modular architecture to allow easy addition of new assessment modules.
- Documentation (API, internal dev notes) must be updated alongside feature releases.
- System must support versioned assessments so older reports remain reproducible.

## 7. Auditability & Transparency
- Each readiness score must include a traceable breakdown (inputs, weights, logic) for credibility with investors/boards.
- The system must allow advisors to update commentary that is tracked and versioned.