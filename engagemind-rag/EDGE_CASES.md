# RAG System Edge Cases and Handling

## Current Handling

### No Documents Uploaded
- The message handler detects the missing per-user FAISS index before running the full graph.
- The user receives guided upload advice instead of an ungrounded answer.
- Conversation history is still persisted.

### Chitchat and Greetings
- Intent routing handles greetings and simple chitchat without invoking the full RAG path.
- The assistant response is saved to the conversation like any other message.

### Document Uploads
- Uploads are capped at 10 MB.
- `.txt`, `.md`, `.pdf`, and `.docx` are the documented supported formats.
- Text and Markdown are decoded directly.
- PDF and DOCX content is extracted with local parsers (`pypdf`, `python-docx`).
- Successful processing updates the user FAISS index incrementally, with full rebuild fallback.

### Fine-Tune Preconditions
- Fine-tuning requires at least one readable uploaded document for the authenticated user.
- Empty corpora return a controlled `FAILURE` response with a 400 status.
- Task status values are normalized to `PENDING`, `PROGRESS`, `SUCCESS`, or `FAILURE`.

### Authentication Failures
- RAG and fine-tune endpoints require `Authorization: Bearer <token>`.
- Missing, invalid, or expired JWTs return 401 responses.
- Backend and RAG must share the same `JWT_SECRET`.

### Dependency Failures
- MongoDB affects document, chat, and state persistence.
- Redis/Celery affects training execution but not normal chat startup.
- Missing or invalid model-provider keys surface during RAG startup or provider calls.

## Known Limitations

### Image-Only PDFs
- Current PDF extraction uses local text extraction, not OCR.
- Scanned PDFs may produce no usable text.

### Unsupported File Types
- Unknown binary types fall back to best-effort UTF-8 decoding.
- A stricter extension allowlist would improve user feedback.

### Document Deletion
- Conversation deletion exists, but there is no document deletion endpoint or FAISS cleanup flow yet.

### Very Long Conversations
- Chat history is persisted in MongoDB and recent messages are used for context.
- Long-term summarization or pagination is not implemented.

### Fine-Tuned Inference
- GPT-2 LoRA training saves artifacts and metadata.
- GPT-2 LoRA chat mode is available, but it is not grounded to uploaded documents.
- If the adapter is missing or incomplete, the fine-tune chat endpoint returns an unavailable response.

## Priority Recommendations

1. Add explicit upload extension validation and clearer unsupported-file messages.
2. Add document deletion plus index cleanup if document lifecycle management becomes a thesis/demo requirement.
3. Keep the GPT-2 LoRA mode labeled and disabled when no adapter exists; RAG should remain the default for grounded QA.
4. Consider OCR only if scanned-PDF ingestion becomes part of the required scope.