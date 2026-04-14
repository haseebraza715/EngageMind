# Thesis Documentation and Diagram Modernization Plan

## 1) Direct answer: Mermaid support

### Short answer
- Mermaid works for Markdown documentation in this repository and on GitHub-style renderers.
- Mermaid does not natively compile inside the current LaTeX thesis pipeline.

### Practical policy to use
- For Markdown files: keep diagrams as Mermaid blocks.
- For LaTeX thesis chapters: generate image artifacts from Mermaid (SVG or PNG), then include those images with includegraphics.
- Keep one source-of-truth per diagram in Mermaid format under a dedicated folder, then export to images for thesis usage.

### Recommended diagram source folder
- EngageMind/docs/diagrams-src/

### Recommended exported diagram folder for thesis
- ELTE_FI_Thesis_Template/images/engagemind/

## 2) Modernization objective

Refresh all documentation and diagrams so that:
- Architecture and flows match the current implementation.
- Outdated or unsupported statements are removed.
- Writing quality is improved while preserving existing chapter structure.
- Thesis visuals are modernized and consistent with the latest app behavior.

Scope includes:
- Thesis files in ELTE_FI_Thesis_Template
- Root and service docs in EngageMind, backend, frontend, and rag modules

## 3) File-by-file execution scope

### A. Thesis template files

#### ELTE_FI_Thesis_Template/elteikthesis_en.tex
Planned updates:
1. Clean preamble hygiene issues without changing chapter structure.
2. Remove duplicated/incompatible preamble declarations if present.
3. Keep chapter order unchanged.
4. Ensure figure paths resolve cleanly to refreshed image assets.

Reason:
- This file controls compilation stability for all refreshed diagrams and screenshots.

#### ELTE_FI_Thesis_Template/chapter2_userdocumentation.tex
Planned updates:
1. Revalidate all user-flow text against the current frontend behavior.
2. Replace outdated screenshot references with recaptured current screenshots using same filenames where possible.
3. Remove unsupported claims and dead flow references.
4. Tighten troubleshooting to match current services and launcher behavior.
5. Keep current section structure and headings.

Primary visuals to refresh:
- landing_page.png
- register.png
- login_main.png
- chat_interface.png
- chat_Example1.png
- chat_Example2.png
- chat_Example3.png

#### ELTE_FI_Thesis_Template/chapter3_developerdocumentation.tex
Planned updates:
1. Replace stale architecture explanation with current multi-service topology.
2. Replace old architecture image with regenerated up-to-date diagram.
3. Update API, persistence, and training sections to match current contracts.
4. Remove deprecated references and unsupported implementation notes.
5. Keep structure and writing style aligned with thesis narrative.

Primary diagram targets:
- engagemind_architecture.png
- optional developer-flow diagram replacement if currently referenced

#### ELTE_FI_Thesis_Template/elteikthesis.bib
Planned updates:
1. Add missing references used in updated content.
2. Remove unused or stale references if no longer cited.
3. Verify all citation keys resolve.

### B. Root-level project docs

#### EngageMind/README.md
Planned updates:
1. Align quick start and manual start commands with current launcher behavior.
2. Reflect current worker invocation details and caveats.
3. Ensure troubleshooting section matches observed failure domains.
4. Improve wording consistency and remove stale notes.

#### EngageMind/ARCHITECTURE.md
Planned updates:
1. Keep Mermaid format and refresh topology if needed.
2. Ensure sequence flow matches current auth/chat/upload/fine-tune behavior.
3. Ensure failure-domain section maps to real runtime logs.
4. Keep document concise and defense-ready.

### C. Backend docs

#### EngageMind/engagemind-backend/README.md
Planned updates:
1. Verify endpoint list against actual routes.
2. Verify scripts and commands against package scripts.
3. Remove unsupported behavior claims.
4. Tighten thesis alignment notes and error behavior details.

#### EngageMind/engagemind-backend/ARCHITECTURE.md
Planned updates:
1. Refresh Mermaid diagrams for current route and middleware flow.
2. Ensure OAuth and JWT narrative matches current behavior.
3. Keep same structure but modernize content precision.

### D. Frontend docs

#### EngageMind/engagemind-frontend/README.md
Planned updates:
1. Verify API URL/env contract and protected-route behavior.
2. Verify test command list against package scripts.
3. Update training status flow wording to current semantics.
4. Remove any stale demo statements.

#### EngageMind/engagemind-frontend/ARCHITECTURE.md
Planned updates:
1. Keep Mermaid diagrams but update if flow changed.
2. Ensure token lifecycle and API-client behavior are accurate.
3. Keep concise architecture wording for thesis traceability.

### E. RAG and fine-tune docs

#### EngageMind/engagemind-rag/README.md
Planned updates:
1. Verify environment variables against actual runtime usage.
2. Update fine-tune worker command guidance to current stable approach.
3. Ensure status semantics and troubleshooting match current behavior.
4. Remove unsupported details and stale known issues.

#### EngageMind/engagemind-rag/ARCHITECTURE.md
Planned updates:
1. Keep Mermaid diagrams and modernize component-level flow details.
2. Ensure retrieval, evaluator, fallback, and fine-tune descriptions match code.
3. Keep reliability notes consistent with current defaults and constraints.

