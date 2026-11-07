"""POST /api/notes/upload — handwritten notes upload (Section 5.1)."""

import uuid

from fastapi import APIRouter, UploadFile, File, Form

from app.models.schemas import NotesUploadResponse

router = APIRouter(prefix="/api/notes", tags=["notes"])


@router.post("/upload", response_model=NotesUploadResponse)
async def upload_notes(
    file: UploadFile = File(...),
    lectureId: str = Form(...),
) -> NotesUploadResponse:
    """
    Unspecified in the project doc (Section 5.1): max file size, storage
    location, processing pipeline, error responses, and the internal shape
    of `coordinates`. This stub accepts the upload and returns a placeholder
    response so the frontend can integrate against the documented shape;
    actual image processing is not implemented.
    """
    # TODO: validate content type (image/png, image/jpeg), size limit (TBD)
    # TODO: store file (Supabase Storage bucket? not documented — confirm)
    # TODO: run note/visual processing -> emit `visual_frame_update` socket event

    return NotesUploadResponse(
        success=True,
        visualId=str(uuid.uuid4()),
        coordinates={},
    )
