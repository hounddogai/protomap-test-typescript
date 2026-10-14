import * as chatChatBotLifecycleServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_lifecycle_service.js";
import * as formsFormCalculationServiceApi from "../../../.cache/proto/acme/forms/v1/form_calculation_service.js";
import * as surveysQuestionValidationServiceApi from "../../../.cache/proto/acme/surveys/v1/question_validation_service.js";
import * as webhooksWebhookEndpointQueryServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What handOffFormOptionsStatus keeps of each CompareFormOptions response. */
interface HandOffFormOptionsStatusRecord {
  status: string;
  message: string;
  currencyCode: string;
}

/** Where handOffFormOptionsStatus hands each record. */
interface HandOffFormOptionsStatusWriter {
  write(record: HandOffFormOptionsStatusRecord): Promise<void>;
}

/** Passes records to acme.chat.v1.ChatBotLifecycleService. */
class HandOffFormOptionsStatusChatBotLifecycle implements HandOffFormOptionsStatusWriter {
  private readonly client: chatChatBotLifecycleServiceApi.ChatBotLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatBotLifecycleServiceApi.ChatBotLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: HandOffFormOptionsStatusRecord): Promise<void> {
    await retry(() => call<chatChatBotLifecycleServiceApi.TerminateChatBotRequest, chatChatBotLifecycleServiceApi.TerminateChatBotResponse>(
      (request, done) => this.client.terminateChatBot(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      chatChatBotLifecycleServiceApi.TerminateChatBotRequest.fromPartial({ reason: record.status })));
  }
}

/** Passes records to acme.surveys.v1.QuestionValidationService. */
class HandOffFormOptionsStatusQuestionValidation implements HandOffFormOptionsStatusWriter {
  private readonly client: surveysQuestionValidationServiceApi.QuestionValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysQuestionValidationServiceApi.QuestionValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: HandOffFormOptionsStatusRecord): Promise<void> {
    await call<surveysQuestionValidationServiceApi.ValidateQuestionRequest, surveysQuestionValidationServiceApi.ValidateQuestionResponse>(
      (request, done) => this.client.validateQuestion(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      surveysQuestionValidationServiceApi.ValidateQuestionRequest.fromPartial({ reason: record.status, question: { description: record.currencyCode }, details: { locale: record.message } }));
  }
}

/** Passes records to acme.webhooks.v1.WebhookEndpointQueryService. */
class HandOffFormOptionsStatusWebhookEndpointQuery implements HandOffFormOptionsStatusWriter {
  private readonly client: webhooksWebhookEndpointQueryServiceApi.WebhookEndpointQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookEndpointQueryServiceApi.WebhookEndpointQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: HandOffFormOptionsStatusRecord): Promise<void> {
    await retry(() => call<webhooksWebhookEndpointQueryServiceApi.SuggestWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.SuggestWebhookEndpointsResponse>(
      (request, done) => this.client.suggestWebhookEndpoints(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      webhooksWebhookEndpointQueryServiceApi.SuggestWebhookEndpointsRequest.fromPartial({ page: { pageToken: record.message }, orderBy: record.currencyCode })));
  }
}

/** Runs the action registered for kind. */
async function actOnHandOffFormOptionsStatus(kind: string, record: HandOffFormOptionsStatusRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "chat-bot-lifecycle": () => new HandOffFormOptionsStatusChatBotLifecycle(runtime).write(record),
    "question-validation": () => new HandOffFormOptionsStatusQuestionValidation(runtime).write(record),
    "webhook-endpoint-query": () => new HandOffFormOptionsStatusWebhookEndpointQuery(runtime).write(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.forms.v1.FormCalculationService/CompareFormOptions and hands what it keeps to the sink of its
 * kind.
 */
export async function handOffFormOptionsStatus(runtime: Runtime): Promise<void> {
  const origin = new formsFormCalculationServiceApi.FormCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<formsFormCalculationServiceApi.CompareFormOptionsRequest, formsFormCalculationServiceApi.CompareFormOptionsResponse>(
    (request, done) => origin.compareFormOptions(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    formsFormCalculationServiceApi.CompareFormOptionsRequest.fromPartial({ reason: "primary-hand-off-form-options-status" })));
  const record: HandOffFormOptionsStatusRecord = {
    status: response.result?.status ?? "",
    message: response.result?.message ?? "",
    currencyCode: response.breakdown?.currencyCode ?? "",
  };
  await actOnHandOffFormOptionsStatus("chat-bot-lifecycle", record, runtime);
}
