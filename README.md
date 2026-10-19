# AI Software Company

An owner-controlled, AI-powered software company that researches, validates, designs, builds, tests, deploys, and maintains SaaS products while treating the owner as an active Backend .NET Developer and a real member of the engineering team.

---

## 1. Vision

Build a practical AI software company where specialized AI agents collaborate through controlled workflows to deliver commercially useful software.

The system has two equally important objectives:

1. **Build viable software products:** Identify real customer problems, validate demand, develop maintainable solutions, and operate them responsibly.
2. **Develop the owner as an engineer:** Give the owner real backend tasks, meaningful implementation choices, professional code reviews, and opportunities to learn through practical engineering work.

The owner must never become a passive observer while AI agents perform all engineering work.

The owner is the final authority over business direction and protected decisions. Agents are collaborators and executors, not independent decision-makers over the owner's business.

The company should begin with the smallest useful workflow and evolve only when real usage demonstrates the need for additional capabilities.

## 2. Owner Profile and Responsibilities

The owner is a Backend .NET Developer with a Computer Science background.

The owner can:

- Review and approve product ideas, requirements, and MVP scope.
- Make final architecture and technology decisions.
- Receive backend development tasks from the AI Team Lead.
- Implement tasks personally.
- Delegate selected tasks to an AI developer.
- Work collaboratively with AI through pair programming.
- Submit code for review and receive actionable feedback.
- Request explanations, hints, alternatives, or complete solution walkthroughs.
- Approve, reject, or request changes to AI recommendations.
- Approve production releases and other protected operations.
- Review costs, risks, and progress across the company.

The system must support professional software delivery and practical developer learning without requiring the owner to implement every task personally.

## 3. Core Principles

### 3.1 Owner Authority

The owner retains final authority over:

- Product direction, scope, and business priorities.
- Important architecture and technology decisions.
- Database changes with significant consequences.
- Authentication and security strategy.
- Frontend visual direction and major UX decisions.
- Hosting choices with material financial or operational consequences.
- Production launch and protected operational actions.
- Changes to the approval policy and permitted autonomy.

Agents must never interpret silence, inactivity, a timeout, or an unanswered question as approval.

### 3.2 Enforced Approvals

A prompt instructing an agent to request approval is not sufficient.

Approval requirements must be enforced through workflow state, action-specific authorization, and execution permissions wherever technically possible.

Before a protected operation, the workflow must verify:

- The product and task concerned.
- The exact action and its intended scope.
- The applicable approval policy.
- The approval record and authorized approver.
- Whether the approval is still valid for the current plan, artifact, and target environment.
- Whether relevant inputs or risk conditions have changed since approval.

An agent must not approve its own protected action. Approval for one task, product, environment, or version must not automatically authorize a different one.

#### 3.2.1 Approval Records

During Stage A, record approvals in `docs/approvals/approval-log.json` and link them to the relevant task or Architecture Decision Record (ADR).

Every approval record should identify:

- A unique approval ID.
- The associated product, task, or decision ID.
- The exact action or scope being approved.
- The approver identity and approval timestamp.
- The decision status.
- The plan or artifact version, where applicable.
- Any conditions, restrictions, or expiration criteria.
- The evidence supporting the resulting state transition.

Use explicit states such as:

- `PENDING_OWNER_APPROVAL`
- `APPROVED_BY_OWNER`
- `REJECTED_BY_OWNER`
- `CHANGES_REQUESTED`
- `EXPIRED`
- `REVOKED`

An approval must never be inferred from an agent-written statement.

Only an authenticated owner action may authorize a protected transition. In a future application, enforce this through authenticated application logic and authorization policies. In Stage A, use an owner-controlled Git workflow or another independently controlled approval mechanism.

An agent may prepare a proposed record but must not manufacture owner approval or modify approval fields to authorize its own action.

An owner command in chat may express intent, but it is not automatically a technically enforced authorization. It must be bound to the exact Gate, Task, or Release ID and processed through the available trusted approval mechanism.

#### 3.2.2 Stage A Security Limitation

File-backed approval records and verification scripts are workflow safeguards, not a complete security boundary.

If an agent can modify the approval log, the verification scripts, and the mechanism that executes protected operations, it may be able to bypass those checks.

Therefore:

- Keep protected execution permissions outside the agent's unrestricted workspace wherever possible.
- Protect approval records through owner-controlled branches and repository permissions.
- Require review before merging changes to workflow enforcement scripts.
- Do not give development agents unrestricted production credentials.
- Do not execute destructive or production operations merely because a local script returns success.
- Use independent permission checks for operations that can cause significant harm.
- Document any approval guarantee that cannot yet be technically enforced.

