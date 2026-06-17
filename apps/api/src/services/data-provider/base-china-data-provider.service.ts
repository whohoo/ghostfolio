import { ConfigurationService } from '@ghostfolio/api/services/configuration/configuration.service';
import {
  DataProviderInterface,
  GetAssetProfileParams,
  GetDividendsParams,
  GetHistoricalParams,
  GetQuotesParams,
  GetSearchParams
} from '@ghostfolio/api/services/data-provider/interfaces/data-provider.interface';
import { Environment } from '@ghostfolio/api/services/interfaces/environment.interface';
import { DATE_FORMAT } from '@ghostfolio/common/helper';
import {
  DataProviderHistoricalResponse,
  DataProviderInfo,
  DataProviderResponse,
  LookupResponse
} from '@ghostfolio/common/interfaces';

import { Logger } from '@nestjs/common';
import { DataSource, SymbolProfile } from '@prisma/client';
import { addDays, format, isSameDay } from 'date-fns';

export abstract class BaseChinaDataProviderService implements DataProviderInterface {
  protected readonly logger = new Logger(this.constructor.name);

  protected proxyUrl: string;

  constructor(protected readonly configurationService: ConfigurationService) {
    this.proxyUrl = this.configurationService.get(
      this.getProxyUrlKey()
    ) as string;
  }

  public canHandle() {
    return !!this.proxyUrl;
  }

