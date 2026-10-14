import * as contentContentBlockValidationServiceApi from "../../../.cache/proto/acme/content/v1/content_block_validation_service.js";
import * as notificationsDeliveryAttemptHistoryServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_history_service.js";
import * as webhooksWebhookSecretCalculationServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_secret_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardWebhookSecretId keeps of each SimulateWebhookSecret response. */
interface ForwardWebhookSecretIdRecord {
  correlationId: string;
  message: string;
  currencyCode: string;
  breakdownCurrencyCode: string;
}

/** Where forwardWebhookSecretId hands each record. */
interface ForwardWebhookSecretIdSink {
  send(record: ForwardWebhookSecretIdRecord): Promise<void>;
}

/** Sends records to acme.notifications.v1.DeliveryAttemptHistoryService. */
class ForwardWebhookSecretIdDeliveryAttemptHistory implements ForwardWebhookSecretIdSink {
  private readonly client: notificationsDeliveryAttemptHistoryServiceApi.DeliveryAttemptHistoryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsDeliveryAttemptHistoryServiceApi.DeliveryAttemptHistoryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ForwardWebhookSecretIdRecord): Promise<void> {
    await call<notificationsDeliveryAttemptHistoryServiceApi.ListDeliveryAttemptVersionsRequest, notificationsDeliveryAttemptHistoryServiceApi.ListDeliveryAttemptVersionsResponse>(
      (request, done) => this.client.listDeliveryAttemptVersions(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      notificationsDeliveryAttemptHistoryServiceApi.ListDeliveryAttemptVersionsRequest.fromPartial({ page: { pageToken: record.correlationId }, orderBy: record.message, filter: { query: record.breakdownCurrencyCode } }));
  }
}

/** Sends records to acme.content.v1.ContentBlockValidationService. */
class ForwardWebhookSecretIdContentBlockValidation implements ForwardWebhookSecretIdSink {
  private readonly client: contentContentBlockValidationServiceApi.ContentBlockValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentContentBlockValidationServiceApi.ContentBlockValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ForwardWebhookSecretIdRecord): Promise<void> {
    await call<contentContentBlockValidationServiceApi.ScoreContentBlockRequest, contentContentBlockValidationServiceApi.ScoreContentBlockResponse>(
      (request, done) => this.client.scoreContentBlock(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      contentContentBlockValidationServiceApi.ScoreContentBlockRequest.fromPartial({ contentBlock: { parentId: record.breakdownCurrencyCode, name: record.correlationId, contentBlockId: record.message } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class ForwardWebhookSecretIdLogOnly implements ForwardWebhookSecretIdSink {
  async send(record: ForwardWebhookSecretIdRecord): Promise<void> {
    console.info("no sink for record", record.correlationId);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchForwardWebhookSecretId(kind: string, record: ForwardWebhookSecretIdRecord, runtime: Runtime): Promise<void> {
  let write = (item: ForwardWebhookSecretIdRecord): Promise<void> => new ForwardWebhookSecretIdLogOnly().send(item);
  switch (kind) {
    case "delivery-attempt-history":
      write = (item) => new ForwardWebhookSecretIdDeliveryAttemptHistory(runtime).send(item);
      break;
    case "content-block-validation":
      write = (item) => new ForwardWebhookSecretIdContentBlockValidation(runtime).send(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.webhooks.v1.WebhookSecretCalculationService/SimulateWebhookSecret and hands what it keeps to the
 * sink of its kind.
 */
export async function forwardWebhookSecretId(runtime: Runtime): Promise<void> {
  const reader = new webhooksWebhookSecretCalculationServiceApi.WebhookSecretCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretResponse>(
    (request, done) => reader.simulateWebhookSecret(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretRequest.fromPartial({ webhookSecretId: "live-forward-webhook-secret-id" }));
  const kept: ForwardWebhookSecretIdRecord = {
    correlationId: current.result?.correlationId ?? "",
    message: text.normalize(current.result?.message ?? ""),
    currencyCode: current.webhookSecret?.currencyCode ?? "",
    breakdownCurrencyCode: current.breakdown?.currencyCode ?? "",
  };
  await dispatchForwardWebhookSecretId("delivery-attempt-history", kept, runtime);
}
