import { ConfigurationService } from '@ghostfolio/api/services/configuration/configuration.service';
import { BaseChinaDataProviderService } from '@ghostfolio/api/services/data-provider/base-china-data-provider.service';

import { Injectable } from '@nestjs/common';
import { DataSource } from '@prisma/client';

@Injectable()
export class CnStockService extends BaseChinaDataProviderService {
  constructor(configurationService: ConfigurationService) {
    super(configurationService);
  }

  protected getProxyUrlKey() {
    return 'CN_STOCK_PROXY_URL';
  }

  protected getDataSource() {
    return DataSource.CN_STOCK;
  }

  public getTestSymbol() {
    return '600519';
  }
}
