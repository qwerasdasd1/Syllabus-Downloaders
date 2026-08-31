# Westlake Syllabus Downloader

[![Chrome](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
[![Version](https://img.shields.io/badge/version-0.1.0-blue)](manifest.json)

为西湖大学教学系统恢复教学大纲 PDF 下载按钮的 Chrome 扩展。

> 本项目是非官方工具，与西湖大学及其教学系统开发方无关。

## 功能

- 在教学大纲 PDF 预览器中恢复原生下载按钮。
- 同时支持 PDF.js 主工具栏和次级工具栏中的保存入口。
- 仅在指定的教学大纲预览页面运行。
- 无后台服务、无第三方运行时依赖。

## 工作原理

教学系统使用 PDF.js 展示教学大纲，并通过页面参数隐藏原有保存按钮。本扩展只恢复 PDF.js 已有的下载控件，不拦截网络请求，也不绕过登录或访问控制。

## 安装

### 从源码安装

1. 下载或克隆本仓库。
2. 在 Chrome 地址栏打开 `chrome://extensions/`。
3. 开启右上角的“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择本仓库根目录。

安装后如果修改了代码，请在扩展管理页点击“重新加载”。

## 使用

1. 登录西湖大学教学系统。
2. 打开课程列表中的“教学大纲”。
3. 在 PDF 预览器工具栏中点击“下载教学大纲”。

下载由 PDF.js 和 Chrome 原生下载流程处理。

## 权限与隐私

扩展只匹配以下页面：

```text
https://ams.westlake.edu.cn/onlinefile/pdfjs/web/viewer.html*
```

扩展不会：

- 读取或保存账号、密码和 Cookie；
- 读取、上传或分析教学大纲内容；
- 向外部服务器发送数据；
- 在其他网站或教学系统的其他页面运行。

## 开发

### 环境要求

- Chrome 或其他支持 Manifest V3 的 Chromium 浏览器
- Node.js 18 或更高版本（仅用于运行测试）

### 项目结构

```text
.
├── manifest.json          # Chrome 扩展清单
├── package.json           # 测试命令
├── src/
│   └── content.js         # 恢复 PDF.js 下载按钮
└── test/
    └── content.test.js    # 核心逻辑测试
```

### 运行测试

```bash
npm test
```

项目没有需要安装的 npm 依赖。

## 故障排查

### 看不到下载按钮

1. 确认扩展已启用。
2. 在 `chrome://extensions/` 中重新加载扩展。
3. 关闭教学大纲弹窗后重新打开。
4. 刷新教学系统页面后重试。

### 点击按钮后没有下载

确认教学大纲已经在预览器中正常加载。如果 PDF 本身无法显示，本扩展也无法获取该文件。

## 已知限制

- 仅适配当前的西湖大学教学系统 PDF.js 预览地址和控件结构。
- 如果教学系统更改域名、预览路径或 PDF.js 页面结构，扩展可能需要更新。
- 扩展不会让当前账号无权访问的教学大纲变得可访问。

## 贡献

欢迎提交 Issue 或 Pull Request。提交代码前请先运行：

```bash
npm test
```

## 许可证

本项目暂未添加开源许可证。公开发布前请根据你的发布计划选择并添加 `LICENSE` 文件。
