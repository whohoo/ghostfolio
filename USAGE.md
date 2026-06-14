# 操作补充

## 管理 - Admin Control

### 市场数据 - Market Data

#### 资源中的 `代码映射` - `Symbol Mapping` 格式

```JSON
{
  "YAHOO": "AAPL34.SA",
  "OPENFIGI": "026R93307",
  "TRACKINSIGHT": "SomeTrackinsightSymbol"
}
```

键(KEY)是数据提供商名称，值(VALUE)是对应提供商下的符号。

数据采集（gatherAssetProfiles）时，系统会用 symbolMapping 里的映射符号去调用对应的 Data Enhancer，获取该资产更丰富的信息（countries、sectors、URL 等）。以 YAHOO 为例：

- 你数据库里存的 symbol 是 "AAPL"，但巴西 B3 市场上其实是 "AAPL34.SA"
- 设置 {"YAHOO": "AAPL34.SA"} 后，Yahoo Finance Enhancer 会用 "AAPL34.SA" 拉取股价、国家分布、行业等数据
- 不设置则 enhancer 直接用原始 symbol "AAPL"，可能查不到或拿到错误数据

#### 资源中的 `行业` - `Sectors` 格式

```JSON
[
  {"name":"金融", "weight":0.5},
  {"name":"银行", "weight":0.5}
]
```

| 字段   | 说明                     |
| ------ | ------------------------ |
| name   | 必填, 任意字串           |
| weight | 可选, 是权重, 没有默认值 |

#### 资源中的 `国家` - `Countries` 格式

```JSON
[
  { "code": "CN", "weight": 1 }
]
```

| 字段   | 说明                                       |
| ------ | ------------------------------------------ |
| code   | 必填, 两位 ISO 国家代码，如 CN、US         |
| weight | 可选, 权重，ETF 分散时小于 1，股票通常为 1 |

## 定时任务

1. runEveryHourAtRandomMinute — 每小时随机分钟执行，调用 gather7Days()，抓取所有活跃资产近 7 天的历史市场数据
2. runEverySundayAtTwelvePm — 每周日中午 12 点执行，抓取所有超过 60 天未更新的活跃资产的资产简介（Asset Profile）
