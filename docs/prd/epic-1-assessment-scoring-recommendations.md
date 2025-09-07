# Epic 1: Assessment, Scoring, and Recommendations

## Overview
Delivers the core value of CISPA: a dynamic, advisor-driven assessment process with prioritized recommendations and readiness scoring. This epic forms the foundation for all other features.

## User Stories

### User Story 1: Complete a Full Assessment in Under 2 Hours
**Story Points:** 8  
**Priority:** High (Sprint 1)

**As an** advisor,  
**I want to** input a company's data and complete the full CISPA assessment in under 2 hours  
**So that** I can deliver a readiness evaluation quickly without manual consulting overhead.

#### Acceptance Criteria:
1. Authenticated Advisor can create a new assessment record
2. System tracks time spent from start to finish
3. Advisor can save a partially completed assessment and resume later
4. System presents all core assessment questions in a logical, adaptive flow
5. Inputs (manual text, numbers, file uploads) are stored and tied to assessment record
6. All advisor inputs are logged with timestamps/user IDs for auditability
7. Completion validates mandatory inputs and marks assessment as `complete`
8. Time-to-completion metric stored for analytics

#### Technical Requirements
- **Data Models:** Assessments Table, Questions Table, Answers Table
- **API Contracts:** Assessment Service (start, next-question, answer, complete)
- **Performance:** Complete assessment flow must load within 3 seconds
- **Security:** All inputs encrypted at rest and in transit

#### Definition of Done
- [ ] Assessment creation and completion workflow functional
- [ ] Time tracking implemented and accurate
- [ ] Save/resume functionality working
- [ ] All acceptance criteria met and tested
- [ ] Audit logging implemented
- [ ] Performance benchmarks met

## Sprint Assignment
- **Sprint 1** (29 points total)
- **Dependencies:** Core platform authentication and database setup
- **Risk Level:** Medium - Core functionality with time constraints

## Related Epics
- Epic 2: Report Generation (depends on completed assessments)
- Epic 3: Investor Matching (uses assessment data)

## Success Metrics
- Average assessment completion time < 2 hours
- Assessment save/resume usage rate
- Assessment completion rate (started vs finished)
- Advisor satisfaction with assessment flow