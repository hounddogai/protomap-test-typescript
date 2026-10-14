import * as chatChatBotApprovalServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_approval_service.js";
import * as communityPostApprovalServiceApi from "../../../.cache/proto/acme/community/v1/post_approval_service.js";
import * as mediaTranscodeJobCalculationServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_calculation_service.js";
import * as messagingChatMessageApprovalServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_approval_service.js";
import * as searchSearchIndexQueryServiceApi from "../../../.cache/proto/acme/search/v1/search_index_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What handOffChatMessageId keeps of each RejectChatMessage response. */
interface HandOffChatMessageIdRecord {
  correlationId: string;
  chatMessageId: string;
  source: string;
}

/** Where handOffChatMessageId hands each record. */
interface HandOffChatMessageIdWriter {
  send(record: HandOffChatMessageIdRecord): Promise<void>;
}

/** Hands records to acme.community.v1.PostApprovalService. */
class HandOffChatMessageIdPostApproval implements HandOffChatMessageIdWriter {
  private readonly client: communityPostApprovalServiceApi.PostApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityPostApprovalServiceApi.PostApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: HandOffChatMessageIdRecord): Promise<void> {
    await call<communityPostApprovalServiceApi.GetPostApprovalStatusRequest, communityPostApprovalServiceApi.GetPostApprovalStatusResponse>(
      (request, done) => this.client.getPostApprovalStatus(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      communityPostApprovalServiceApi.GetPostApprovalStatusRequest.fromPartial({ postId: record.chatMessageId }));
  }
}

/** Writes records to acme.search.v1.SearchIndexQueryService. */
class HandOffChatMessageIdSearchIndexQuery implements HandOffChatMessageIdWriter {
  private readonly client: searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: HandOffChatMessageIdRecord): Promise<void> {
    await call<searchSearchIndexQueryServiceApi.FindSearchIndexesRequest, searchSearchIndexQueryServiceApi.FindSearchIndexesResponse>(
      (request, done) => this.client.findSearchIndexes(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      searchSearchIndexQueryServiceApi.FindSearchIndexesRequest.fromPartial({ filter: { region: record.source }, orderBy: record.correlationId }));
  }
}

/** Sends records to acme.chat.v1.ChatBotApprovalService. */
class HandOffChatMessageIdChatBotApproval implements HandOffChatMessageIdWriter {
  private readonly client: chatChatBotApprovalServiceApi.ChatBotApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatBotApprovalServiceApi.ChatBotApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: HandOffChatMessageIdRecord): Promise<void> {
    await call<chatChatBotApprovalServiceApi.ListPendingChatBotsRequest, chatChatBotApprovalServiceApi.ListPendingChatBotsResponse>(
      (request, done) => this.client.listPendingChatBots(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      chatChatBotApprovalServiceApi.ListPendingChatBotsRequest.fromPartial({ orderBy: record.chatMessageId }));
  }
}

/** Writes records to acme.media.v1.TranscodeJobCalculationService. */
class HandOffChatMessageIdTranscodeJobCalculation implements HandOffChatMessageIdWriter {
  private readonly client: mediaTranscodeJobCalculationServiceApi.TranscodeJobCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaTranscodeJobCalculationServiceApi.TranscodeJobCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: HandOffChatMessageIdRecord): Promise<void> {
    await call<mediaTranscodeJobCalculationServiceApi.CalculateTranscodeJobRequest, mediaTranscodeJobCalculationServiceApi.CalculateTranscodeJobResponse>(
      (request, done) => this.client.calculateTranscodeJob(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      mediaTranscodeJobCalculationServiceApi.CalculateTranscodeJobRequest.fromPartial({ details: { currencyCode: record.correlationId } }));
  }
}

/**
 * Reads acme.messaging.v1.ChatMessageApprovalService/RejectChatMessage and hands what it keeps to the sink of
 * its kind.
 */
export async function handOffChatMessageId(runtime: Runtime): Promise<void> {
  const source = new messagingChatMessageApprovalServiceApi.ChatMessageApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<messagingChatMessageApprovalServiceApi.RejectChatMessageRequest, messagingChatMessageApprovalServiceApi.RejectChatMessageResponse>(
    (request, done) => source.rejectChatMessage(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    messagingChatMessageApprovalServiceApi.RejectChatMessageRequest.fromPartial({ reason: "primary-hand-off-chat-message-id" }));
  const record: HandOffChatMessageIdRecord = {
    correlationId: current.result?.correlationId ?? "",
    chatMessageId: current.chatMessage?.chatMessageId ?? "",
    source: current.chatMessage?.source ?? "",
  };
  const entries: Array<{ kind: string; sink: HandOffChatMessageIdWriter }> = [
    { kind: "post-approval", sink: new HandOffChatMessageIdPostApproval(runtime) },
    { kind: "search-index-query", sink: new HandOffChatMessageIdSearchIndexQuery(runtime) },
    { kind: "chat-bot-approval", sink: new HandOffChatMessageIdChatBotApproval(runtime) },
    { kind: "transcode-job-calculation", sink: new HandOffChatMessageIdTranscodeJobCalculation(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "transcode-job-calculation") continue;
    await entry.sink.send(record);
  }
}