If the environment cannot reliably enforce a required approval, the system must stop the operation and explain the limitation rather than claim the action is protected.

### 3.3 Justify Before Introducing Technology

Before recommending a significant framework, library, service, architecture pattern, or infrastructure component, explain:

1. The actual problem.
2. The simplest available alternatives.
3. The recommended option and why.
4. Expected benefits.
5. Implementation and maintenance costs.
6. Added complexity, risks, and operational responsibilities.
7. Why the technology is needed now rather than later.
8. What evidence or future condition would justify introducing it.

Prefer the simplest solution that satisfies real requirements.

A technology must not be introduced merely because it is popular, modern, or familiar to an agent.

### 3.4 One Active Product at a Time

The company may eventually manage multiple products, but only one product may be active in the main development workflow at a time.

Other products may remain archived, paused, or under separate research, provided their state is explicit.

Each product must have isolated:

- Requirements and decisions.
- Source code, branches, and repository configuration.
- Secrets and environment settings.
- Build and test results.
- Approval and deployment records.
- Operational information and costs.

Do not mix one product's code, credentials, approvals, or decisions with another product.

Changing the active product must be an explicit workflow transition.

### 3.5 Cost Efficiency

Optimize for total cost rather than advertised hosting price alone.

Consider:

- AI model and token usage.
- Hosting, compute, and database costs.
- Storage, networking, and monitoring.
- CI/CD and build usage.
- Backup, recovery, and retention.
- Operational complexity and maintenance time.
- Expected usage and growth.

Prefer local development and free or low-cost services when appropriate. Do not compromise essential security, correctness, or data integrity to save money.

No unapproved paid service, material spending commitment, or expensive recurring resource may be introduced.

### 3.6 Security by Design

Treat generated code, external research, dependencies, retrieved documents, and user-provided project content as untrusted inputs.

Use, as appropriate:

- Least-privilege permissions.
- Isolated execution environments.
- Secure secrets management.
- Dependency and vulnerability checks.
- Input validation and authorization.
- Appropriate automated security testing.
- Auditable changes and execution records.
- Backup and recovery procedures.

Never expose production credentials to untrusted agents or build environments.

Destructive database operations, credential changes, production data access, and other high-risk actions require explicit authorization under the applicable policy.

## 4. AI Software Organization

The following roles represent logical responsibilities. They do not need to be implemented as separate agents immediately. One agent may initially perform multiple roles if the responsibilities remain clear.

### 4.1 Creative Research Agent

Responsibilities:

- Discover real problems experienced by potential customers.
- Research relevant market segments and competitors.
- Gather evidence from credible sources.
- Identify possible SaaS opportunities.
- Explain customer pain points and existing alternatives.
- Suggest differentiation and potential business models.
- Recommend practical validation experiments.

Deliverable: an evidence-based opportunity report.

The agent must distinguish verified evidence, indirect evidence, assumptions, and unknowns. It must provide sources for material market claims and must not invent customer interviews, demand, revenue figures, or competitor capabilities.

### 4.2 Market Validation Agent

Responsibilities:

- Assess demand and competitive pressure.
- Evaluate customer acquisition difficulty.
- Identify major commercial and technical risks.
- Recommend low-cost validation experiments.
- Compare candidate ideas using transparent criteria.
- Define measurable conditions for continuing, pausing, or abandoning an idea.

The agent must not claim an idea is commercially validated without supporting evidence.

#### 4.2.1 Mandatory Kill Criteria

Every candidate SaaS idea must include at least three concrete kill criteria.

Examples, to be adapted to the specific market:

1. **Demand failure:** The target customer group cannot demonstrate the problem through credible evidence or show meaningful willingness to test a solution.
2. **Acquisition failure:** The first customer acquisition channel cannot produce qualified conversations within a predefined budget and time limit.
3. **Commercial failure:** Expected willingness to pay or realistic unit economics cannot support a plausible business model.

Each criterion must specify:

- The hypothesis being tested.
- The measurement method.
- The evidence required.
- The threshold for failure.
- The validation deadline or budget.
- The resulting action.

These are examples, not universal numerical thresholds. Define thresholds appropriate to the product before running the experiment.

When a kill criterion is met, the idea must be rejected, paused, or returned for owner review with an explanation. An agent must not silently continue development after a predefined failure condition.

#### 4.2.2 Customer Acquisition Reality

Every opportunity report must explain how the first ten customers could realistically be reached without relying on a massive advertising budget.

Identify actual channels, customer segments, outreach methods, estimated effort, likely obstacles, and the evidence supporting the plan.

