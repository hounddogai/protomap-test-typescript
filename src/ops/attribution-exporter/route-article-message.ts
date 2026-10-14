import * as catalogProductCalculationServiceApi from "../../../.cache/proto/acme/catalog/v1/product_calculation_service.js";
import * as contentArticleApprovalServiceApi from "../../../.cache/proto/acme/content/v1/article_approval_service.js";
import * as messagingChatMessageCalculationServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_calculation_service.js";
import * as webhooksWebhookSecretValidationServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_secret_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What routeArticleMessage keeps of each SubmitArticle response. */
interface RouteArticleMessageRecord {
  message: string;
  number: string;
  status: string;
}

/** Where routeArticleMessage hands each record. */
interface RouteArticleMessageWriter {
  send(record: RouteArticleMessageRecord): Promise<void>;
}

/** Writes records to acme.webhooks.v1.WebhookSecretValidationService. */
class RouteArticleMessageWebhookSecretValidation implements RouteArticleMessageWriter {
  private readonly client: webhooksWebhookSecretValidationServiceApi.WebhookSecretValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookSecretValidationServiceApi.WebhookSecretValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: RouteArticleMessageRecord): Promise<void> {
    await call<webhooksWebhookSecretValidationServiceApi.LintWebhookSecretsRequest, webhooksWebhookSecretValidationServiceApi.LintWebhookSecretsResponse>(
      (request, done) => this.client.lintWebhookSecrets(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      webhooksWebhookSecretValidationServiceApi.LintWebhookSecretsRequest.fromPartial({ webhookSecretId: record.message, details: { locale: record.status }, webhookSecret: { webhookSecretId: record.number } }));
  }
}

/** Writes records to acme.catalog.v1.ProductCalculationService. */
class RouteArticleMessageProductCalculation implements RouteArticleMessageWriter {
  private readonly client: catalogProductCalculationServiceApi.ProductCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new catalogProductCalculationServiceApi.ProductCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: RouteArticleMessageRecord): Promise<void> {
    await call<catalogProductCalculationServiceApi.CalculateProductRequest, catalogProductCalculationServiceApi.CalculateProductResponse>(
      (request, done) => this.client.calculateProduct(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      catalogProductCalculationServiceApi.CalculateProductRequest.fromPartial({ productId: record.status }));
  }
}

/** Hands records to acme.messaging.v1.ChatMessageCalculationService. */
class RouteArticleMessageChatMessageCalculation implements RouteArticleMessageWriter {
  private readonly client: messagingChatMessageCalculationServiceApi.ChatMessageCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingChatMessageCalculationServiceApi.ChatMessageCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: RouteArticleMessageRecord): Promise<void> {
    await call<messagingChatMessageCalculationServiceApi.GetChatMessageRatesRequest, messagingChatMessageCalculationServiceApi.GetChatMessageRatesResponse>(
      (request, done) => this.client.getChatMessageRates(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      messagingChatMessageCalculationServiceApi.GetChatMessageRatesRequest.fromPartial({ chatMessageId: record.message }));
  }
}

/** Only logs, for kinds no service takes yet. */
class RouteArticleMessageLogOnly implements RouteArticleMessageWriter {
  async send(record: RouteArticleMessageRecord): Promise<void> {
    console.info("no sink for record", record.message);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverRouteArticleMessage(kind: string, record: RouteArticleMessageRecord, runtime: Runtime): Promise<void> {
  let sink: RouteArticleMessageWriter = new RouteArticleMessageLogOnly();
  switch (kind) {
    case "webhook-secret-validation":
      sink = new RouteArticleMessageWebhookSecretValidation(runtime);
      break;
    case "product-calculation":
      sink = new RouteArticleMessageProductCalculation(runtime);
      break;
    case "chat-message-calculation":
      sink = new RouteArticleMessageChatMessageCalculation(runtime);
      break;
  }
  await sink.send(record);
}

/** Reads acme.content.v1.ArticleApprovalService/SubmitArticle and hands what it keeps to the sink of its kind. */
export async function routeArticleMessage(runtime: Runtime): Promise<void> {
  const reader = new contentArticleApprovalServiceApi.ArticleApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<contentArticleApprovalServiceApi.SubmitArticleRequest, contentArticleApprovalServiceApi.SubmitArticleResponse>(
    (request, done) => reader.submitArticle(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    contentArticleApprovalServiceApi.SubmitArticleRequest.fromPartial({ reason: "nightly-route-article-message" })));
  const kept: RouteArticleMessageRecord = {
    message: text.normalize(reply.result?.message ?? ""),
    number: text.normalize(reply.article?.number ?? ""),
    status: reply.outcome?.status ?? "",
  };
  await deliverRouteArticleMessage("webhook-secret-validation", kept, runtime);
}
