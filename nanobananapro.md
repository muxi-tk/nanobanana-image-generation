# Gemini Image Generation API (Nano Banana Pro) 开发者手册

## 1. 核心生成参数 (ImageConfig)
在调用 API 时，通过 `image_config` 对象控制输出规格。

### 1.1 分辨率与宽高比对照表
API 会根据 `aspect_ratio` 自动计算像素。以下为 1K 到 4K 的详细像素参考：

| 比例 (Aspect Ratio) | 1K (标准)   | 2K (高清)   | 4K (超清)   | 适用场景          |
| :------------------ | :---------- | :---------- | :---------- | :---------------- |
| **1:1**             | 1024 x 1024 | 2048 x 2048 | 4096 x 4096 | 头像、Instagram   |
| **9:16**            | 768 x 1360  | 1536 x 2720 | 3072 x 5440 | 手机壁纸、TikTok  |
| **16:9**            | 1360 x 768  | 2720 x 1536 | 5440 x 3072 | 屏幕壁纸、YouTube |
| **3:4**             | 896 x 1200  | 1792 x 2400 | 3584 x 4800 | 社交媒体图片      |
| **4:3**             | 1200 x 896  | 2400 x 1792 | 4800 x 3584 | 传统照片          |
| **2:3**             | 832 x 1248  | 1664 x 2496 | 3328 x 4992 | 竖版海报          |
| **3:2**             | 1248 x 832  | 2496 x 1664 | 4992 x 3328 | 标准摄影          |

### 1.2 输出格式控制
* **MIME 类型**：支持 `image/png` 和 `image/jpeg`。
* **参数名**：`output_mime_type`。

---

## 2. 参考图增强功能 (Multi-Modal Input)
Nano Banana Pro 显著区别于其他模型的特点在于其强大的多图参考能力：

* **数量限制**：最多支持 **14 张参考图片**。
* **输入方式**：在 `contents` 数组中混合 `text` 和 `inline_data` (Base64)。
* **引导类型**：
    1. **Style Reference (风格参考)**：模仿色彩、构图和笔触。
    2. **Subject Reference (主体参考)**：保持人物、角色或特定物体的一致性。
    3. **ControlNet (控制引导)**：基于参考图的边缘或深度生成。

---

## 3. 提示词最佳实践 (Best Practices)
* **包含文字**：如果要在图片中生成文字，请使用双引号包裹，如 `A shop sign saying "Open Late"`。建议字符数 < 25。
* **描述结构**：建议遵循：**[主体] + [动作] + [环境背景] + [艺术风格] + [光影/构图]**。
* **画质增强词**：即使开启 4K，也建议加入 `hyper-realistic`, `8k resolution`, `intricate detail` 以提升纹理表现。

---

## 4. 安全与合规
* **人物生成限制**：通过 `person_generation` 参数控制。
    * `ALLOW_ALL`: 允许生成所有人物。
    * `ALLOW_ADULT`: 仅允许生成成年人。
* **过滤级别**：设置 `safety_settings` 以调整对敏感内容的拦截敏感度。

---

## 5. Next.js / TypeScript 调用示例 (OpenRouter 风格)

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "[https://openrouter.ai/api/v1](https://openrouter.ai/api/v1)",
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function generateImage() {
  const response = await openai.chat.completions.create({
    model: "google/gemini-3-pro-image-preview", // 确认 OpenRouter 上的具体模型 ID
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "A futuristic city in the style of this image" },
          { type: "image_url", image_url: { url: "BASE64_OR_URL_HERE" } }
        ]
      }
    ],
    // OpenRouter 特有扩展参数映射
    // @ts-ignore
    provider: {
      image_config: {
        aspect_ratio: "16:9",
        image_size: "4K",
        output_mime_type: "image/png"
      }
    }
  });
}
```