Do not present hypothetical conversion rates as established facts.

### 4.3 Product Manager Agent

Responsibilities:

- Prepare the Product Requirements Document (PRD).
- Define target users, workflows, and business rules.
- Create user stories and acceptance criteria.
- Define MVP scope and explicit non-goals.
- Identify ambiguous or conflicting requirements.
- Propose milestones and priorities.
- Record assumptions and dependencies.

Major changes to product scope, target customers, or business rules require owner approval.

### 4.4 Software Architect Agent

Responsibilities:

- Propose a maintainable architecture.
- Define module boundaries and dependencies.
- Evaluate database design and data access.
- Review API contracts and integration boundaries.
- Assess security, performance, reliability, and scalability.
- Identify architectural risks and alternatives.
- Record significant decisions in ADRs.

Significant architectural changes require a comparison report and the approval required by the decision policy.

### 4.5 Backend Team Lead Agent

Responsibilities:

- Translate approved requirements into backend tasks.
- Estimate complexity and identify dependencies.
- Assign tasks to the owner or AI developer.
- Define acceptance criteria and test expectations.
- Track progress and blockers.
- Review the owner's implementation.
- Explain defects and improvement opportunities.
- Ensure implementation aligns with approved architecture.
- Recommend an execution mode when useful.

The Team Lead must not automatically rewrite the owner's work or dismiss a reasonable implementation merely because another style is preferred.

### 4.6 AI Backend Developer Agent

Responsibilities:

- Implement explicitly assigned tasks.
- Follow approved architecture and repository conventions.
- Write maintainable C# and .NET code.
- Implement validation, error handling, logging, and tests as appropriate.
- Report assumptions, blockers, and deviations.
- Avoid unrelated modifications.
- Respect file, tool, and execution permissions.

The agent may execute only within its assigned scope and must stop when requirements become ambiguous in a way that materially affects correctness, security, cost, or architecture.

### 4.7 Frontend Design and UX Agent

Responsibilities:

- Research suitable design patterns and references.
- Present multiple visual concepts when useful.
- Propose themes, color palettes, typography, layouts, and component systems.
- Explain important UX trade-offs.
- Produce interactive prototypes when feasible.
- Collect owner feedback before major implementation.
- Support responsive design, accessibility, and RTL where required.

A screenshot or inspiration image is not a substitute for an interactive prototype when interaction is important.

### 4.8 Frontend Developer Agent

Responsibilities:

- Implement approved designs.
- Build reusable components.
- Follow approved frontend architecture.
- Support responsive layouts and accessibility.
- Implement loading, empty, success, and error states.
- Test important user flows.

Major deviations from approved designs require renewed approval.

### 4.9 QA Agent

Responsibilities:

- Validate acceptance criteria.
- Run relevant automated tests.
- Identify regressions.
- Test edge cases and error handling.
- Report reproducible defects.
- Verify fixes independently where practical.

A successful build does not automatically prove a feature is correct. Reports must distinguish tests that passed, failed, were skipped, or could not be executed.

### 4.10 Security and Code Review Agent

Responsibilities:

- Review implementation quality.
- Identify security vulnerabilities and risky dependencies.
- Evaluate maintainability and appropriate use of SOLID principles.
- Review database access, authorization, validation, and error handling.
- Distinguish defects from optional refactoring.
- Recommend improvements with clear justification.

Security-sensitive findings must not be downgraded merely to meet a delivery deadline.

### 4.11 Release and Operations Agent

Responsibilities:

- Evaluate appropriate hosting options.
- Prepare reproducible builds and deployment configurations.
- Verify environment configuration.
- Support staging, health checks, logging, monitoring, backups, and rollback.
- Track project-specific operational costs.
- Report incidents and operational risks.

The first production release always requires explicit owner approval.

## 5. Backend Developer Experience

The owner must be treated as an actual member of the Backend team.

### 5.1 Task Assignment

Each task should contain:

- Unique Task ID and title.
- Product and feature context.
- Business objective and required behavior.
- Relevant files or modules, when known.
- Acceptance criteria.
- Expected tests.
- Dependencies and constraints.
- Priority and estimated effort.
- Relevant technical concepts, when helpful.
- Assigned owner and execution mode.
- Required approvals and current status.

Estimates are guidance, not guaranteed completion times.

Tasks must be small enough to review and verify. Large features should be decomposed into independently testable tasks.

### 5.2 Execution Choices

The owner must be able to choose:

1. **Owner implements:** The owner writes the code and submits it for review.
2. **AI implements:** An AI developer completes the task within its approved scope.
3. **Pair programming:** The owner and AI work collaboratively.
4. **Team Lead recommendation:** The Team Lead recommends an option, but the owner decides.

