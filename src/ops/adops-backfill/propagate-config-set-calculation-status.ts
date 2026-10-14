import * as configurationConfigSetCalculationServiceApi from "../../../.cache/proto/acme/configuration/v1/config_set_calculation_service.js";
import * as webhooksWebhookDeliveryQueryServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_delivery_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateConfigSetCalculationStatus keeps of each ExplainConfigSetCalculation response. */
interface PropagateConfigSetCalculationStatusRecord {
  status: string;
  message: string;
}

/** Where propagateConfigSetCalculationStatus hands each record. */
interface PropagateConfigSetCalculationStatusWriter {
  apply(record: PropagateConfigSetCalculationStatusRecord): Promise<void>;
}

/** Hands records to acme.webhooks.v1.WebhookDeliveryQueryService. */
class PropagateConfigSetCalculationStatusWebhookDeliveryQuery implements PropagateConfigSetCalculationStatusWriter {
  private readonly client: webhooksWebhookDeliveryQueryServiceApi.WebhookDeliveryQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookDeliveryQueryServiceApi.WebhookDeliveryQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PropagateConfigSetCalculationStatusRecord): Promise<void> {
    await retry(() => call<webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesResponse>(
      (request, done) => this.client.summarizeWebhookDeliveries(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesRequest.fromPartial({ reason: record.message, details: { format: record.status } })));
  }
}

/**
 * Reads acme.configuration.v1.ConfigSetCalculationService/ExplainConfigSetCalculation and hands what it keeps
 * to acme.webhooks.v1.WebhookDeliveryQueryService.
 */
export async function propagateConfigSetCalculationStatus(runtime: Runtime): Promise<void> {
  const source = new configurationConfigSetCalculationServiceApi.ConfigSetCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<configurationConfigSetCalculationServiceApi.ExplainConfigSetCalculationRequest, configurationConfigSetCalculationServiceApi.ExplainConfigSetCalculationResponse>(
    (request, done) => source.explainConfigSetCalculation(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    configurationConfigSetCalculationServiceApi.ExplainConfigSetCalculationRequest.fromPartial({ configSetId: "primary-propagate-config-set-calculation-status" })));
  const entry: PropagateConfigSetCalculationStatusRecord = {
    status: response.result?.status ?? "",
    message: response.result?.message ?? "",
  };
  await new PropagateConfigSetCalculationStatusWebhookDeliveryQuery(runtime).apply(entry);
}
