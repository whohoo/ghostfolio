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

## Portfolio - 导入活动（Import Activities）

### CSV 格式

列头（不区分大小写，支持别名）：

| 字段       | 接受的列名                                  |
| ---------- | ------------------------------------------- |
| **日期**   | `Date`, `TradeDate`                         |
| **代码**   | `Code`, `Symbol`, `Ticker`                  |
| **货币**   | `Currency`, `CCY`, `CurrencyPrimary`        |
| **价格**   | `Price`, `TradePrice`, `UnitPrice`, `Value` |
| **数量**   | `Quantity`, `Qty`, `Shares`, `Units`        |
| **类型**   | `Action`, `Buy/Sell`, `Type`                |
| **费用**   | `Fee`, `Commission`, `IBCommission`         |
| **数据源** | `DataSource`（可选）                        |
| **账户**   | `Account`, `AccountId`（可选）              |
| **备注**   | `Comment`, `Note`（可选）                   |

类型值（不区分大小写）：`buy` / `sell` / `dividend` / `fee` / `interest` / `liability`

日期格式支持：`DD-MM-YYYY`、`DD/MM/YYYY`、`DD.MM.YYYY`、`YYYYMMDD`

示例：

```csv
Date,Code,DataSource,Currency,Price,Quantity,Action,Fee,Note
16-09-2021,MSFT,YAHOO,USD,298.580,5,buy,19.00,My first order
17/11/2021,MSFT,YAHOO,USD,0.62,5,dividend,0.00
01.01.2022,Penthouse Apartment,MANUAL,USD,500000.0,1,buy,0.00,
20500606,US5949181045,YAHOO,USD,0.00,0,buy,0.00,
```

### JSON 格式

完整结构可包含 `meta`、`accounts`、`assetProfiles`、`platforms`、`tags`、`activities`、`user`，最简只需 `activities`：

```json
{
  "meta": {
    "date": "2023-02-05T00:00:00.000Z",
    "version": "dev"
  },
  "accounts": [
    {
      "id": "b2d3fe1d-d6a8-41a3-be39-07ef5e9480f0",
      "name": "My Online Trading Account",
      "balance": 2000,
      "currency": "USD",
      "isExcluded": false,
      "platformId": "9da3a8a7-4795-43e3-a6db-ccb914189737",
      "balances": [{ "date": "2024-12-31T00:00:00.000Z", "value": 2000 }]
    }
  ],
  "assetProfiles": [
    {
      "symbol": "MSFT",
      "dataSource": "YAHOO",
      "name": "Microsoft Corp",
      "currency": "USD",
      "isActive": true
    }
  ],
  "platforms": [
    {
      "id": "9da3a8a7-4795-43e3-a6db-ccb914189737",
      "name": "Interactive Brokers"
    }
  ],
  "tags": [{ "name": "tag-name" }],
  "activities": [
    {
      "accountId": "b2d3fe1d-d6a8-41a3-be39-07ef5e9480f0",
      "comment": "My first order",
      "fee": 19,
      "quantity": 5,
      "type": "BUY",
      "unitPrice": 298.58,
      "currency": "USD",
      "dataSource": "YAHOO",
      "date": "2021-09-16T00:00:00.000Z",
      "symbol": "MSFT",
      "tags": []
    }
  ],
  "user": {
    "settings": {
      "currency": "USD",
      "performanceCalculationType": "ROAI"
    }
  }
}
```

#### Activity 字段说明

| 字段         | 类型     | 必填 | 说明                                                           |
| ------------ | -------- | ---- | -------------------------------------------------------------- |
| `date`       | ISO 8601 | 是   | 交易日期，必须晚于 1970-01-01                                  |
| `symbol`     | string   | 是   | 股票代码或 MANUAL 资产 UUID                                    |
| `currency`   | ISO 4217 | 是   | 货币代码，如 USD、EUR、CNY                                     |
| `type`       | enum     | 是   | `BUY` / `SELL` / `DIVIDEND` / `FEE` / `INTEREST` / `LIABILITY` |
| `unitPrice`  | number   | 是   | 单价（>= 0）                                                   |
| `quantity`   | number   | 是   | 数量（>= 0）                                                   |
| `fee`        | number   | 是   | 费用（>= 0）                                                   |
| `dataSource` | string   | 否   | 如 `YAHOO`、`MANUAL`，省略则使用系统默认数据源                 |
| `accountId`  | string   | 否   | 账户 UUID，省略则不关联账户                                    |
| `comment`    | string   | 否   | 备注                                                           |
| `tags`       | string[] | 否   | 标签 ID 数组                                                   |

### 注意事项

- **修改 Prisma schema 后需清除 Angular 缓存**：如果新增或修改了 `prisma/schema.prisma` 中的枚举（如 `DataSource`），运行 `npx prisma generate` 后，必须清除 Angular 编译缓存再重启 client，否则 `@prisma/client` 的改动不会生效：
  ```bash
  rm -rf .angular/cache node_modules/.cache
  # 然后重新启动 pnpm run start:client
  ```

## 定时任务

1. runEveryHourAtRandomMinute — 每小时随机分钟执行，调用 gather7Days()，抓取所有活跃资产近 7 天的历史市场数据
2. runEverySundayAtTwelvePm — 每周日中午 12 点执行，抓取所有超过 60 天未更新的活跃资产的资产简介（Asset Profile）