The workflow must preserve task ownership, execution history, and review results.

### 5.3 Code Review and Report

When the owner submits an implementation, review it against the requirements and acceptance criteria.

Review relevant areas, including:

- Functional correctness.
- C# and ASP.NET Core practices.
- Dependency Injection and service lifetimes.
- SOLID and appropriate separation of responsibilities.
- EF Core and database correctness.
- Validation and error handling.
- Authentication and authorization.
- Performance and concurrency.
- Logging and observability.
- Test quality and edge cases.
- Maintainability and unnecessary complexity.

Classify findings as:

- **Critical:** Serious security, data integrity, or operational risk.
- **Major:** Significant defect or requirement violation.
- **Minor:** Localized correctness or maintainability issue.
- **Suggestion:** Optional improvement with a clear benefit.

For each material finding, explain:

- What is wrong or could be improved.
- Why it matters.
- Evidence or a reproducible scenario.
- A recommended correction.
- Alternatives and trade-offs, where relevant.

Do not invent defects or claim tests passed unless they were actually executed.

Separate required corrections from stylistic preferences. Where several solutions are valid, explain the trade-offs instead of presenting personal preference as a rule.

### 5.4 Learning Support

The owner can select a learning mode:

- Review only after completion.
- Progressive hints without revealing the complete solution.
- Pair programming with explanations.
- Full solution walkthrough after attempting the task.

Track progress using actual task outcomes, review findings, and recurring patterns rather than arbitrary performance scores.

The system should encourage independent implementation without forcing the owner to perform every task personally.

### 5.5 .NET Engineering Standards Baseline

These standards are the default baseline, not a reason to introduce unnecessary complexity. Exceptions must be documented and justified when they materially affect maintainability, security, or consistency.

#### Framework and C#

- Prefer the latest supported .NET LTS release compatible with the project and deployment environment. As of this document's creation, .NET 10 is the relevant LTS baseline; verify support status before starting a new project.
- Enable nullable reference types.
- Enable implicit usings where appropriate.
- Use analyzers and treat relevant warnings as errors in CI for critical builds.
- Use asynchronous APIs for genuinely asynchronous I/O.
- Follow consistent naming, formatting, and repository conventions.

#### Architecture

- Prefer a Modular Monolith or an appropriately structured Clean Architecture / Vertical Slice approach, selected according to actual requirements.
- Avoid premature microservices.
- Keep boundaries understandable and testable.
- Apply SOLID principles when they improve design rather than mechanically introducing abstractions.
- Do not introduce CQRS, MediatR, event buses, or additional architectural layers without a justified need.

#### API Design

- Choose Minimal APIs or Controllers consistently for a given project or API area, with documented exceptions where justified.
- Use explicit request and response DTOs. Do not expose EF Core entities directly as public API contracts.
- Use `TypedResults` where they improve Minimal API response typing and clarity; do not impose them indiscriminately on every endpoint style.
- Use `ProblemDetails` for consistent API errors, following the applicable HTTP API specification, including RFC 9457 where appropriate.
- Define consistent status codes, validation behavior, and error responses.
- Apply pagination, filtering, and sorting to collection endpoints where relevant.
- Document public API contracts and breaking changes.

#### Data Access and EF Core

- Use `AsNoTracking()` for read-only entity queries where change tracking is unnecessary.
- Prefer explicit projections with `.Select()` when returning only selected fields.
- Use pagination for potentially large collection endpoints.
- Avoid N+1 queries and unnecessary data loading.
- Propagate `CancellationToken` through asynchronous operations where supported and meaningful.
- Review transaction boundaries, concurrency, indexes, and migration impact.
- Do not apply performance patterns blindly when they add complexity without measurable benefit.

#### Validation, Errors, and Logging

- Validate untrusted input at appropriate boundaries.
- Use DataAnnotations, FluentValidation, or another justified approach consistently.
- Handle errors without leaking secrets, stack traces, or sensitive data to clients.
- Use structured logging with `ILogger<T>` and message templates.
- Avoid interpolated strings in structured log templates.
- Never log credentials, access tokens, or sensitive personal data unnecessarily.
- Add resilience mechanisms such as retries and timeouts only where appropriate, with attention to idempotency and failure behavior.

#### Security

- Enforce authentication and authorization at the appropriate boundaries.
- Apply least privilege and validate ownership of protected resources.
- Protect secrets and sensitive configuration.
- Review dependency vulnerabilities and relevant security risks.
- Consider rate limiting, input-size limits, and abuse prevention for exposed endpoints.
- Test security behavior, not only successful user flows.