  public async getAssetProfile({
    requestTimeout = this.configurationService.get('REQUEST_TIMEOUT'),
    symbol
  }: GetAssetProfileParams): Promise<Partial<SymbolProfile>> {
    try {
      const response = await fetch(`${this.proxyUrl}/api/profile`, {
        body: JSON.stringify({ symbol }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        signal: AbortSignal.timeout(requestTimeout)
      });

      if (!response.ok) {
        this.logger.error(
          `Failed to get asset profile for ${symbol}: ${response.status}`
        );
        return {};
      }

      const result = this.stripNullBytes(
        (await response.json()) as Partial<SymbolProfile>
      );
      result.dataSource = this.getName();
      result.symbol = symbol;
      return result;
    } catch (error) {
      this.logger.error(
        `Could not get asset profile for ${symbol} (${this.getName()}): [${
          error.name
        }] ${error.message}`
      );

      return {};
    }
  }

  public getDataProviderInfo(): DataProviderInfo {
    return {
      dataSource: this.getDataSource(),
      isPremium: false,
      name:
        this.getDataSource() === DataSource.CN_STOCK
          ? 'China Stock'
          : 'China Fund',
      url: ''
    };
  }

  public async getDividends({
    from,
    requestTimeout = this.configurationService.get('REQUEST_TIMEOUT'),
    symbol,
    to
  }: GetDividendsParams) {
    if (isSameDay(from, to)) {
      to = addDays(to, 1);
    }

    try {
      const response = await fetch(`${this.proxyUrl}/api/dividends`, {
        body: JSON.stringify({
          from: format(from, DATE_FORMAT),
          symbol,
          to: format(to, DATE_FORMAT)
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        signal: AbortSignal.timeout(requestTimeout)
      });

      if (!response.ok) {
        this.logger.error(
          `Failed to get dividends for ${symbol}: ${response.status}`
        );
        return {};
      }

      return this.stripNullBytes(
        (await response.json()) as {
          [date: string]: DataProviderHistoricalResponse;
        }
      );
    } catch (error) {
      this.logger.error(
        `Could not get dividends for ${symbol} (${this.getName()}) from ${format(
          from,
          DATE_FORMAT
        )} to ${format(to, DATE_FORMAT)}: [${error.name}] ${error.message}`
      );

      return {};
    }
  }

  public async getHistorical({
    from,
    requestTimeout = this.configurationService.get('REQUEST_TIMEOUT'),
    symbol,
    to
  }: GetHistoricalParams): Promise<{
    [symbol: string]: { [date: string]: DataProviderHistoricalResponse };
  }> {
    if (isSameDay(from, to)) {
      to = addDays(to, 1);
    }

    try {
      const response = await fetch(`${this.proxyUrl}/api/historical`, {
        body: JSON.stringify({
          from: format(from, DATE_FORMAT),
          symbol,
          to: format(to, DATE_FORMAT)
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        signal: AbortSignal.timeout(requestTimeout)
      });

      if (!response.ok) {
        const message = await response.text();
        if (
          message.includes('No data found') ||
          message.includes('may be delisted')
        ) {
          throw new Error(
            `No data found, ${symbol} (${this.getName()}) may be delisted`
          );
        }

        this.logger.error(
          `Failed to get historical data for ${symbol}: ${response.status}`
        );
        return {};
      }

      return this.stripNullBytes(
        (await response.json()) as {
          [symbol: string]: { [date: string]: DataProviderHistoricalResponse };
        }
      );
    } catch (error) {
      if (error.message === 'No data found, symbol may be delisted') {
        throw error;
      }

      throw new Error(
        `Could not get historical market data for ${symbol} (${this.getName()}) from ${format(
          from,
          DATE_FORMAT
        )} to ${format(to, DATE_FORMAT)}: [${error.name}] ${error.message}`
      );
    }
  }

  public getMaxNumberOfSymbolsPerRequest() {
    return 50;
  }

  public getName(): DataSource {
    return this.getDataSource();
  }

  public async getQuotes({
    requestTimeout = this.configurationService.get('REQUEST_TIMEOUT'),
    symbols
  }: GetQuotesParams): Promise<{ [symbol: string]: DataProviderResponse }> {
    if (symbols.length <= 0) {
      return {};
    }

    try {
      const response = await fetch(`${this.proxyUrl}/api/quotes`, {
        body: JSON.stringify({ symbols }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        signal: AbortSignal.timeout(requestTimeout)
      });

      if (!response.ok) {
        this.logger.error(
          `Failed to get quotes for ${symbols.join(',')}: ${response.status}`
        );
        return {};
      }

      const result: { [symbol: string]: DataProviderResponse } =
        this.stripNullBytes(await response.json());

      for (const symbol of Object.keys(result)) {
        result[symbol] = {
          ...result[symbol],
          dataSource: this.getName()
        };
      }

      return result;
    } catch (error) {
      this.logger.error(error);

      return {};
    }
  }

  public async search({
    includeIndices = false,
    query,
    requestTimeout = this.configurationService.get('REQUEST_TIMEOUT')
  }: GetSearchParams): Promise<LookupResponse> {
    try {
      const response = await fetch(`${this.proxyUrl}/api/search`, {
        body: JSON.stringify({ includeIndices, query }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        signal: AbortSignal.timeout(requestTimeout)
      });

      if (!response.ok) {
        this.logger.error(`Failed to search for ${query}: ${response.status}`);
        return { items: [] };
      }

      const result = this.stripNullBytes(
        (await response.json()) as LookupResponse
      );

      result.items = result.items.map((item) => ({
        ...item,
        dataProviderInfo: this.getDataProviderInfo(),
        dataSource: this.getName()
      }));

      return result;
    } catch (error) {
      this.logger.error(error);

      return { items: [] };
    }
  }

  protected stripNullBytes<T>(obj: T): T {
    if (typeof obj === 'string') {
      return obj.split('\u0000').join('') as T;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.stripNullBytes(item)) as T;
    }
    if (obj && typeof obj === 'object') {
      const cleaned = {} as Record<string, unknown>;
      for (const [key, value] of Object.entries(obj)) {
        cleaned[key] = this.stripNullBytes(value);
      }
      return cleaned as T;
    }
    return obj;
  }
  public abstract getTestSymbol(): string;

  protected abstract getProxyUrlKey(): keyof Environment;
  protected abstract getDataSource(): DataSource;
}
