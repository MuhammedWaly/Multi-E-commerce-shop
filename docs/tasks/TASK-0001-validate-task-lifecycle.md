# TASK-0001 — Validate Task Lifecycle

## Metadata

| Field                | Value                                                              |
|----------------------|--------------------------------------------------------------------|
| **Task ID**          | TASK-0001                                                          |
| **Title**            | Validate Task Lifecycle                                            |
| **Product**          | Platform (Control Plane)                                           |
| **Phase**            | Phase 1                                                            |
| **Status**           | DONE                                                               |
| **Priority**         | High                                                               |
| **Estimated Effort** | Small                                                              |
| **Assigned To**      | Antigravity (under owner supervision)                              |
| **Execution Mode**   | Antigravity implements; owner reviews before commit                |
| **Created**          | 2026-10-19                                                         |
| **Updated**          | 2026-10-19                                                         |

## Context

To ensure the Stage A File-First Control Plane operates reliably before product-specific development begins, we must define, implement, and exercise an executable task lifecycle validator. This task verifies state machine transition rules, approval log checking, and isolated test execution.

## Scope

- Document standard task lifecycle state transitions and invariants.
- Implement a lightweight, zero-dependency validation script (`platform/scripts/validate-task-lifecycle.ps1`).
- Execute isolated negative and positive test suites in scratch storage outside the workspace.
- Validate that unauthorized transitions, missing approvals, and terminal state violations are rejected with non-zero exit codes.
- Record the actual owner scope authorization in `docs/approvals/approval-log.json` (`APR-0004`).
- Update `STATE.md` and present all changes for owner review before any commit.

## State Transitions

```text
PROPOSED ──> PENDING_OWNER_APPROVAL ──> APPROVED ──> IN_PROGRESS ──> IN_REVIEW ──> DONE
    │                    │                                  │
    └──> REJECTED        └──> REJECTED                      └──> CHANGES_REQUESTED
```

## Acceptance Criteria Results

1. [x] **Unique Task Definition:** `TASK-0001` uniquely identified with metadata, context, and scope.
2. [x] **Owner Authorization & Mode Selection:** Approved in chat and recorded in `approval-log.json` as `APR-0004` (Mode: "Antigravity implements; owner reviews before commit").
3. [x] **Real Executable Validator:** Implemented `platform/scripts/validate-task-lifecycle.ps1` enforcing transition matrix and `APPROVED_BY_OWNER` check.
4. [x] **Negative Tests Passed:**
   - Rejected invalid transition: `PROPOSED` -> `IN_PROGRESS` (skipping approval). Exit code 1.
   - Rejected unapproved target: `PENDING_OWNER_APPROVAL` -> `APPROVED` for missing ID. Exit code 1.
   - Rejected terminal state violation: `REJECTED` -> `IN_PROGRESS`. Exit code 1.
5. [x] **Positive Tests Passed:**
   - Valid transition: `PROPOSED` -> `PENDING_OWNER_APPROVAL`. Exit code 0.
   - Valid transition: `CHANGES_REQUESTED` -> `IN_PROGRESS` with valid approval. Exit code 0.
6. [x] **Clean Test Isolation:** All fixture tests executed in `brain/<conv-id>/scratch/` and cleaned up. No temporary files leaked to `D:\AI Software Company\`.
7. [x] **Synchronized State:** `STATE.md` updated and verified strictly <= 50 lines.

## Limitations & Security Notice

> [!WARNING]
> `validate-task-lifecycle.ps1` provides **workflow validation and procedural discipline**, not a technical security boundary. Because Antigravity runs with write permissions in the workspace, this script does not prevent an agent from directly modifying files. Cryptographic authorization and strict branch protection are deferred to future stages (Stage B / remote CI).

## Required Approvals

| Approval Type  | Status             | Approval ID | Approver |
|----------------|--------------------|-------------|----------|
| Scope Approval | APPROVED_BY_OWNER  | APR-0004    | Owner    |

## Relevant Files and Modules

- `docs/tasks/TASK-0001-validate-task-lifecycle.md`
- `platform/scripts/validate-task-lifecycle.ps1`
- `docs/approvals/approval-log.json`
- `STATE.md`

## Status History

| Date       | From Status              | To Status                | Notes                                                              |
|------------|--------------------------|--------------------------|--------------------------------------------------------------------|
| 2026-10-19 | —                        | PROPOSED                 | Task defined during Phase 1 foundation                             |
| 2026-10-19 | PROPOSED                 | PENDING_OWNER_APPROVAL   | Scope proposal presented to owner in chat                          |
| 2026-10-19 | PENDING_OWNER_APPROVAL   | APPROVED                 | Owner explicitly authorized execution; APR-0004 logged              |
| 2026-10-19 | APPROVED                 | IN_PROGRESS              | Implementation of validator & scratch testing                      |
| 2026-10-19 | IN_PROGRESS              | IN_REVIEW                | Testing complete (5/5 passed); submitted for mandatory owner review|
| 2026-10-19 | IN_REVIEW                | DONE                     | Owner approved final changes and authorized closure & commit       |