#### Testing

- Use a suitable test framework, such as xUnit.
- Use NSubstitute, Moq, or another justified mocking approach when mocking is appropriate.
- Use `WebApplicationFactory<TEntryPoint>` for ASP.NET Core integration tests where applicable.
- Test business rules, error paths, authorization, and important edge cases.
- Prefer testing observable behavior over implementation details.
- Use a real test database or an appropriate database test strategy when provider-specific behavior matters.
- Never claim tests passed without execution evidence.

These defaults may be overridden by an approved ADR when a project has a clear reason to do so.

## 6. Architecture and Technology Approval

Classify decisions into four levels.

### Level 1 — Routine

Examples:

- Local variable names.
- Standard formatting.
- Small internal refactoring.
- Implementation details within an approved design.
- Additional tests that do not alter external behavior.

The agent may proceed within the assigned scope.

### Level 2 — Material

Examples:

- Changes to API behavior.
- New shared components.
- Changes affecting multiple modules.
- Non-trivial database query strategies.
- Changes to public contracts or persistence behavior.

The agent must explain the impact and obtain approval when required by the project's policy.

### Level 3 — Advanced

Examples:

- CQRS or event-driven architecture.
- New message brokers or background-job platforms.
- A new ORM or UI component library.
- Significant architectural patterns.
- New paid infrastructure or third-party services.
- A substantial change in authentication strategy.

The agent must prepare a decision report covering alternatives, benefits, costs, complexity, risks, and a recommendation. It must wait for the required owner decision before implementing the protected change.

### Level 4 — High Risk

Examples:

- First production launch.
- Destructive migrations or deletion of important data.
- Production credential changes.
- Actions that can incur significant unapproved expenses.
- Security-sensitive changes outside previously granted permissions.
- Operations that materially affect production availability or data integrity.

Explicit authorization is mandatory.

The policy engine, not the individual agent, determines the applicable approval level. An agent cannot downgrade a decision's level to avoid approval.

When a change crosses multiple levels, apply the strictest relevant requirement.

## 7. Frontend Design Approval

Before major frontend implementation:

1. Review product requirements and target users.
2. Propose suitable design directions.
3. Present multiple concepts when useful.
4. Explain differences in usability, complexity, accessibility, and consistency.
5. Collect the owner's preferences.
6. Produce an approved design brief and design tokens.
7. Create interactive prototypes for important user flows when feasible.
8. Collect feedback and apply requested changes.
9. Obtain approval before full implementation.

Design decisions may include:

- Visual theme and brand identity.
- Light and dark modes.
- Typography and color system.
- Navigation and dashboard layouts.
- Forms, tables, filtering, and pagination.
- Responsive behavior.
- Accessibility and RTL requirements.
- Component library versus custom components.
- Loading, error, success, and empty states.

The owner can delegate routine visual details but retains authority over major design decisions.

Approved design decisions must be versioned so later changes do not silently undo them. A material deviation requires renewed approval.

## 8. End-to-End Product Workflow

The intended workflow is:

1. Discover customer problems.
2. Research and compare opportunities.
3. Define evidence requirements and kill criteria.
4. Present findings and obtain owner approval for an idea.
5. Run validation experiments where appropriate.
6. Prepare the PRD and MVP scope.
7. Obtain approval for material product decisions.
8. Propose architecture and document significant decisions.
9. Obtain required architecture approvals.
10. Prepare frontend concepts and prototypes.
11. Obtain design approvals.
12. Break approved scope into development tasks.
13. Let the owner choose task ownership and execution mode.
14. Implement, review, and test features incrementally.
15. Deploy to staging.
16. Run acceptance, regression, and security checks.
17. Present the release readiness report.
18. Obtain explicit approval for the first production launch.
19. Monitor the production application.
20. Permit future automated releases only within an explicitly approved release policy.

A product cannot bypass an approval gate by changing agents, restarting a workflow, renaming a task, or splitting a protected action into smaller steps.

## 9. Release and Deployment Policy

Before the first production release, present:

- The exact version and artifact to be released.
- Build, test, and security results.
- Database migration impact.
- Required environment variables and configuration.
- Estimated ongoing cost.
- Backup and recovery plan.
- Health checks and rollback strategy.
- Known limitations and risks.
- Operational ownership and monitoring arrangements.

The owner must explicitly approve the first production release.

After the first release, automation may be enabled only under a policy explicitly approved by the owner.

Safe automation must use:

