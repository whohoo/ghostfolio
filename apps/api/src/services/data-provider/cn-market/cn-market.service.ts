import { ConfigurationService } from '@ghostfolio/api/services/configuration/configuration.service';
import { BaseChinaDataProviderService } from '@ghostfolio/api/services/data-provider/base-china-data-provider.service';

import { Injectable } from '@nestjs/common';
import { DataSource } from '@prisma/client';

@Injectable()
export class CnMarketService extends BaseChinaDataProviderService {
  constructor(configurationService: ConfigurationService) {
    super(configurationService);
  }

  public getTestSymbol() {
    return '600519.SS'; // 贵州茅台
  }

  protected getProxyUrlKey() {
    return 'CN_MARKET_PROXY_URL' as const;
  }

  protected getDataSource() {
    return DataSource.CN_MARKET;
  }
}
