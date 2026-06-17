import { ConfigurationService } from '@ghostfolio/api/services/configuration/configuration.service';
import { BaseChinaDataProviderService } from '@ghostfolio/api/services/data-provider/base-china-data-provider.service';

import { Injectable } from '@nestjs/common';
import { DataSource } from '@prisma/client';

@Injectable()
export class CnFundService extends BaseChinaDataProviderService {
  constructor(configurationService: ConfigurationService) {
    super(configurationService);
  }

  protected getProxyUrlKey() {
    return 'CN_FUND_PROXY_URL' as const;
  }

  protected getDataSource() {
    return DataSource.CN_FUND;
  }

  public getTestSymbol() {
    return '159919';
  }
}
