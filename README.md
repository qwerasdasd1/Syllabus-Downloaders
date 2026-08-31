# Westlake Syllabus Downloader

[![Chrome](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
[![Version](https://img.shields.io/badge/version-0.1.0-blue)](manifest.json)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

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

1. 打开课程列表中的“教学大纲”。
2. 在 PDF 预览器工具栏中点击“下载教学大纲”。

下载由 PDF.js 和 Chrome 原生下载流程处理。

## 权限与隐私

扩展不会：

- 读取或保存账号、密码和 Cookie；
- 读取、上传或分析教学大纲内容；
- 向外部服务器发送数据；
- 在其他网站或教学系统的其他页面运行。

## 开发

### 项目结构

```text
.
├── manifest.json          # Chrome 扩展清单
└── src/
    └── content.js         # 恢复 PDF.js 下载按钮
```

项目没有构建步骤或第三方依赖。修改 `src/content.js` 后，在 `chrome://extensions/` 中重新加载扩展即可。

### 手动验证

1. 打开一个教学大纲预览。
2. 确认工具栏出现“下载教学大纲”按钮。
3. 点击按钮并确认 PDF 可以正常保存。

## 故障排查

### 看不到下载按钮

1. 确认扩展已启用。
2. 在 `chrome://extensions/` 中重新加载扩展。
3. 关闭教学大纲弹窗后重新打开。
4. 刷新教学系统页面后重试。

### 点击按钮后没有下载

确认教学大纲已经在预览器中正常加载。如果 PDF 本身无法显示，本扩展也无法获取该文件。


## 贡献

欢迎提交 Issue 或 Pull Request。请在 Pull Request 中简要说明改动内容和手动验证结果。

## 许可证

本项目采用 [MIT License](LICENSE)。
