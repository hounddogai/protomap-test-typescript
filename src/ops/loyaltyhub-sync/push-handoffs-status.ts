import * as chatHandoffSyncServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_sync_service.js";
import * as secretsSecretQueryServiceApi from "../../../.cache/proto/acme/secrets/v1/secret_query_service.js";
import * as webhooksWebhookDeliveryApprovalServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_delivery_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What pushHandoffsStatus keeps of each ReconcileHandoffs response. */
interface PushHandoffsStatusRecord {
  status: string;
  referenceId: string;
  message: string;
  correlationId: string;
}

/** Where pushHandoffsStatus hands each record. */
interface PushHandoffsStatusDestination {
  deliver(record: PushHandoffsStatusRecord): Promise<void>;
}

/** Hands records to acme.webhooks.v1.WebhookDeliveryApprovalService. */
class PushHandoffsStatusWebhookDeliveryApproval implements PushHandoffsStatusDestination {
  private readonly client: webhooksWebhookDeliveryApprovalServiceApi.WebhookDeliveryApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookDeliveryApprovalServiceApi.WebhookDeliveryApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PushHandoffsStatusRecord): Promise<void> {
    await call<webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryRequest, webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryResponse>(
      (request, done) => this.client.rejectWebhookDelivery(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryRequest.fromPartial({ webhookDeliveryId: record.message, details: { approverEmail: record.status } }));
  }
}

/** Sends records to acme.secrets.v1.SecretQueryService. */
class PushHandoffsStatusSecretQuery implements PushHandoffsStatusDestination {
  private readonly client: secretsSecretQueryServiceApi.SecretQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new secretsSecretQueryServiceApi.SecretQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PushHandoffsStatusRecord): Promise<void> {
    await call<secretsSecretQueryServiceApi.CountSecretsRequest, secretsSecretQueryServiceApi.CountSecretsResponse>(
      (request, done) => this.client.countSecrets(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      secretsSecretQueryServiceApi.CountSecretsRequest.fromPartial({ page: { pageToken: record.referenceId }, filter: { region: record.status } }));
  }
}

/** Reads acme.chat.v1.HandoffSyncService/ReconcileHandoffs and hands what it keeps to the sink of its kind. */
export async function pushHandoffsStatus(runtime: Runtime): Promise<void> {
  const upstream = new chatHandoffSyncServiceApi.HandoffSyncServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<chatHandoffSyncServiceApi.ReconcileHandoffsRequest, chatHandoffSyncServiceApi.ReconcileHandoffsResponse>(
    (request, done) => upstream.reconcileHandoffs(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    chatHandoffSyncServiceApi.ReconcileHandoffsRequest.fromPartial({ handoffId: "primary-push-handoffs-status" })));
  const row: PushHandoffsStatusRecord = {
    status: reply.outcome?.status ?? "",
    referenceId: reply.outcome?.referenceId ?? "",
    message: reply.result?.message ?? "",
    correlationId: reply.result?.correlationId ?? "",
  };
  const sinks = new Map<string, PushHandoffsStatusDestination>();
  sinks.set("webhook-delivery-approval", new PushHandoffsStatusWebhookDeliveryApproval(runtime));
  sinks.set("secret-query", new PushHandoffsStatusSecretQuery(runtime));
  await sinks.get("secret-query")!.deliver(row);
}
