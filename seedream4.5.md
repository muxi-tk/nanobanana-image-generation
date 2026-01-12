# Seedream 4.5 API 规格说明 (本地对接版)

## 1. 图像输入限制 (参考图)
- **支持上传数量**：单次请求最多支持传入 **14张** 参考图。
- **输入逻辑**：输入的参考图数量 + 最终生成的图片数量 ≤ 15张。

## 2. 分辨率与尺寸 (Size)

通过`size`控制，只支持 2k和 4k

- **标准预设**：
  - `2K`: 默认值 (如 2048x2048)
  - `4K`: 高清输出 (如 4096x4096)
- **自定义尺寸限制**：
  - **单张像素上限**：宽度 × 高度 ≤ 36,000,000 px (即支持 6000x6000px 级别的超大图)。
  - **像素下限**：总像素需 ≥ 3,686,400 px。

## 3. 宽高比 (Aspect Ratio)
支持通过 `aspect_ratio` 参数直接控制，常用比例包括：
| **目标比例** | **2K 级别推荐设置 (size)** | **4K 级别推荐设置 (size)** | **适用场景说明**            |
| ------------ | -------------------------- | -------------------------- | --------------------------- |
| **1:1**      | `2048x2048`                | `4096x4096`                | 头像、正方形插画、社交媒体  |
| **16:9**     | `2560x1440`                | `3840x2160`                | 电脑壁纸、电影画面、PPT背景 |
| **9:16**     | `1440x2560`                | `2160x3840`                | 抖音/小红书竖屏、手机壁纸   |
| **4:3**      | `2304x1728`                | `3456x2592`                | 传统摄影、iPad 适配比例     |
| **3:4**      | `1728x2304`                | `2592x3456`                | 艺术海报、书籍封面          |
| **3:2**      | `2496x1664`                | `3744x2496`                | 经典单反相机摄影比例        |
| **2:3**      | `1664x2496`                | `2496x3744`                | 杂志人像、落地海报          |
| **21:9**     | `3024x1296`                | `4032x1728`                | 电影超宽幅、带状装饰图      |

## 4. 输出格式 (Output Format)
API 返回数据支持以下三种主要格式：
- **JPG**: 标准通用格式，压缩率高。
- **PNG**: 无损格式，支持更高质量。
- **WebP**: **支持**。该格式在保持高画质的同时，文件体积比 JPG 减小约 30%，非常适合 Web 应用和 Codex 预览。
- **返回方式**: 
  - `url`: 返回一个有效期内的下载链接 (推荐)。
  - `b64_json`: 直接返回 Base64 编码字符串。

## 5. 组图生成规格 (Sequential Generation)
- **单次最大生成数**: 15张。
- **模式**: 支持 `auto` (自动)、`storyboard` (故事版)、`comic` (连环画)。



doubao-seedream-4.5-文生图 输入
```python
import os
from openai import OpenAI

client = OpenAI( 
    # The base URL for model invocation
    base_url="https://ark.cn-beijing.volces.com/api/v3", 
    # Get API Key：https://console.volcengine.com/ark/region:ark+cn-beijing/apikey
    api_key=os.getenv('ARK_API_KEY'), 
) 
 
imagesResponse = client.images.generate( 
    # Replace with Model ID
    model="doubao-seedream-4-5-251128",
    prompt="充满活力的特写编辑肖像，模特眼神犀利，头戴雕塑感帽子，色彩拼接丰富，眼部焦点锐利，景深较浅，具有Vogue杂志封面的美学风格，采用中画幅拍摄，工作室灯光效果强烈。",
    size="2K",
    response_format="url",
    extra_body={
        "watermark": False,
    },
) 
 
print(imagesResponse.data[0].url)
```

doubao-seedream-4.5-文生图 输出

```pytho
{
    "model": "doubao-seedream-4-5-251128",
    "created": 1757321139,
    "data": [
        {
            "url": "https://...",
            "size": "3104x1312"
        }
    ],
    "usage": {
        "generated_images": 1,
        "output_tokens": xxx,
        "total_tokens": xxx
    }
}
```



doubao-seedream-4.5-图生图输入

```python
import os
from openai import OpenAI

client = OpenAI( 
    # The base URL for model invocation
    base_url="https://ark.cn-beijing.volces.com/api/v3", 
    # Get API Key：https://console.volcengine.com/ark/region:ark+cn-beijing/apikey
    api_key=os.getenv('ARK_API_KEY'), 
) 

imagesResponse = client.images.generate( 
    model="doubao-seedream-4-5-251128",
    prompt="保持模特姿势和液态服装的流动形状不变。将服装材质从银色金属改为完全透明的清水（或玻璃）。透过液态水流，可以看到模特的皮肤细节。光影从反射变为折射。",
    size="2K",
    response_format="url",
    extra_body = {
        "image": "https://ark-project.tos-cn-beijing.volces.com/doc_image/seedream4_5_imageToimage.png",
        "watermark": False
    }
) 

print(imagesResponse.data[0].url)
```

doubao-seedream-4.5-图生图 输出

```python
{
    "model": "doubao-seedream-4-5-251128",
    "created": 1757323224,
    "data": [
        {
            "url": "https://...",
            "size": "1760x2368"
        }
    ],
    "usage": {
        "generated_images": 1,
        "output_tokens": 16280,
        "total_tokens": 16280
    }
}
```

