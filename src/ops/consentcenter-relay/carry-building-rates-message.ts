import * as campaignsMarketingCampaignWorkflowServiceApi from "../../../.cache/proto/acme/campaigns/v1/marketing_campaign_workflow_service.js";
import * as notificationsDeliveryAttemptAdminServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_admin_service.js";
import * as workplacesBuildingCalculationServiceApi from "../../../.cache/proto/acme/workplaces/v1/building_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryBuildingRatesMessage keeps of each GetBuildingRates response. */
interface CarryBuildingRatesMessageRecord {
  message: string;
  correlationId: string;
}

/** Where carryBuildingRatesMessage hands each record. */
interface CarryBuildingRatesMessageTarget {
  send(record: CarryBuildingRatesMessageRecord): Promise<void>;
}

/** Sends records to acme.notifications.v1.DeliveryAttemptAdminService. */
class CarryBuildingRatesMessageDeliveryAttemptAdmin implements CarryBuildingRatesMessageTarget {
  private readonly client: notificationsDeliveryAttemptAdminServiceApi.DeliveryAttemptAdminServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsDeliveryAttemptAdminServiceApi.DeliveryAttemptAdminServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: CarryBuildingRatesMessageRecord): Promise<void> {
    await call<notificationsDeliveryAttemptAdminServiceApi.UnlockDeliveryAttemptRequest, notificationsDeliveryAttemptAdminServiceApi.UnlockDeliveryAttemptResponse>(
      (request, done) => this.client.unlockDeliveryAttempt(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      notificationsDeliveryAttemptAdminServiceApi.UnlockDeliveryAttemptRequest.fromPartial({ reason: record.message, deliveryAttemptId: record.correlationId }));
  }
}

/** Hands records to acme.campaigns.v1.MarketingCampaignWorkflowService. */
class CarryBuildingRatesMessageMarketingCampaignWorkflow implements CarryBuildingRatesMessageTarget {
  private readonly client: campaignsMarketingCampaignWorkflowServiceApi.MarketingCampaignWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new campaignsMarketingCampaignWorkflowServiceApi.MarketingCampaignWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: CarryBuildingRatesMessageRecord): Promise<void> {
    await call<campaignsMarketingCampaignWorkflowServiceApi.CancelMarketingCampaignWorkflowRequest, campaignsMarketingCampaignWorkflowServiceApi.CancelMarketingCampaignWorkflowResponse>(
      (request, done) => this.client.cancelMarketingCampaignWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      campaignsMarketingCampaignWorkflowServiceApi.CancelMarketingCampaignWorkflowRequest.fromPartial({ marketingCampaignId: record.message }));
  }
}

/** Only logs, for kinds no service takes yet. */
class CarryBuildingRatesMessageLogOnly implements CarryBuildingRatesMessageTarget {
  async send(record: CarryBuildingRatesMessageRecord): Promise<void> {
    console.info("no sink for record", record.message);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverCarryBuildingRatesMessage(kind: string, record: CarryBuildingRatesMessageRecord, runtime: Runtime): Promise<void> {
  let sink: CarryBuildingRatesMessageTarget = new CarryBuildingRatesMessageLogOnly();
  switch (kind) {
    case "delivery-attempt-admin":
      sink = new CarryBuildingRatesMessageDeliveryAttemptAdmin(runtime);
      break;
    case "marketing-campaign-workflow":
      sink = new CarryBuildingRatesMessageMarketingCampaignWorkflow(runtime);
      break;
  }
  await sink.send(record);
}

/**
 * Reads acme.workplaces.v1.BuildingCalculationService/GetBuildingRates and hands what it keeps to the sink of
 * its kind.
 */
export async function carryBuildingRatesMessage(runtime: Runtime): Promise<void> {
  const origin = new workplacesBuildingCalculationServiceApi.BuildingCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<workplacesBuildingCalculationServiceApi.GetBuildingRatesRequest, workplacesBuildingCalculationServiceApi.GetBuildingRatesResponse>(
    (request, done) => origin.getBuildingRates(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    workplacesBuildingCalculationServiceApi.GetBuildingRatesRequest.fromPartial({ buildingId: "live-carry-building-rates-message" }));
  const kept: CarryBuildingRatesMessageRecord = {
    message: text.normalize(response.result?.message ?? ""),
    correlationId: response.result?.correlationId ?? "",
  };
  await deliverCarryBuildingRatesMessage("marketing-campaign-workflow", kept, runtime);
}