## 4) Diagram modernization strategy

### Diagram categories to modernize
1. System architecture diagram
2. User/auth/chat flow diagram
3. Fine-tune lifecycle diagram
4. Optional sequence diagrams for thesis chapter 3

### Standards for all updated diagrams
- One visual style across all diagrams
- Consistent service names and port labels
- Explicit storage and queue dependencies
- Clear arrows and directional flow
- Same terminology as docs and APIs

### Source and export process
1. Author Mermaid source under EngageMind/docs/diagrams-src/
2. Export SVG and PNG from Mermaid source
3. Use PNG/SVG in thesis LaTeX includes
4. Keep source diagram and exported artifact names synchronized

## 5) Line-by-line outdated-content audit protocol

For each documentation file:
1. Read every section line-by-line.
2. Classify each statement as:
   - Valid
   - Needs update
   - Unsupported/outdated
3. Action rules:
   - Valid: keep
   - Needs update: rewrite with current behavior
   - Unsupported/outdated: remove
4. Never keep statements that cannot be traced to code, config, or runtime behavior.

### Deletion criteria
Delete lines when:
- Feature no longer exists
- Command is no longer valid
- Endpoint contract changed
- Runtime behavior contradicts the statement
- Tooling requirement is deprecated or inaccurate

### Keep criteria
Keep lines when:
- They remain accurate and useful
- They align with current implementation
- They support thesis clarity and evaluation

## 6) Writing and structure quality rules

- Preserve existing chapter and section hierarchy.
- Improve sentence clarity and remove ambiguity.
- Keep technical claims concrete and verifiable.
- Use consistent naming across frontend/backend/rag/fine-tune docs.
- Keep thesis tone formal and concise.

## 7) Phased execution plan

### Phase 1: Baseline and consistency map
Deliverables:
1. Current-accuracy matrix per file
2. Outdated-lines list by file
3. Diagram inventory and replacement map

### Phase 2: Diagram source refresh
Deliverables:
1. New Mermaid source files under docs/diagrams-src
2. Exported diagram images for thesis
3. Updated architecture and flow references in Markdown docs

### Phase 3: Thesis chapter refresh
Deliverables:
1. Updated chapter2_userdocumentation.tex
2. Updated chapter3_developerdocumentation.tex
3. Updated image assets

### Phase 4: Service documentation refresh
Deliverables:
1. Updated root, backend, frontend, rag README and ARCHITECTURE files
2. Removal of stale sections and commands

### Phase 5: Validation and final pass
Deliverables:
1. Thesis compiles successfully
2. All figure references resolve
3. Documentation consistency checklist passes

## 8) Validation gates

### Gate A: Technical correctness
- Every API endpoint in docs exists in code.
- Every command in docs runs as written.
- Every architecture claim maps to implementation.

### Gate B: Diagram correctness
- Labels and arrows reflect actual runtime dependencies.
- No orphan components in diagrams.
- Mermaid sources and exported images are synchronized.

### Gate C: Thesis readiness
- No missing figures
- No stale claims
- No unresolved references or citations
- Chapter structure unchanged unless explicitly requested

## 9) Immediate next implementation tasks

1. Build a file-level outdated-content checklist for all target docs.
2. Draft replacement Mermaid sources for architecture and user flow.
3. Recapture all Chapter 2 screenshots with current UI.
4. Apply focused content refresh in thesis chapters and service docs.
5. Run compile and consistency verification.

## 10) Result expected after completion

- Documentation is modern, accurate, and defense-ready.
- Diagrams are cleaner, consistent, and traceable to current implementation.
- Outdated or unsupported content is removed.
- Thesis keeps existing structure but reads as a polished, current system report.

## 11) Reverification addendum (2026-04-14)

This plan was reverified against current repository files and remains valid.
The following concrete deltas are confirmed and should be treated as mandatory updates during execution.

### A) Thesis root compile hygiene is currently inconsistent
Verified in:
- ELTE_FI_Thesis_Template/elteikthesis_en.tex

Observed issues to fix in execution:
1. Duplicate class/package declarations exist and may cause unstable builds.
2. Preamble cleanup must be completed before final thesis QA.
3. Keep chapter structure unchanged while normalizing preamble correctness.

### B) Mermaid support policy is confirmed
Verified in:
- EngageMind/ARCHITECTURE.md
- EngageMind/engagemind-backend/ARCHITECTURE.md
- EngageMind/engagemind-frontend/ARCHITECTURE.md
- EngageMind/engagemind-rag/ARCHITECTURE.md

Confirmed handling:
1. Mermaid is already used and suitable for Markdown docs.
2. Thesis LaTeX must consume exported diagram images (PNG/SVG), not raw Mermaid blocks.

### C) RAG worker command documentation drift exists
Verified in:
- EngageMind/scripts/run_all.sh
- EngageMind/engagemind-rag/README.md

Observed mismatch:
1. Launcher uses a stable solo worker configuration for local runtime.
2. RAG README still documents a generic worker command.

Execution requirement:
1. Update RAG README worker section to align with current reliable local guidance.

