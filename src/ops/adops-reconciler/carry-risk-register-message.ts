import * as campaignsMarketingCampaignServiceApi from "../../../.cache/proto/acme/campaigns/v1/marketing_campaign_service.js";
import * as contentTaxonomyApprovalServiceApi from "../../../.cache/proto/acme/content/v1/taxonomy_approval_service.js";
import * as riskRiskRegisterQueryServiceApi from "../../../.cache/proto/acme/risk/v1/risk_register_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryRiskRegisterMessage keeps of each LookupRiskRegister response. */
interface CarryRiskRegisterMessageRecord {
  message: string;
  riskRegisterId: string;
  status: string;
  parentId: string;
}

/** Where carryRiskRegisterMessage hands each record. */
interface CarryRiskRegisterMessageSink {
  push(record: CarryRiskRegisterMessageRecord): Promise<void>;
}

/** Sends records to acme.campaigns.v1.MarketingCampaignService. */
class CarryRiskRegisterMessageMarketingCampaign implements CarryRiskRegisterMessageSink {
  private readonly client: campaignsMarketingCampaignServiceApi.MarketingCampaignServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new campaignsMarketingCampaignServiceApi.MarketingCampaignServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CarryRiskRegisterMessageRecord): Promise<void> {
    await call<campaignsMarketingCampaignServiceApi.UpdateMarketingCampaignRequest, campaignsMarketingCampaignServiceApi.UpdateMarketingCampaignResponse>(
      (request, done) => this.client.updateMarketingCampaign(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      campaignsMarketingCampaignServiceApi.UpdateMarketingCampaignRequest.fromPartial({ marketingCampaign: { title: record.parentId, marketingCampaignId: record.riskRegisterId } }));
  }
}

/** Passes records to acme.content.v1.TaxonomyApprovalService. */
class CarryRiskRegisterMessageTaxonomyApproval implements CarryRiskRegisterMessageSink {
  private readonly client: contentTaxonomyApprovalServiceApi.TaxonomyApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentTaxonomyApprovalServiceApi.TaxonomyApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CarryRiskRegisterMessageRecord): Promise<void> {
    await call<contentTaxonomyApprovalServiceApi.CommentTaxonomyApprovalRequest, contentTaxonomyApprovalServiceApi.CommentTaxonomyApprovalResponse>(
      (request, done) => this.client.commentTaxonomyApproval(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      contentTaxonomyApprovalServiceApi.CommentTaxonomyApprovalRequest.fromPartial({ taxonomy: { parentId: record.status, taxonomyId: record.riskRegisterId, name: record.message } }));
  }
}

/**
 * Reads acme.risk.v1.RiskRegisterQueryService/LookupRiskRegister and hands what it keeps to the sink of its
 * kind.
 */
export async function carryRiskRegisterMessage(runtime: Runtime): Promise<void> {
  const upstream = new riskRiskRegisterQueryServiceApi.RiskRegisterQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<riskRiskRegisterQueryServiceApi.LookupRiskRegisterRequest, riskRiskRegisterQueryServiceApi.LookupRiskRegisterResponse>(
    (request, done) => upstream.lookupRiskRegister(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    riskRiskRegisterQueryServiceApi.LookupRiskRegisterRequest.fromPartial({ riskRegisterId: "live-carry-risk-register-message" })));
  const record: CarryRiskRegisterMessageRecord = {
    message: current.result?.message ?? "",
    riskRegisterId: current.riskRegister?.riskRegisterId ?? "",
    status: current.result?.status ?? "",
    parentId: current.riskRegister?.parentId ?? "",
  };
  const entries: Array<{ kind: string; sink: CarryRiskRegisterMessageSink }> = [
    { kind: "marketing-campaign", sink: new CarryRiskRegisterMessageMarketingCampaign(runtime) },
    { kind: "taxonomy-approval", sink: new CarryRiskRegisterMessageTaxonomyApproval(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "marketing-campaign") continue;
    await entry.sink.push(record);
  }
}
