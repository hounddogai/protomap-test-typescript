import * as boxofficeBoxOfficeSaleQueryServiceApi from "../../../.cache/proto/acme/boxoffice/v1/box_office_sale_query_service.js";
import * as campaignsMarketingCampaignQueryServiceApi from "../../../.cache/proto/acme/campaigns/v1/marketing_campaign_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What pushBoxOfficeSalesId keeps of each SuggestBoxOfficeSales response. */
interface PushBoxOfficeSalesIdRecord {
  correlationId: string;
  status: string;
  nextPageToken: string;
}

/** Where pushBoxOfficeSalesId hands each record. */
interface PushBoxOfficeSalesIdSink {
  send(record: PushBoxOfficeSalesIdRecord): Promise<void>;
}

/** Hands records to acme.campaigns.v1.MarketingCampaignQueryService. */
class PushBoxOfficeSalesIdMarketingCampaignQuery implements PushBoxOfficeSalesIdSink {
  private readonly client: campaignsMarketingCampaignQueryServiceApi.MarketingCampaignQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new campaignsMarketingCampaignQueryServiceApi.MarketingCampaignQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: PushBoxOfficeSalesIdRecord): Promise<void> {
    await retry(() => call<campaignsMarketingCampaignQueryServiceApi.CountMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.CountMarketingCampaignsResponse>(
      (request, done) => this.client.countMarketingCampaigns(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      campaignsMarketingCampaignQueryServiceApi.CountMarketingCampaignsRequest.fromPartial({ filter: { ownerId: record.nextPageToken, region: record.correlationId }, orderBy: record.status })));
  }
}

/**
 * Reads acme.boxoffice.v1.BoxOfficeSaleQueryService/SuggestBoxOfficeSales and hands what it keeps to
 * acme.campaigns.v1.MarketingCampaignQueryService.
 */
export async function pushBoxOfficeSalesId(runtime: Runtime): Promise<void> {
  const origin = new boxofficeBoxOfficeSaleQueryServiceApi.BoxOfficeSaleQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<boxofficeBoxOfficeSaleQueryServiceApi.SuggestBoxOfficeSalesRequest, boxofficeBoxOfficeSaleQueryServiceApi.SuggestBoxOfficeSalesResponse>(
    (request, done) => origin.suggestBoxOfficeSales(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    boxofficeBoxOfficeSaleQueryServiceApi.SuggestBoxOfficeSalesRequest.fromPartial({ orderBy: "current-push-box-office-sales-id" }));
  const entry: PushBoxOfficeSalesIdRecord = {
    correlationId: response.result?.correlationId ?? "",
    status: response.result?.status ?? "",
    nextPageToken: response.pageInfo?.nextPageToken ?? "",
  };
  await new PushBoxOfficeSalesIdMarketingCampaignQuery(runtime).send(entry);
}
