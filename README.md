# Meituan Route MVP

美团黑客松多人共创路线 MVP。项目围绕多人出行决策场景，串联创建房间、邀请好友、填写偏好、生成路线、确认行程和沉淀手帐的完整体验。

## Overview

- 面向移动端的多人共创路线原型
- 覆盖从创建房间、邀请好友、填写偏好到路线生成和行程手帐的完整体验
- 可通过本地静态服务直接预览和演示

## Directory Structure

```text
.
├── index.html
├── src/
│   ├── app.js
│   ├── mock-api.js
│   └── styles.css
├── tests/
│   ├── browser-smoke.mjs
│   ├── route-plan.mjs
│   └── static-smoke.mjs
└── README.md
```

## Preview

在项目根目录启动本地静态服务：

```bash
python3 -m http.server 4180
```

然后在浏览器打开：

```text
http://localhost:4180/index.html
```

也可以直接打开 `index.html`，但使用本地服务预览更接近实际浏览器运行环境。

## Files

- `index.html`: 页面结构、弹窗和移动端原型屏幕。
- `src/styles.css`: 全部视觉样式，按页面和模块组织。
- `src/app.js`: 前端状态管理、页面跳转、筛选、选点、路线调整、电子手帐和地图 canvas 适配器。
- `src/mock-api.js`: mock 成员、POI、搜索、定位上下文和路线规划接口。
- `tests/`: 静态检查、路线规划检查和浏览器冒烟测试。

## Current Flow

- 地图入口与多人共创入口
- 创建或加入行程房间
- 设置行程类型、时间、路线偏好和成员权限
- 邀请好友分享
- 填写位置与偏好
- 汇总成员偏好
- 生成路线与推荐 POI
- 调整并确认行程
- 行程进行中互动
- 结束行程并生成电子手帐
- 查看历史行程和手帐媒体

## Implementation Notes

项目中的数据和地图能力集中在以下边界，便于阅读和维护：

- `src/mock-api.js` 中的 `window.MockApi`: 当前 mock 接口集合。
- `getUserContext(...)`: 定位上下文来源。
- `getPoiRecommendations(...)`: 推荐 POI 来源。
- `searchPois(...)`: 搜索 POI 来源。
- `planRoute(...)`: 路线规划来源。
- `src/app.js` 中的 `createMapAdapter(...)`: canvas 地图渲染边界。

核心数据字段：

- POI: `id`, `name`, `category`, `subCategory`, `lat`, `lng`, `rating`, `price`, `tags`
- Route plan: `origin`, `selected`, `legs`, `totalDistanceMeters`, `totalDistanceLabel`, `reason`
- Member: `name`, `avatar`, `status`, `tags`

## Tests

运行静态冒烟检查：

```bash
node tests/static-smoke.mjs
```

运行路线规划检查：

```bash
node tests/route-plan.mjs
```

浏览器冒烟脚本：

```bash
node tests/browser-smoke.mjs
```

注意：`tests/browser-smoke.mjs` 依赖本机 Playwright 运行环境。如果本机依赖路径不可用，需要先修正脚本里的 Playwright 引用或安装对应依赖。

## Status

项目已完成静态 MVP 原型交付，可通过本地静态服务预览完整流程。
