# Maintenance Entry Plan

## Overview
Build the maintenance entry flow so a user can open the app after servicing the printer, record current printer hours, choose a maintenance job, accept or adjust the default category, optionally add notes, submit the record, and receive clear confirmation that it was saved.

## Key Decisions
- Reuse the existing backend contract: `GET /api/maintenance/jobs`, `GET /api/maintenance`, and `POST /api/maintenance`.
- Derive the latest known printer hours from the newest maintenance history record on the client.
- Keep notes optional.
- Keep the maintenance-job picker focused on **job names only**.
- Do **not** show data from the removed typical-frequency column in the form UI.
- Use a separate info icon to show recommended maintenance windows.

## Task 7 Scope
The maintenance entry page must let the user:
- enter printer hours
- choose a maintenance job
- receive the default category for that job when applicable
- override the category if needed
- optionally add notes
- review recommended maintenance windows from an info icon
- submit and receive clear success or failure feedback

## Task Breakdown

### Task 7.1: Define job metadata and interval reference
- Create a frontend source of truth for job-to-category defaults.
- Keep `Other` category-neutral.
- Store recommended maintenance windows separately from the job selector.

### Task 7.2: Add data hooks
- Add hooks for maintenance jobs.
- Add hooks for maintenance history and latest-hours context.
- Add the create-record mutation hook with loading, success, and error state.

### Task 7.3: Build the maintenance form
- Add printer-hours input, job select, category controls, optional notes, and submit action.
- Apply default category when a mapped job is selected.
- Show latest-hours context and a non-blocking lower-hours warning.

### Task 7.4: Add the info-icon reference panel
- Add an info icon near the top of the form.
- Reveal recommended maintenance windows on activation.
- Keep the panel mobile-friendly and keyboard accessible.

### Task 7.5: Wire submission and success state
- Submit `printerHours`, `maintenanceJobId`, `category`, and optional `notes`.
- Show clear success confirmation.
- Refresh cached history so the newest record becomes the latest-hours reference.
- Reset the form to a useful next-entry state.

### Task 7.6: Add failure handling and tests
- Show clear load and submit failure messages.
- Block offline or unavailable-network submission with explicit feedback.
- Cover category defaulting, info-panel behavior, and submit success/failure in frontend tests.

## Acceptance Criteria
- Form accepts decimal printer hours.
- Form stores printer hours on every created maintenance record.
- Selecting a maintenance job applies its default category when the mapping is unambiguous.
- The job picker does not include typical-frequency text.
- The info icon exposes recommended maintenance windows.
- Successful save updates the page state without a full reload.
- Offline or network-unavailable submission is clearly blocked.

## Verification
- `npm test`
- `npm run build`
- Manually submit a routine record and an error record, verify success feedback, and confirm the next form state remains useful.
