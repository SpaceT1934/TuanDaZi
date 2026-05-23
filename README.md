# Meituan Vibe MVP

美团黑客松多人共创路线 MVP。当前版本是一个可直接预览的静态前端原型，已经把从地图入口、创建房间、邀请好友、填写偏好、成员偏好汇总、AI 路线生成、AI 推荐方案到调整确认行程的主流程串起来。

## Preview

推荐用本地静态服务预览：

```bash
python3 -m http.server 4180
```

然后打开：

```text
http://localhost:4180/index.html
```

也可以直接打开 `index.html`，但后续接真实地图 API 时建议固定使用本地服务。

## Files

- `index.html`: 页面结构和 04-12 屏流程骨架。
- `styles.css`: 全部视觉样式，按页面和模块组织。
- `app.js`: 前端状态、页面跳转、筛选、选择 POI、调整行程、canvas 地图适配器。
- `mock-api.js`: 当前 mock 的成员、POI、搜索、路线规划接口。

## Current Flow

- 04 地图入口-多人共创
- 05 创建或加入房间弹窗
- 06 创建房间设置
- 07 邀请好友分享卡
- 08 位置与偏好填写
- 09 成员偏好汇总
- 10 AI 路线生成中
- 11 AI 路线与 POI 推荐
- 12 调整并确认行程

## Integration Notes

后端或 AI 同学优先看这几个点：

- `mock-api.js` 里的 `window.MockMeituanApi` 是未来替换真实 API 的边界。
- `app.js` 里的 `createMapAdapter(...)` 是地图渲染边界，目前是 canvas fallback。
- `buildRoutePlan(...)` 目前调用 mock route planner，之后可以替换为真实 AI 路线规划接口。
- `searchPois(...)` 目前返回 mock POI，之后可以接高德/美团/后端聚合 POI 搜索。
- `getCurrentLocation(...)` 目前 mock 定位，之后可以接浏览器定位或地图 SDK 定位。

建议真实接口先保持这些返回字段：

- POI: `id`, `name`, `type`, `lat`, `lng`, `rating`, `price`, `distance`, `tags`, `imageLabel`
- Route plan: `selected`, `totalDistanceLabel`, `reason`
- Member: `name`, `avatar`, `location`, `preferences`, `status`

## Next Steps

- 接入真实地图 SDK，替换 canvas 地图。
- 接入 POI 搜索和地图选点。
- 接入 AI 路线规划，基于成员位置、偏好、预算、营业状态和交通距离返回推荐路线。
- 将 mock 房间码、成员加入状态、邀请链接替换为后端房间接口。
