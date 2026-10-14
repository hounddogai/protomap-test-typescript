import * as campaignsMarketingCampaignQueryServiceApi from "../../../.cache/proto/acme/campaigns/v1/marketing_campaign_query_service.js";
import * as complianceComplianceCaseCalculationServiceApi from "../../../.cache/proto/acme/compliance/v1/compliance_case_calculation_service.js";
import * as notificationsSubscriptionApprovalServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_approval_service.js";
import * as procurementPurchaseRequisitionCalculationServiceApi from "../../../.cache/proto/acme/procurement/v1/purchase_requisition_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What routePurchaseRequisitionsId keeps of each RecalculatePurchaseRequisitions response. */
interface RoutePurchaseRequisitionsIdRecord {
  correlationId: string;
  purchaseRequisitionId: string;
  currencyCode: string;
}

/** Where routePurchaseRequisitionsId hands each record. */
interface RoutePurchaseRequisitionsIdWriter {
  write(record: RoutePurchaseRequisitionsIdRecord): Promise<void>;
}

/** Sends records to acme.notifications.v1.SubscriptionApprovalService. */
class RoutePurchaseRequisitionsIdSubscriptionApproval implements RoutePurchaseRequisitionsIdWriter {
  private readonly client: notificationsSubscriptionApprovalServiceApi.SubscriptionApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsSubscriptionApprovalServiceApi.SubscriptionApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: RoutePurchaseRequisitionsIdRecord): Promise<void> {
    await retry(() => call<notificationsSubscriptionApprovalServiceApi.GetSubscriptionApprovalStatusRequest, notificationsSubscriptionApprovalServiceApi.GetSubscriptionApprovalStatusResponse>(
      (request, done) => this.client.getSubscriptionApprovalStatus(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      notificationsSubscriptionApprovalServiceApi.GetSubscriptionApprovalStatusRequest.fromPartial({ subscriptionId: record.purchaseRequisitionId })));
  }
}

/** Writes records to acme.campaigns.v1.MarketingCampaignQueryService. */
class RoutePurchaseRequisitionsIdMarketingCampaignQuery implements RoutePurchaseRequisitionsIdWriter {
  private readonly client: campaignsMarketingCampaignQueryServiceApi.MarketingCampaignQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new campaignsMarketingCampaignQueryServiceApi.MarketingCampaignQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: RoutePurchaseRequisitionsIdRecord): Promise<void> {
    await call<campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsResponse>(
      (request, done) => this.client.suggestMarketingCampaigns(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsRequest.fromPartial({ filter: { region: record.currencyCode } }));
  }
}

/** Hands records to acme.compliance.v1.ComplianceCaseCalculationService. */
class RoutePurchaseRequisitionsIdComplianceCaseCalculation implements RoutePurchaseRequisitionsIdWriter {
  private readonly client: complianceComplianceCaseCalculationServiceApi.ComplianceCaseCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new complianceComplianceCaseCalculationServiceApi.ComplianceCaseCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: RoutePurchaseRequisitionsIdRecord): Promise<void> {
    await retry(() => call<complianceComplianceCaseCalculationServiceApi.CompareComplianceCaseOptionsRequest, complianceComplianceCaseCalculationServiceApi.CompareComplianceCaseOptionsResponse>(
      (request, done) => this.client.compareComplianceCaseOptions(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      complianceComplianceCaseCalculationServiceApi.CompareComplianceCaseOptionsRequest.fromPartial({ complianceCase: { subject: record.purchaseRequisitionId } })));
  }
}

/**
 * Reads acme.procurement.v1.PurchaseRequisitionCalculationService/RecalculatePurchaseRequisitions and hands
 * what it keeps to the sink of its kind.
 */
export async function routePurchaseRequisitionsId(runtime: Runtime): Promise<void> {
  const reader = new procurementPurchaseRequisitionCalculationServiceApi.PurchaseRequisitionCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<procurementPurchaseRequisitionCalculationServiceApi.RecalculatePurchaseRequisitionsRequest, procurementPurchaseRequisitionCalculationServiceApi.RecalculatePurchaseRequisitionsResponse>(
    (request, done) => reader.recalculatePurchaseRequisitions(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    procurementPurchaseRequisitionCalculationServiceApi.RecalculatePurchaseRequisitionsRequest.fromPartial({ purchaseRequisitionId: "nightly-route-purchase-requisitions-id" }));
  const row: RoutePurchaseRequisitionsIdRecord = {
    correlationId: reply.result?.correlationId ?? "",
    purchaseRequisitionId: reply.purchaseRequisition?.purchaseRequisitionId ?? "",
    currencyCode: text.normalize(reply.breakdown?.currencyCode ?? ""),
  };
  const registry: Record<string, RoutePurchaseRequisitionsIdWriter> = {};
  for (const entry of [
    { kind: "subscription-approval", sink: new RoutePurchaseRequisitionsIdSubscriptionApproval(runtime) },
    { kind: "marketing-campaign-query", sink: new RoutePurchaseRequisitionsIdMarketingCampaignQuery(runtime) },
    { kind: "compliance-case-calculation", sink: new RoutePurchaseRequisitionsIdComplianceCaseCalculation(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["subscription-approval"]!.write(row);
}
