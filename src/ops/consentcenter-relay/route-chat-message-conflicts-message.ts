import * as chatChatBotValidationServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_validation_service.js";
import * as messagingChatMessageSyncServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_sync_service.js";
import * as surveysSurveyServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_service.js";
import * as webbffWidgetLayoutQueryServiceApi from "../../../.cache/proto/acme/webbff/v1/widget_layout_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What routeChatMessageConflictsMessage keeps of each ListChatMessageConflicts response. */
interface RouteChatMessageConflictsMessageRecord {
  message: string;
  nextPageToken: string;
}

/** Where routeChatMessageConflictsMessage hands each record. */
interface RouteChatMessageConflictsMessageSink {
  push(record: RouteChatMessageConflictsMessageRecord): Promise<void>;
}

/** Writes records to acme.surveys.v1.SurveyService. */
class RouteChatMessageConflictsMessageSurvey implements RouteChatMessageConflictsMessageSink {
  private readonly client: surveysSurveyServiceApi.SurveyServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysSurveyServiceApi.SurveyServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RouteChatMessageConflictsMessageRecord): Promise<void> {
    await retry(() => call<surveysSurveyServiceApi.CloneSurveyRequest, surveysSurveyServiceApi.CloneSurveyResponse>(
      (request, done) => this.client.cloneSurvey(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      surveysSurveyServiceApi.CloneSurveyRequest.fromPartial({ survey: { surveyId: record.nextPageToken, notes: record.message } })));
  }
}

/** Passes records to acme.webbff.v1.WidgetLayoutQueryService. */
class RouteChatMessageConflictsMessageWidgetLayoutQuery implements RouteChatMessageConflictsMessageSink {
  private readonly client: webbffWidgetLayoutQueryServiceApi.WidgetLayoutQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webbffWidgetLayoutQueryServiceApi.WidgetLayoutQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RouteChatMessageConflictsMessageRecord): Promise<void> {
    await call<webbffWidgetLayoutQueryServiceApi.SuggestWidgetLayoutsRequest, webbffWidgetLayoutQueryServiceApi.SuggestWidgetLayoutsResponse>(
      (request, done) => this.client.suggestWidgetLayouts(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      webbffWidgetLayoutQueryServiceApi.SuggestWidgetLayoutsRequest.fromPartial({ filter: { ownerId: record.nextPageToken }, page: { pageToken: record.message } }));
  }
}

/** Writes records to acme.chat.v1.ChatBotValidationService. */
class RouteChatMessageConflictsMessageChatBotValidation implements RouteChatMessageConflictsMessageSink {
  private readonly client: chatChatBotValidationServiceApi.ChatBotValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatBotValidationServiceApi.ChatBotValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RouteChatMessageConflictsMessageRecord): Promise<void> {
    await call<chatChatBotValidationServiceApi.GetChatBotRulesRequest, chatChatBotValidationServiceApi.GetChatBotRulesResponse>(
      (request, done) => this.client.getChatBotRules(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      chatChatBotValidationServiceApi.GetChatBotRulesRequest.fromPartial({ chatBotId: record.message }));
  }
}

/** Only logs, for kinds no service takes yet. */
class RouteChatMessageConflictsMessageLogOnly implements RouteChatMessageConflictsMessageSink {
  async push(record: RouteChatMessageConflictsMessageRecord): Promise<void> {
    console.info("no sink for record", record.message);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchRouteChatMessageConflictsMessage(kind: string, record: RouteChatMessageConflictsMessageRecord, runtime: Runtime): Promise<void> {
  let write = (item: RouteChatMessageConflictsMessageRecord): Promise<void> => new RouteChatMessageConflictsMessageLogOnly().push(item);
  switch (kind) {
    case "survey":
      write = (item) => new RouteChatMessageConflictsMessageSurvey(runtime).push(item);
      break;
    case "widget-layout-query":
      write = (item) => new RouteChatMessageConflictsMessageWidgetLayoutQuery(runtime).push(item);
      break;
    case "chat-bot-validation":
      write = (item) => new RouteChatMessageConflictsMessageChatBotValidation(runtime).push(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.messaging.v1.ChatMessageSyncService/ListChatMessageConflicts and hands what it keeps to the sink
 * of its kind.
 */
export async function routeChatMessageConflictsMessage(runtime: Runtime): Promise<void> {
  const reader = new messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<messagingChatMessageSyncServiceApi.ListChatMessageConflictsRequest, messagingChatMessageSyncServiceApi.ListChatMessageConflictsResponse>(
    (request, done) => reader.listChatMessageConflicts(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    messagingChatMessageSyncServiceApi.ListChatMessageConflictsRequest.fromPartial({ orderBy: "primary-route-chat-message-conflicts-message" })));
  const entry: RouteChatMessageConflictsMessageRecord = {
    message: response.result?.message ?? "",
    nextPageToken: response.pageInfo?.nextPageToken ?? "",
  };
  await dispatchRouteChatMessageConflictsMessage("chat-bot-validation", entry, runtime);
}
