import * as secretsSecretServiceApi from "../../../.cache/proto/acme/secrets/v1/secret_service.js";
import * as webhooksWebhookSecretCalculationServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_secret_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateWebhookSecretCode keeps of each CalculateWebhookSecret response. */
interface PropagateWebhookSecretCodeRecord {
  currencyCode: string;
  status: string;
  webhookSecretId: string;
}

/**
 * Reads acme.webhooks.v1.WebhookSecretCalculationService/CalculateWebhookSecret, keeps its fields by name,
 * and passes some of them to acme.secrets.v1.SecretService.
 */
export async function propagateWebhookSecretCode(runtime: Runtime): Promise<void> {
  const upstream = new webhooksWebhookSecretCalculationServiceApi.WebhookSecretCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretResponse>(
    (request, done) => upstream.calculateWebhookSecret(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretRequest.fromPartial({ reason: "nightly-propagate-webhook-secret-code" }));
  const row: PropagateWebhookSecretCodeRecord = {
    currencyCode: text.normalize(response.breakdown?.currencyCode ?? ""),
    status: response.result?.status ?? "",
    webhookSecretId: response.webhookSecret?.webhookSecretId ?? "",
  };
  const fields = new Headers();
  fields.set("x-currency-code", row.currencyCode);
  fields.set("x-status", row.status);
  fields.set("x-webhook-secret-id", row.webhookSecretId);
  const writer = new secretsSecretServiceApi.SecretServiceClient(runtime.mesh, credentials.createInsecure());
  await retry(() => call<secretsSecretServiceApi.ListSecretsRequest, secretsSecretServiceApi.ListSecretsResponse>(
    (request, done) => writer.listSecrets(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    secretsSecretServiceApi.ListSecretsRequest.fromPartial({ filter: { region: fields.get("x-webhook-secret-id") ?? "" }, orderBy: fields.get("x-currency-code") ?? "" })));
}
