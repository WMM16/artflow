from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, users, generate, history, upgrade, subaccounts
from app.services.storage_service import storage_service

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="AI图像生成平台API",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(subaccounts.router, prefix="/api")
app.include_router(generate.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(upgrade.router, prefix="/api")


@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# 本地图片访问路由
@app.get("/storage/images/{path:path}")
def serve_image(path: str):
    """提供本地图片访问"""
    file_path = storage_service.get_image_path(path)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return {"error": "Image not found"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
