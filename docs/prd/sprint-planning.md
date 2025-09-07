# CISPA Sprint Planning & Data Architecture

## Sprint Overview

### Sprint 1 (29 points total)
**Focus:** Core Assessment & Report Generation MVP
- **User Story 1:** Complete a Full Assessment in Under 2 Hours (8 pts)
- **User Story 2:** Generate a Board-Ready Report (13 pts)  
- **User Story 3:** Securely Share Reports with Stakeholders (8 pts)

**Sprint 1 Goals:**
- Deliver end-to-end advisor workflow: Assessment → Report → Share
- Establish core platform architecture and security foundations
- Enable first advisor beta testing with complete feature set

### Sprint 2 (18 points total)
**Focus:** Investor Matching & Strategic Advisory Features
- **User Story 5:** Generate a Shortlist of Investors (13 pts)
- **User Story 6:** View Ranked Investor Shortlist (5 pts)

**Sprint 2 Goals:**
- Add unique competitive differentiation with investor matching
- Enable founder engagement and strategic advisory value
- Complete core CISPA value proposition

### Future Sprints
- **User Story 4:** Founder Viewing of Reports (Not estimated - requires UI/UX design)
- Additional features from PRD (optional modules, benchmarking, etc.)

---

## Data Models & Architecture

### Core Data Tables

#### 1. Questions Table
Stores the assessment question library with branching logic.
```sql
- question_id (Primary Key)
- question_text
- question_type (text, number, file_upload, multiple_choice)
- dimension (6 core dimensions)
- module (core, marketing, technology, investor)
- branching_conditions
- weight/scoring_impact
- created_at, updated_at
```

#### 2. Answers Table  
Captures all user responses tied to specific assessments.
```sql
- answer_id (Primary Key)
- assessment_id (Foreign Key)
- question_id (Foreign Key)
- answer_value
- answer_metadata (file paths, additional context)
- created_at, updated_at
- user_id (for audit trail)
```

#### 3. Assessments Table
Master record for each assessment instance.
```sql
- assessment_id (Primary Key)
- company_name
- advisor_id (Foreign Key to Users)
- founder_id (Foreign Key to Users, nullable)
- status (in_progress, completed, archived)
- started_at, completed_at
- time_to_completion
- overall_readiness_score
- dimension_scores (JSON field)
- recommendations (JSON field)
- created_at, updated_at
```

#### 4. Jobs Table
Handles asynchronous workflows (report generation, etc.).
```sql
- job_id (Primary Key)
- job_type (report_generation, investor_matching)
- status (queued, processing, completed, failed)
- input_data (JSON)
- output_data (JSON)
- error_message
- created_at, updated_at, completed_at
```

#### 5. Shares Table
Manages secure report sharing with stakeholder access controls.
```sql
- share_id (Primary Key)
- report_id (Foreign Key)
- shared_by_user_id (Foreign Key)
- share_token (unique, secure)
- permissions (view, download)
- expiration_date
- email_restrictions (JSON array)
- access_count
- last_accessed_at
- created_at, updated_at
- revoked_at
```

---

## API Contracts

### Assessment Service
**Core Endpoints:**
- `POST /assessments/start` - Initialize new assessment
- `GET /assessments/{id}/next-question` - Get next question in adaptive flow
- `POST /assessments/{id}/answer` - Submit answer to question
- `POST /assessments/{id}/complete` - Mark assessment complete and trigger scoring
- `GET /assessments/{id}/status` - Check completion status and scores

### Report Generation Service
**Asynchronous Job Pattern:**
- `POST /reports/generate` - Create report generation job
- `GET /jobs/{job_id}/status` - Poll job status
- `GET /reports/{report_id}/download` - Get signed URL for report download

### Sharing Service
**Secure Link Management:**
- `POST /reports/{report_id}/share` - Create secure share link
- `GET /shared/{share_token}` - Access shared report (with validation)
- `DELETE /shares/{share_id}` - Revoke share link
- `GET /shares/{share_id}/audit` - View sharing audit log

### Investor Matching Service
**Shortlist Generation:**
- `POST /investor-matching/shortlist` - Generate investor shortlist
- `GET /assessments/{id}/investor-shortlist` - Retrieve generated shortlist
- `POST /investor-shortlist/{id}/rank` - Apply custom weightings/rankings

---

## Technical Architecture Notes

### Security Requirements
- **Authentication:** JWT-based with role-based access control (Advisor, Founder, Admin)
- **Data Encryption:** AES-256 at rest, TLS 1.3 in transit
- **Audit Logging:** All user actions logged with immutable audit trail
- **Secure Sharing:** Time-limited signed URLs with granular permissions

### Performance Requirements  
- **Assessment Flow:** < 3 seconds page load time
- **Report Generation:** < 30 seconds completion time (async)
- **Investor Matching:** < 10 seconds shortlist generation
- **Concurrent Users:** Support 1,000+ simultaneous users

### Scalability Considerations
- **Database:** Designed for horizontal scaling and partitioning
- **File Storage:** Cloud-based with CDN for report delivery
- **Background Jobs:** Queue-based processing for report generation
- **Caching:** Redis for frequently accessed data (questions, scores)

---

## Success Metrics & KPIs

### Sprint 1 Success Criteria
- [ ] End-to-end assessment completion in < 2 hours
- [ ] Report generation success rate > 95%
- [ ] Secure sharing functional with audit trail
- [ ] All performance benchmarks met
- [ ] Security requirements implemented

### Sprint 2 Success Criteria  
- [ ] Investor shortlist generation functional
- [ ] Founder interface for shortlist viewing complete
- [ ] Integration with report generation working
- [ ] Matching algorithm accuracy validated

### Platform-Wide KPIs
- Assessment completion rate (started vs finished)
- Average time to complete assessment
- Report generation and sharing usage rates
- Investor shortlist accuracy and engagement
- Overall user satisfaction and adoption metrics