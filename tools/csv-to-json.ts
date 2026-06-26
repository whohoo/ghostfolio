import { parseDate } from '@ghostfolio/common/helper';

import { isFinite, isNumber, isString } from 'lodash';
import * as fs from 'node:fs';
import * as papa from 'papaparse';

const ACCOUNT_KEYS = ['account', 'accountid'];
const COMMENT_KEYS = ['comment', 'note'];
const CURRENCY_KEYS = ['ccy', 'currency', 'currencyprimary'];
const DATA_SOURCE_KEYS = ['datasource'];
const DATE_KEYS = ['date', 'tradedate'];
const FEE_KEYS = ['commission', 'fee', 'ibcommission'];
const QUANTITY_KEYS = ['qty', 'quantity', 'shares', 'units'];
const SYMBOL_KEYS = ['code', 'symbol', 'ticker'];
const TYPE_KEYS = ['action', 'buy/sell', 'type'];
const UNIT_PRICE_KEYS = ['price', 'tradeprice', 'unitprice', 'value'];

function lowercaseKeys(
  aObject: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(aObject).map(([key, val]) => [key.toLowerCase(), val])
  );
}

function toNumber(value: unknown): number {
  if (isNumber(value)) {
    return value;
  }
  if (isString(value)) {
    const n = Number(value);
    if (isFinite(n)) {
      return n;
    }
  }
  return NaN;
}

function parseDateFromRow(item: Record<string, unknown>): string {
  const lowered = lowercaseKeys(item);
  for (const key of DATE_KEYS) {
    const value = lowered[key];
    if (value == null) {
      continue;
    }
    const parsedDate = parseDate(String(value));
    if (parsedDate) {
      return parsedDate.toISOString();
    }
  }
  throw new Error('date is not valid');
}

function parseAccount(
  item: Record<string, unknown>,
  accounts: { id: string; name: string }[]
): string | undefined {
  const lowered = lowercaseKeys(item);
  for (const key of ACCOUNT_KEYS) {
    const value = lowered[key];
    if (value == null) {
      continue;
    }
    const strValue = String(value);
    const match = accounts.find(({ id, name }) => {
      return id === strValue || name?.toLowerCase() === strValue.toLowerCase();
    });
    return match?.id;
  }
  return undefined;
}

function parseComment(item: Record<string, unknown>): string | undefined {
  const lowered = lowercaseKeys(item);
  for (const key of COMMENT_KEYS) {
    const value = lowered[key];
    if (value == null) {
      continue;
    }
    return String(value);
  }
  return undefined;
}

function parseCurrency(item: Record<string, unknown>): string {
  const lowered = lowercaseKeys(item);
  for (const key of CURRENCY_KEYS) {
    const value = lowered[key];
    if (isString(value)) {
      return value;
    }
  }
  throw new Error('currency is not valid');
}

function parseDataSource(item: Record<string, unknown>): string | undefined {
  const lowered = lowercaseKeys(item);
  for (const key of DATA_SOURCE_KEYS) {
    const value = lowered[key];
    if (isString(value)) {
      return value.toUpperCase();
    }
  }
  return undefined;
}

function parseFee(item: Record<string, unknown>): number {
  const lowered = lowercaseKeys(item);
  for (const key of FEE_KEYS) {
    const value = lowered[key];
    const num = toNumber(value);
    if (isFinite(num)) {
      return Math.abs(num);
    }
  }
  throw new Error('fee is not valid');
}

function parseQuantity(item: Record<string, unknown>): number {
  const lowered = lowercaseKeys(item);
  for (const key of QUANTITY_KEYS) {
    const value = lowered[key];
    const num = toNumber(value);
    if (isFinite(num)) {
      return Math.abs(num);
    }
  }
  throw new Error('quantity is not valid');
}

function parseSymbol(item: Record<string, unknown>): string {
  const lowered = lowercaseKeys(item);
  for (const key of SYMBOL_KEYS) {
    const value = lowered[key];
    if (value != null) {
      return String(value);
    }
  }
  throw new Error('symbol is not valid');
}

function parseType(item: Record<string, unknown>): string {
  const lowered = lowercaseKeys(item);
  for (const key of TYPE_KEYS) {
    const value = lowered[key];
    if (isString(value)) {
      switch (value.toLowerCase()) {
        case 'buy':
          return 'BUY';
        case 'sell':
          return 'SELL';
        case 'dividend':
          return 'DIVIDEND';
        case 'fee':
          return 'FEE';
        case 'interest':
          return 'INTEREST';
        case 'liability':
          return 'LIABILITY';
        default:
          break;
      }
    }
  }
  throw new Error('type is not valid');
}

function parseUnitPrice(item: Record<string, unknown>): number {
  const lowered = lowercaseKeys(item);
  for (const key of UNIT_PRICE_KEYS) {
    const value = lowered[key];
    const num = toNumber(value);
    if (isFinite(num)) {
      return Math.abs(num);
    }
  }
  throw new Error('unitPrice is not valid');
}

async function fetchAccounts(
  baseUrl: string,
  accessToken: string
): Promise<{ id: string; name: string }[]> {
  const url = `${baseUrl.replace(/\/+$/, '')}/api/v1/accounts`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error(
      `Failed to fetch accounts: ${response.status} ${response.statusText}`
    );
  }
  const data = (await response.json()) as {
    accounts?: { id: string; name: string }[];
  };
  return data.accounts ?? (data as unknown as { id: string; name: string }[]);
}

async function main() {
  const csvFile = process.argv[2];
  if (!csvFile) {
    console.error('Usage: node tools/csv-to-json.js <csv-file>');
    console.error('');
    console.error('Environment variables:');
    console.error(
      '  GHOSTFOLIO_URL     Ghostfolio API base URL (default: http://localhost:3333)'
    );
    console.error('  ACCESS_TOKEN       JWT access token for authentication');
    process.exit(1);
  }

  const baseUrl = process.env.GHOSTFOLIO_URL || 'http://localhost:3333';
  const accessToken = process.env.ACCESS_TOKEN;

  if (!fs.existsSync(csvFile)) {
    console.error(`File not found: ${csvFile}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(csvFile, 'utf-8');
  const parseResult = papa.parse<Record<string, unknown>>(fileContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  });
  const parsed = parseResult.data;
  const csvFields = (parseResult.meta.fields ?? []).map((f) => f.toLowerCase());

  const hasAccountColumn = ACCOUNT_KEYS.some((key) => csvFields.includes(key));

  let accounts: { id: string; name: string }[] = [];
  if (hasAccountColumn) {
    if (accessToken) {
      try {
        accounts = await fetchAccounts(baseUrl, accessToken);
        console.error(`Fetched ${accounts.length} accounts from ${baseUrl}`);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error(`Warning: could not fetch accounts: ${message}`);
        console.error('Activities will be exported without accountId');
      }
    } else {
      console.error(
        'Warning: ACCESS_TOKEN not set, activities will be exported without accountId'
      );
    }
  }

  const activities = parsed.map((item, index) => {
    try {
      return {
        accountId: parseAccount(item, accounts),
        comment: parseComment(item),
        currency: parseCurrency(item),
        dataSource: parseDataSource(item),
        date: parseDateFromRow(item),
        fee: parseFee(item),
        quantity: parseQuantity(item),
        symbol: parseSymbol(item),
        type: parseType(item),
        unitPrice: parseUnitPrice(item),
        tags: []
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(`Error at row ${index + 2}: ${message}`);
      process.exit(1);
    }
  });

  const result = { activities };
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e: unknown) => {
  const message = e instanceof Error ? e.message : String(e);
  console.error(message);
  process.exit(1);
});
