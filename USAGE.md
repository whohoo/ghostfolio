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

## 数据库操作

### 创建 ghostfolio_db 数据库用户 ghostfolio

```sql
-- 1. 创建用户(角色),设置登录密码
CREATE USER ghostfolio WITH PASSWORD '<替换成强密码>' LOGIN;

-- 2. 如果数据库还没建,顺手把数据库的属主直接设为 ghostfolio
--    (注意库名带横线,必须用双引号)
CREATE DATABASE "ghostfolio-db" OWNER ghostfolio;

-- 如果数据库已经存在了,改成属主授权即可:
-- ALTER DATABASE "ghostfolio-db" OWNER TO ghostfolio;

-- 3. 切换到该数据库执行后续授权(psql 里用 \c)
-- \c "ghostfolio-db"

-- 4. 数据库级权限:允许连接、创建临时表等
GRANT ALL PRIVILEGES ON DATABASE "ghostfolio-db" TO ghostfolio;

-- 5. schema 级权限:PG15+ 起 public schema 默认不允许普通用户 CREATE,需显式授权
GRANT ALL ON SCHEMA public TO ghostfolio;

-- 6. 已存在的表/序列/函数全部授权(如果是全新空库这步可省略)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ghostfolio;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ghostfolio;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO ghostfolio;

-- 7. 设置默认权限,确保以后 ghostfolio(或其他用户)新建的表/序列也自动授权给它
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL PRIVILEGES ON TABLES TO ghostfolio;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL PRIVILEGES ON SEQUENCES TO ghostfolio;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL PRIVILEGES ON FUNCTIONS TO ghostfolio;
```

### 数据库迁移

```bash
# 导出(进入容器或者本机装了 client 都行)
docker exec -t postgresql pg_dump -U ghostfolio -d ghostfolio-db --no-owner -F p > ghostfolio_backup.sql
gzip ghostfolio_backup.sql

# 传输到另一台电脑后,导入
gunzip ghostfolio_backup.sql.gz
docker exec -i postgresql psql -U ghostfolio -d ghostfolio-db < ghostfolio_backup.sql
```