### D) Diagram and screenshot references are still image-based in thesis chapters
Verified in:
- ELTE_FI_Thesis_Template/chapter2_userdocumentation.tex
- ELTE_FI_Thesis_Template/chapter3_developerdocumentation.tex

Execution requirement:
1. Keep existing includegraphics structure.
2. Replace artifacts with regenerated images from updated Mermaid/screenshot sources.

### E) Updated execution priority after reverification
1. First: thesis preamble stabilization.
2. Second: diagram source refresh (Mermaid) and image export.
3. Third: thesis chapter screenshot/diagram replacement.
4. Fourth: backend/frontend/rag README and architecture text modernization.
5. Fifth: full compile and consistency verification.

## 12) Phase 2 execution status (2026-04-14)

Completed artifacts:
1. Mermaid sources created under EngageMind/docs/diagrams-src/
2. Export config added: EngageMind/docs/diagrams-src/mermaid-config.json
3. Exported assets generated under EngageMind/docs/diagrams-export/
4. Thesis image replacements completed:
   - ELTE_FI_Thesis_Template/engagemind_architecture.png
   - ELTE_FI_Thesis_Template/diagram.png

Operational workflow added:
1. New script: EngageMind/scripts/export_thesis_diagrams.sh
2. Root README now documents one-command regeneration and sync flow.

## 13) Phase 3 execution status (2026-04-14)

Completed artifacts:
1. Chapter 2 screenshot assets regenerated and replaced:
   - ELTE_FI_Thesis_Template/landing_page.png
   - ELTE_FI_Thesis_Template/register.png
   - ELTE_FI_Thesis_Template/login_main.png
   - ELTE_FI_Thesis_Template/chat_interface.png
   - ELTE_FI_Thesis_Template/chat_Example1.png
   - ELTE_FI_Thesis_Template/chat_Example2.png
   - ELTE_FI_Thesis_Template/chat_Example3.png
2. Screenshot capture uses a stable fixed viewport (1440x900) for consistency.
3. Chapter 2 chat-response wording and figure captions aligned with improved, document-grounded screenshot behavior.

Operational workflow added:
1. New script: EngageMind/scripts/capture_phase3_screenshots.sh
2. Root README now documents one-command Chapter 2 screenshot regeneration.

## 14) Phase 4 execution status (2026-04-14)

Completed in this pass:
1. Upgraded screenshot seed content to thesis-specific architecture/reliability wording.
2. Regenerated Chat Example screenshots with uploaded-document grounded responses.
3. Aligned Chapter 2 example prompts/response descriptions with improved screenshot content.
4. Refreshed backend/frontend service docs for path portability and architecture accuracy.
5. Re-verified image references, script validity, and startup command consistency; fixed ambiguous `cd ..` usage in service READMEs.
6. Refreshed RAG README and ARCHITECTURE docs for command portability and auth/no-doc behavior accuracy.

Files updated in this pass:
- EngageMind/scripts/capture_phase3_screenshots.sh
- ELTE_FI_Thesis_Template/chapter2_userdocumentation.tex
- EngageMind/engagemind-backend/README.md
- EngageMind/engagemind-frontend/README.md
- EngageMind/engagemind-backend/ARCHITECTURE.md
- EngageMind/engagemind-frontend/ARCHITECTURE.md
- EngageMind/engagemind-rag/README.md
- EngageMind/engagemind-rag/ARCHITECTURE.md

## 15) Phase 5 completion status (2026-04-14)

Completed in this pass:
1. Re-verified thesis user/developer chapters against current backend/frontend/rag code paths and runtime commands.
2. Fixed final doc-to-code drifts:
   - Chapter 2 password requirement now matches backend validation (min length 6).
   - Chapter 3 path naming normalized to actual repository folder names.
   - Chapter 3 MongoDB env section updated to document both `MONGO_URI` (backend) and `MONGO_URL` (rag) requirements.
   - Chapter 3 Celery startup command updated to `fine_tune.celery_config.app` with `--pool=solo --concurrency=1`.
   - Chapter 3 API table route paths corrected and `GET /api/index/stats` added.
   - RAG README API section updated to include implemented `/api/ask` and `/api/index/stats` endpoints.
   - Frontend generic axios client updated to use `REACT_APP_RAG_API_URL` env fallback.
3. Recompiled thesis successfully after these fixes; output PDF produced and refreshed.
4. Folder hygiene finalized in thesis template:
   - Images organized under `assets/images/...`
   - Logs and intermediate artifacts organized under `build/logs` and `build/intermediate`
   - Added `.latexmkrc` so future builds keep root clean by default.

Validation gate summary:
1. Gate A (technical correctness): Pass for the verified endpoint/command/env/flow set documented above.
2. Gate B (diagram correctness): Pass based on Phase 2 regeneration plus thesis image-path verification after folder reorganization.
3. Gate C (thesis readiness): Pass for compile/reference/citation resolution.

Residual non-blocking items:
1. LaTeX formatting warnings remain (underfull/overfull boxes, float specifier warnings, and one `hypcap` caption warning), but they do not block build or affect functional doc/code alignment.
