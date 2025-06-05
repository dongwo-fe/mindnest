# MindNest

## 简介
基于React、TypeScript和Vite构建的桌面笔记应用，结合Tauri实现跨平台桌面端打包，支持笔记管理、标签分类及本地存储功能。

## 技术栈
- 前端框架：React
- 类型系统：TypeScript
- 构建工具：Vite
- 桌面化方案：Tauri
- 样式工具：Tailwind CSS
- 状态管理：React Context（如需扩展）

## 项目结构
```
mindnest/
├── src/                # 前端核心代码
│   ├── components/     # 通用组件（如布局、数据库测试）
│   ├── controllers/    # 业务控制器（笔记/标签逻辑）
│   ├── models/         # 数据模型（笔记/标签实体）
│   ├── pages/          # 页面组件（编辑器、设置等）
│   ├── utils/          # 工具函数（数据库操作）
│   ├── App.tsx         # 根组件
│   └── main.tsx        # 应用入口
├── src-tauri/          # Tauri桌面化配置
│   ├── src/            # Rust后端逻辑
│   ├── tauri.conf.json # Tauri核心配置
│   └── Cargo.toml      # Rust依赖管理
├── public/             # 静态资源
├── package.json        # 前端依赖声明
└── tailwind.config.js  # Tailwind样式配置
```

## 功能特性
- 笔记全生命周期管理（创建/编辑/预览）
- 标签分类与关联（支持多标签绑定）
- 本地数据库存储（通过src-tauri实现持久化）
- 跨平台桌面应用（Windows/macOS/Linux）
- 响应式布局（适配不同屏幕尺寸）

## 安装与运行
### 环境准备
1. 安装Node.js（v18+）和Rust（通过[Rustup](https://rustup.rs/)安装）
2. 安装前端依赖：`npm install`

### 开发模式
启动前端热更新服务：`npm run dev`

### 构建桌面应用
打包为可执行文件：`npm run tauri build`（输出至src-tauri/target/release）

## 配置扩展
- 前端环境变量：在`vite.config.ts`中添加自定义配置
- Tauri窗口设置：修改`src-tauri/tauri.conf.json`的`window`字段调整默认尺寸/标题
- 数据库配置：通过`src/utils/db.ts`扩展存储逻辑