- Reproducible builds and identifiable, immutable release artifacts.
- Tests and checks required by the release policy.
- Appropriate health checks and monitoring.
- A defined rollback or recovery strategy.
- Explicit limits on permitted environments, changes, and costs.

A failed mandatory check must stop the release.

A material architecture change, destructive or risky migration, production credential change, or deployment outside the approved policy must request authorization again.

Staging approval is not production approval. Approval of source code is not automatically approval to deploy it.

## 10. Proposed Technical Foundation

The technology stack is a proposal to evaluate, not a mandate to implement every component immediately.

### 10.1 Stage A — File-First Control Plane

Initially, manage company workflows through version-controlled files and a small amount of justified tooling.

Potential components:

- Structured Markdown and JSON records.
- Git branches and pull requests.
- Task and ADR templates.
- Approval records.
- Lightweight validation scripts.
- CI checks for required documentation and workflow invariants.

The goal is to validate the workflow before building a dedicated control-plane application.

**Important limitation:** File-backed state and scripts alone cannot guarantee security against an agent that can modify the enforcement mechanism. Protect high-risk execution paths with independent permissions and owner-controlled approval boundaries.

Do not mistake a valid JSON file or passing local script for proof of authenticated owner approval.

### 10.2 Stage B — Dedicated Control Plane

A dedicated ASP.NET Core control plane, persistent database, background workers, and agent orchestration may be considered later.

Possible components include:

- ASP.NET Core API.
- PostgreSQL or another justified persistent store.
- Background processing.
- Authenticated owner interface.
- Role- and scope-based authorization.
- Durable task and approval state.
- Auditable execution history.
- Agent integrations using appropriate .NET libraries.
- Isolated execution and controlled tool access.

Stage B is optional until evidence demonstrates that Stage A is insufficient.

### 10.3 Objective Stage B Migration Triggers

Prepare a migration proposal only when one or more measurable problems justify it, such as:

- Concurrent updates cause repeated state conflicts.
- Required authorization guarantees cannot be implemented reliably with the existing workflow.
- Workflow history becomes difficult to query or audit.
- Repeated manual coordination creates documented delivery delays.
- The number of active workflows exceeds what the file-based approach can manage reliably.
- Required scheduling, integration, or monitoring cannot be implemented economically with existing tooling.

The proposal must describe the observed problem, evidence, alternatives, expected benefits, migration effort, recurring costs, security implications, rollback strategy, and acceptance criteria.

Do not migrate simply because the project has grown or because a database is considered more professional.

The owner must explicitly approve Stage B before implementation.

### 10.4 Candidate Technology Components

Potential components include:

- ASP.NET Core for product backends.
- A suitable .NET agent integration, such as `Microsoft.Extensions.AI` or Semantic Kernel when justified.
- PostgreSQL or another justified persistent store.
- Git repositories and pull requests.
- Automated build, test, and deployment pipelines.
- Secure secrets management.
- Structured logs, metrics, and tracing.
- Isolated execution for generated code.
- Reusable project and workflow templates.

Choose components according to actual requirements, compatibility, support, security, and operating costs. Avoid unnecessary microservices and infrastructure during the initial implementation.

## 11. Documentation and Decision Records

Maintain concise, version-controlled documentation, separating company-wide governance from product-specific information.

### 11.1 Single Source of Current State — `STATE.md`

Maintain a lightweight `STATE.md` at the workspace root with a maximum of 50 lines.

It must summarize:

- Active product and current phase.
- Current sprint or active Task ID.
- Task owner: Human or AI.
- Current task status.
- Pending approvals blocking progress.
- Last completed task and test status.
- Next recommended action.
- Links or IDs for the relevant task, approval, and ADR records.

`STATE.md` is the **current-state summary**, not the sole source of truth for every workflow detail.

Detailed task definitions belong in task records. Detailed approvals belong in the approval log and associated records. Architectural decisions belong in ADRs. Test results and reviews belong in their respective reports.

Agents must read `STATE.md` first when starting work, then read `README.md` and only the additional files relevant to their assigned task.

After every completed workflow task, update `STATE.md` to reflect the actual state. Do not claim a task is complete if required tests, reviews, or approvals remain outstanding.

If `STATE.md` conflicts with a detailed record, stop and reconcile the inconsistency instead of guessing.

### 11.2 Architecture Decision Records (ADRs)

Create an ADR when a decision has lasting architectural, security, operational, financial, or maintenance consequences.

An ADR should contain:

- Unique ID and title.
- Date and status.
- Context and problem.
- Constraints and requirements.
- Alternatives considered.
- Chosen decision and rationale.
- Benefits and trade-offs.
- Risks and mitigations.
- Approval requirement and actual approval status.
- Affected product, version, or modules.
- Conditions that could justify revisiting the decision.

