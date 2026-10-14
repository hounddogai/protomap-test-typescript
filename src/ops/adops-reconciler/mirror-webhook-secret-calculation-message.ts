import * as webhooksWebhookSecretCalculationServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_secret_calculation_service.js";
import * as webhooksWebhookSecretValidationServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_secret_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What mirrorWebhookSecretCalculationMessage keeps of each ExplainWebhookSecretCalculation response. */
interface MirrorWebhookSecretCalculationMessageRecord {
  message: string;
  status: string;
  resultStatus: string;
}

/** Where mirrorWebhookSecretCalculationMessage hands each record. */
interface MirrorWebhookSecretCalculationMessageTarget {
  send(record: MirrorWebhookSecretCalculationMessageRecord): Promise<void>;
}

/** Passes records to acme.webhooks.v1.WebhookSecretValidationService. */
class MirrorWebhookSecretCalculationMessageWebhookSecretValidation implements MirrorWebhookSecretCalculationMessageTarget {
  private readonly client: webhooksWebhookSecretValidationServiceApi.WebhookSecretValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookSecretValidationServiceApi.WebhookSecretValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: MirrorWebhookSecretCalculationMessageRecord): Promise<void> {
    await call<webhooksWebhookSecretValidationServiceApi.ValidateWebhookSecretRequest, webhooksWebhookSecretValidationServiceApi.ValidateWebhookSecretResponse>(
      (request, done) => this.client.validateWebhookSecret(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      webhooksWebhookSecretValidationServiceApi.ValidateWebhookSecretRequest.fromPartial({ webhookSecret: { currencyCode: record.resultStatus }, details: { locale: record.message } }));
  }
}

/**
 * Reads acme.webhooks.v1.WebhookSecretCalculationService/ExplainWebhookSecretCalculation and hands what it
 * keeps to acme.webhooks.v1.WebhookSecretValidationService.
 */
export async function mirrorWebhookSecretCalculationMessage(runtime: Runtime): Promise<void> {
  const upstream = new webhooksWebhookSecretCalculationServiceApi.WebhookSecretCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest, webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationResponse>(
    (request, done) => upstream.explainWebhookSecretCalculation(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest.fromPartial({ reason: "nightly-mirror-webhook-secret-calculation-message" }));
  const row: MirrorWebhookSecretCalculationMessageRecord = {
    message: found.outcome?.message ?? "",
    status: found.outcome?.status ?? "",
    resultStatus: found.result?.status ?? "",
  };
  await new MirrorWebhookSecretCalculationMessageWebhookSecretValidation(runtime).send(row);
}
