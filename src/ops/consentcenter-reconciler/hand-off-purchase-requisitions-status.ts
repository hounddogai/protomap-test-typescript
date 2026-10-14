import * as contentArticleWorkflowServiceApi from "../../../.cache/proto/acme/content/v1/article_workflow_service.js";
import * as notificationsDeliveryAttemptHistoryServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_history_service.js";
import * as procurementPurchaseRequisitionQueryServiceApi from "../../../.cache/proto/acme/procurement/v1/purchase_requisition_query_service.js";
import * as webhooksWebhookSecretWorkflowServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_secret_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What handOffPurchaseRequisitionsStatus keeps of each FindPurchaseRequisitions response. */
interface HandOffPurchaseRequisitionsStatusRecord {
  status: string;
  message: string;
  correlationId: string;
  nextPageToken: string;
}

/** Where handOffPurchaseRequisitionsStatus hands each record. */
interface HandOffPurchaseRequisitionsStatusDestination {
  forward(record: HandOffPurchaseRequisitionsStatusRecord): Promise<void>;
}

/** Writes records to acme.webhooks.v1.WebhookSecretWorkflowService. */
class HandOffPurchaseRequisitionsStatusWebhookSecretWorkflow implements HandOffPurchaseRequisitionsStatusDestination {
  private readonly client: webhooksWebhookSecretWorkflowServiceApi.WebhookSecretWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookSecretWorkflowServiceApi.WebhookSecretWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: HandOffPurchaseRequisitionsStatusRecord): Promise<void> {
    await retry(() => call<webhooksWebhookSecretWorkflowServiceApi.AdvanceWebhookSecretWorkflowRequest, webhooksWebhookSecretWorkflowServiceApi.AdvanceWebhookSecretWorkflowResponse>(
      (request, done) => this.client.advanceWebhookSecretWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      webhooksWebhookSecretWorkflowServiceApi.AdvanceWebhookSecretWorkflowRequest.fromPartial({ details: { step: record.nextPageToken } })));
  }
}

/** Passes records to acme.notifications.v1.DeliveryAttemptHistoryService. */
class HandOffPurchaseRequisitionsStatusDeliveryAttemptHistory implements HandOffPurchaseRequisitionsStatusDestination {
  private readonly client: notificationsDeliveryAttemptHistoryServiceApi.DeliveryAttemptHistoryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsDeliveryAttemptHistoryServiceApi.DeliveryAttemptHistoryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: HandOffPurchaseRequisitionsStatusRecord): Promise<void> {
    await call<notificationsDeliveryAttemptHistoryServiceApi.ListDeliveryAttemptVersionsRequest, notificationsDeliveryAttemptHistoryServiceApi.ListDeliveryAttemptVersionsResponse>(
      (request, done) => this.client.listDeliveryAttemptVersions(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      notificationsDeliveryAttemptHistoryServiceApi.ListDeliveryAttemptVersionsRequest.fromPartial({ filter: { query: record.message, region: record.status }, page: { pageToken: record.nextPageToken } }));
  }
}

/** Writes records to acme.content.v1.ArticleWorkflowService. */
class HandOffPurchaseRequisitionsStatusArticleWorkflow implements HandOffPurchaseRequisitionsStatusDestination {
  private readonly client: contentArticleWorkflowServiceApi.ArticleWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentArticleWorkflowServiceApi.ArticleWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: HandOffPurchaseRequisitionsStatusRecord): Promise<void> {
    await retry(() => call<contentArticleWorkflowServiceApi.CancelArticleWorkflowRequest, contentArticleWorkflowServiceApi.CancelArticleWorkflowResponse>(
      (request, done) => this.client.cancelArticleWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      contentArticleWorkflowServiceApi.CancelArticleWorkflowRequest.fromPartial({ details: { step: record.nextPageToken, initiatedBy: record.message }, article: { notes: record.correlationId } })));
  }
}

/**
 * Reads acme.procurement.v1.PurchaseRequisitionQueryService/FindPurchaseRequisitions and hands what it keeps
 * to the sink of its kind.
 */
export async function handOffPurchaseRequisitionsStatus(runtime: Runtime): Promise<void> {
  const origin = new procurementPurchaseRequisitionQueryServiceApi.PurchaseRequisitionQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<procurementPurchaseRequisitionQueryServiceApi.FindPurchaseRequisitionsRequest, procurementPurchaseRequisitionQueryServiceApi.FindPurchaseRequisitionsResponse>(
    (request, done) => origin.findPurchaseRequisitions(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    procurementPurchaseRequisitionQueryServiceApi.FindPurchaseRequisitionsRequest.fromPartial({ orderBy: "primary-hand-off-purchase-requisitions-status" }));
  const entry: HandOffPurchaseRequisitionsStatusRecord = {
    status: text.normalize(response.result?.status ?? ""),
    message: response.result?.message ?? "",
    correlationId: response.result?.correlationId ?? "",
    nextPageToken: text.normalize(response.pageInfo?.nextPageToken ?? ""),
  };
  const registry: Record<string, HandOffPurchaseRequisitionsStatusDestination> = {};
  for (const entry of [
    { kind: "webhook-secret-workflow", sink: new HandOffPurchaseRequisitionsStatusWebhookSecretWorkflow(runtime) },
    { kind: "delivery-attempt-history", sink: new HandOffPurchaseRequisitionsStatusDeliveryAttemptHistory(runtime) },
    { kind: "article-workflow", sink: new HandOffPurchaseRequisitionsStatusArticleWorkflow(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["delivery-attempt-history"]!.forward(entry);
}