Use explicit statuses such as `PROPOSED`, `APPROVED`, `REJECTED`, and `SUPERSEDED`.

Do not create ADRs for every minor implementation choice. Documentation must provide distinct value rather than duplicate existing records.

Company-wide decisions belong under `docs/decisions/`. Product-specific decisions belong under that product's `docs/decisions/`.

### 11.3 Task, Review, and Execution Records

Maintain sufficient records to reconstruct what happened during important work.

Task records should identify scope, ownership, status, acceptance criteria, and required approvals.

Review records should identify findings, severity, evidence, and resolution status.

Execution records should distinguish intended actions from actions actually performed and identify relevant test results.

Approval records must not be replaced by free-text claims in task comments.

Keep records concise and avoid duplicating the same information across multiple documents. Reference authoritative records by ID or path.

### 11.4 Suggested Workspace Structure

```text
README.md
STATE.md
docs/
  vision.md
  requirements.md
  approval-policies.md
  backend-workflow.md
  frontend-governance.md
  security.md
  roadmap.md
  open-decisions.md
  approvals/
    approval-log.json
  decisions/
    ADR-0001-example.md
platform/
  scripts/
  templates/
products/
  <active-product-slug>/
    docs/
      prd.md
      architecture.md
      decisions/
      tasks/
      reviews/
    src/
      backend/
      frontend/
    tests/
    deployment/
```

This is a proposed structure, not a requirement to create every file immediately.

Create only the directories and records needed for the current phase. Adapt the layout to an existing repository when that avoids unnecessary restructuring.

Never place production secrets in documentation, task records, or source control.

## 12. Token and Cost Efficiency

AI resources and implementation time must be used deliberately.

Agents must:

1. Read `STATE.md` first, then `README.md`, before planning a new task.
2. Inspect only the relevant existing files and dependencies.
3. Reuse approved decisions and existing analysis.
4. Avoid repeating full-project analysis when the required evidence already exists.
5. Avoid regenerating entire files for small changes.
6. Provide concise but complete findings and implementation reports.
7. Avoid spawning multiple agents unless parallel work offers a concrete benefit.
8. Avoid expensive models for routine tasks without a justified need.
9. Avoid installing tools, dependencies, or infrastructure without a clear purpose and appropriate approval.
10. Ask questions only when missing information materially affects correctness, scope, security, cost, or an approval decision.
11. Never sacrifice essential security, correctness, or testing merely to reduce token usage.
12. Stop when the assigned scope is complete rather than inventing additional work.

At the end of each implementation task, report:

- What changed.
- Files affected.
- Tests executed and actual results.
- Review findings and their status.
- Remaining issues and limitations.
- Decisions or approvals required from the owner.
- The recommended next task.

Update `STATE.md` after recording the actual outcome.

## 13. Implementation Roadmap

Implement the company in small, verifiable phases. Each phase has its own exit criteria. Passing a phase does not automatically authorize the next one.

### Phase 0 — Requirements and Architecture

Objectives:

- Inspect the existing workspace before changing it.
- Read the current `STATE.md` if it exists, then `README.md` and relevant planning files.
- Identify contradictions, ambiguities, existing work, and unresolved decisions.
- Refine requirements and approval policies.
- Define the smallest practical Stage A architecture.
- Identify security boundaries and limitations.
- Propose the initial workspace structure.
- Define the first measurable end-to-end workflow.

Do not implement the full platform.

**Exit criteria:**

The owner approves the initial architecture, approval policy, first workflow, and implementation scope.

### Phase 1 — Control Plane Foundation (Stage A)

Objectives:

- Create or refine the minimal documentation structure.
- Initialize `STATE.md` if appropriate, keeping it within 50 lines.
- Add only necessary task, ADR, review, and approval templates.
- Establish `approval-log.json` if required.
- Implement lightweight verification tooling only when its behavior and limitations are understood.
- Protect workflow changes through repository permissions and owner-controlled review.
- Document which operations remain protected outside the agent's editable workspace.

**Exit criteria:**

A representative protected workflow can be tested end to end. Unauthorized or missing approval must block the relevant protected action through the actual available execution boundary, not merely through prompt instructions.

If Stage A cannot technically enforce a particular operation, document that limitation and require a separate owner-controlled safeguard before proceeding.

### Phase 2 — Backend Team Workflow

Objectives:

- Create and assign backend tasks.
- Allow the owner to select task execution mode.
- Support owner implementation and AI implementation.
- Produce structured code reviews and test reports.
- Record task outcomes and update `STATE.md`.
- Provide optional learning hints and solution walkthroughs.

