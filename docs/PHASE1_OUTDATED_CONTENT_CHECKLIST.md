# Phase 1 Outdated-Content Checklist

## Audit goal
Create a verifiable, file-by-file queue of outdated statements, broken commands, and documentation drift before making broad edits.

## Scope reviewed
- ELTE_FI_Thesis_Template/elteikthesis_en.tex
- ELTE_FI_Thesis_Template/chapter1_introduction.tex
- ELTE_FI_Thesis_Template/chapter2_userdocumentation.tex
- ELTE_FI_Thesis_Template/chapter3_developerdocumentation.tex
- ELTE_FI_Thesis_Template/elteikthesis.bib
- EngageMind/README.md
- EngageMind/ARCHITECTURE.md
- EngageMind/docs/THESIS_ALIGNMENT_PLAN.md
- EngageMind/docs/DEFENSE_DEMO_CHECKLIST.md
- EngageMind/engagemind-backend/README.md
- EngageMind/engagemind-backend/ARCHITECTURE.md
- EngageMind/engagemind-frontend/README.md
- EngageMind/engagemind-frontend/ARCHITECTURE.md
- EngageMind/engagemind-rag/README.md
- EngageMind/engagemind-rag/ARCHITECTURE.md

## A) Critical fixes (do first)

### 1) Thesis root preamble hygiene
File: ELTE_FI_Thesis_Template/elteikthesis_en.tex
- Line 70: second documentclass declaration exists inside preamble and is invalid in this context.
  - Action: DELETE line-level block starting at line 70 (duplicate class declaration and related duplicates).
- Line 72: duplicate listings package load.
  - Action: DELETE duplicate package load.
- Line 76: duplicate geometry load.
  - Action: DELETE duplicate geometry load.
- Line 93: typo in department text.
  - Action: UPDATE "Energeeing" to "Engineering".

Reason:
- This is a compile-stability blocker and must be resolved before diagram/image refresh QA.

### 2) Chapter 2 setup instructions are outdated
File: ELTE_FI_Thesis_Template/chapter2_userdocumentation.tex
- Line 100: cd auth_express
  - Action: UPDATE to current backend folder name and structure.
- Line 110: cd ../EngageMind-frontend
  - Action: UPDATE to current folder naming used in repository.
- Line 127: HF_TOKEN==...
  - Action: UPDATE to valid env syntax with single equals.
- Line 129: RAG_API_TOKEN documented but not used in current flow.
  - Action: DELETE or move to optional/legacy note.
- Line 134: PORT=3001 for backend.
  - Action: UPDATE to current backend default port 5003 unless explicitly overridden.
- Line 154 and line 158: engagemind_db naming conflicts with documented connection string.
  - Action: UPDATE to one consistent DB naming policy across thesis and runtime docs.
- Line 174: flask run on port 5000.
  - Action: UPDATE to current RAG run guidance and default port 5001.

Reason:
- These lines can mislead setup and produce immediate run failures.

### 3) RAG worker guidance drift
File: EngageMind/engagemind-rag/README.md
- Line 49: hardcoded absolute local path.
  - Action: UPDATE to repo-relative command style.
- Line 68: generic celery worker command.
  - Action: UPDATE to current stable local guidance aligned with scripts/run_all.sh worker behavior.

Reason:
- Current launcher uses reliability options; docs should match for reproducibility.

## B) High-priority portability fixes

### 4) Root README hardcoded paths
File: EngageMind/README.md
- Line 26: hardcoded absolute path.
- Line 41: hardcoded absolute path.
- Line 48: hardcoded absolute path.
- Line 57: hardcoded absolute path.
- Line 65: hardcoded absolute path.
- Line 78: hardcoded absolute path.
  - Action: UPDATE all to repository-relative usage patterns.
- Line 60: manual celery command should align with reliable local worker recommendation.
  - Action: UPDATE worker guidance note.

### 5) Defense checklist hardcoded start path
File: EngageMind/docs/DEFENSE_DEMO_CHECKLIST.md
- Line 10: hardcoded absolute path.
  - Action: UPDATE to repo-relative startup command.

## C) Medium-priority clarity improvements

### 6) Root README env consistency note is too generic
File: EngageMind/README.md
- Line 94: currently broad env consistency statement.
  - Action: UPDATE with explicit must-match keys and service pair mapping.

### 7) Frontend architecture structure section can be made more precise
File: EngageMind/engagemind-frontend/ARCHITECTURE.md
- Main structure section is accurate but can be more granular.
  - Action: UPDATE with clearer module boundaries (pages/components/api/services/constants) while keeping same structure.

### 8) RAG architecture reliability notes can be more actionable
File: EngageMind/engagemind-rag/ARCHITECTURE.md
- Reliability notes are correct but not execution-specific.
  - Action: UPDATE with concrete operator guidance for outage and triage behavior.

## D) Verified accurate (keep)

### Thesis content verified as mostly current
- ELTE_FI_Thesis_Template/chapter1_introduction.tex
  - Action: KEEP (no high-risk outdated claims found).
- ELTE_FI_Thesis_Template/chapter3_developerdocumentation.tex
  - Action: KEEP core technical content, then refresh wording and diagrams only where needed.
- ELTE_FI_Thesis_Template/elteikthesis.bib
  - Action: KEEP existing entries; add only missing citations required by rewritten sections.

### Service architecture docs verified as structurally correct
- EngageMind/ARCHITECTURE.md
- EngageMind/engagemind-backend/ARCHITECTURE.md
- EngageMind/engagemind-backend/README.md
- EngageMind/engagemind-frontend/README.md
  - Action: KEEP baseline structure and improve precision/portability only.

## E) Diagram execution checklist

1. Keep Mermaid as source for Markdown architecture docs.
2. Generate PNG/SVG exports from Mermaid for thesis LaTeX usage.
3. Keep includegraphics-based structure in thesis chapters.
4. Replace image artifacts, not chapter structure.

Target thesis images to refresh:
- landing_page.png
- register.png
- login_main.png
- chat_interface.png
- chat_Example1.png
- chat_Example2.png
- chat_Example3.png
- engagemind_architecture.png
- diagram.png

## F) Implementation order (approved for next step)

1. Preamble stabilization in elteikthesis_en.tex
2. Chapter 2 setup-command and env correction
3. Root and RAG README portability + worker command alignment
4. Diagram source refresh and export pipeline
5. Screenshot replacement and caption consistency pass
6. Full compile and reference verification

## G) Completion criteria for Phase 1

- Every outdated line above is either updated or removed.
- All startup commands are repository-relative and reproducible.
- Worker guidance matches currently stable local operation.
- Thesis build no longer contains preamble duplication risks.
- Documentation baseline is ready for Phase 2 diagram modernization.
