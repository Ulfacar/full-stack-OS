from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api.endpoints import auth, hotels, webhooks, applications, admin, sales, conversations
from .api.endpoints.preview_chat import router as preview_router
from .api.endpoints.webhooks_whatsapp import router as whatsapp_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(hotels.router)
app.include_router(webhooks.router)
app.include_router(whatsapp_router)
app.include_router(preview_router)
app.include_router(admin.router)
app.include_router(applications.router)
app.include_router(sales.router)
app.include_router(conversations.router)


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running"
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