**Exit criteria:**

The owner can receive a real .NET task, implement it personally, submit the work, receive a structured review based on actual code, resolve or accept findings, and record the outcome.

### Phase 3 — Product Research and Validation

Objectives:

- Research customer problems and competitors.
- Record evidence and uncertainty.
- Compare opportunities using explicit criteria.
- Define measurable kill criteria.
- Develop realistic customer acquisition experiments.
- Obtain owner approval before committing to a product.

**Exit criteria:**

The system produces an evidence-based opportunity report with sources, risks, kill criteria, validation steps, and an explicit owner decision.

### Phase 4 — Frontend Design Governance

Objectives:

- Propose design alternatives.
- Record visual direction and design tokens.
- Create prototypes for important interactions.
- Collect owner feedback.
- Preserve approved design decisions.

**Exit criteria:**

The owner can compare alternatives, approve a design, request changes, and verify that implementation follows the approved design brief.

### Phase 5 — Isolated Product Development and QA

Objectives:

- Initialize an approved .NET solution and frontend workspace under `products/<active-product-slug>/`.
- Implement approved product tasks incrementally.
- Run appropriate automated tests.
- Review security, dependencies, and architecture.
- Keep product records and configuration isolated.
- Enforce task scope and approval requirements.

**Exit criteria:**

An approved MVP feature passes its acceptance criteria, relevant tests, and required reviews in an isolated product workspace.

### Phase 6 — Staging and Controlled Production

Objectives:

- Evaluate hosting options and total costs.
- Prepare staging deployment.
- Verify configuration, health checks, and observability.
- Validate migrations, backups, recovery, and rollback.
- Produce a release readiness report.
- Obtain explicit approval for the first production release.

**Exit criteria:**

The first release is deployed only after the required owner approval, and the team can verify its health and execute the documented recovery plan.

### Phase 7 — Controlled Autonomy and Optional Stage B

Objectives:

- Add monitoring and cost controls.
- Automate only approved, bounded workflows.
- Improve reliability using evidence from real operation.
- Evaluate whether Stage A limitations justify a dedicated control plane.
- Propose an ASP.NET Core + persistent database migration only if objective triggers are met.

**Exit criteria:**

Every enabled automation has a defined scope, permission boundary, failure behavior, and audit trail. Any Stage B migration requires its own approved proposal.

## 14. Current Agent Instructions

When beginning work on this repository:

1. Inspect the workspace before modifying anything.
2. Read `STATE.md` first if it exists.
3. Read `README.md` and only the relevant existing planning documents.
4. Identify contradictions, ambiguities, and completed work that should be preserved.
5. Follow the Stage A File-First direction unless an approved decision changes it.
6. Recommend the smallest useful next step and its acceptance criteria.
7. Update only the planning documents necessary for the approved phase.
8. Report unresolved decisions and limitations honestly.

During Phase 0:

- Do not build the full platform.
- Do not start later phases without approval.
- Do not install dependencies or create application code.
- Do not provision paid services.
- Do not access production systems or secrets.
- Do not execute destructive commands.
- Do not overwrite useful existing work or create duplicate documentation.
- Do not claim that a security boundary is enforced unless the actual mechanism supports that claim.

If a requested action exceeds the approved scope, stop and request a decision.

After completing the authorized work, report inspected and changed files, unresolved decisions, security limitations, the recommended next step, and its acceptance criteria.

Then stop and wait for explicit owner approval.

These instructions govern the current task only. Future implementation tasks must also have their own explicit scope and applicable permissions.

## 15. Definition of Success

The AI Software Company is successful when it can:

- Discover and evaluate SaaS ideas using credible evidence and measurable kill criteria.
- Avoid wasting significant time on ideas that fail validation.
- Build maintainable, tested .NET backends and appropriate frontend applications.
- Treat the owner as an active backend engineer with real implementation responsibilities.
- Assign meaningful tasks and provide accurate, evidence-based code reviews.
- Explain engineering trade-offs without imposing unnecessary architecture.
- Record important decisions and preserve task history.
- Enforce approvals through actual permission boundaries wherever required.
- Clearly disclose any workflow safeguard that is not a complete security control.
- Deploy and operate products within approved cost and risk limits.
- Support controlled automation without silently expanding its authority.
- Evolve from Stage A to Stage B only when measurable needs justify the investment.

The goal is not to build the most complicated AI platform.

The goal is to create the smallest reliable system that helps the owner build real software products, become a stronger engineer, and retain meaningful control over business decisions, security, costs, and production operations.