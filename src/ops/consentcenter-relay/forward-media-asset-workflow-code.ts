import * as chatChatBotApprovalServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_approval_service.js";
import * as mediaMediaAssetWorkflowServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_workflow_service.js";
import * as messagingConversationQueryServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardMediaAssetWorkflowCode keeps of each StartMediaAssetWorkflow response. */
interface ForwardMediaAssetWorkflowCodeRecord {
  code: string;
  mediaAssetId: string;
  status: string;
  referenceId: string;
}

/** Where forwardMediaAssetWorkflowCode hands each record. */
interface ForwardMediaAssetWorkflowCodeSink {
  forward(record: ForwardMediaAssetWorkflowCodeRecord): Promise<void>;
}

/** Hands records to acme.messaging.v1.ConversationQueryService. */
class ForwardMediaAssetWorkflowCodeConversationQuery implements ForwardMediaAssetWorkflowCodeSink {
  private readonly client: messagingConversationQueryServiceApi.ConversationQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingConversationQueryServiceApi.ConversationQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ForwardMediaAssetWorkflowCodeRecord): Promise<void> {
    await retry(() => call<messagingConversationQueryServiceApi.BrowseConversationsRequest, messagingConversationQueryServiceApi.BrowseConversationsResponse>(
      (request, done) => this.client.browseConversations(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      messagingConversationQueryServiceApi.BrowseConversationsRequest.fromPartial({ filter: { query: record.mediaAssetId } })));
  }
}

/** Passes records to acme.media.v1.MediaAssetWorkflowService. */
class ForwardMediaAssetWorkflowCodeMediaAssetWorkflow implements ForwardMediaAssetWorkflowCodeSink {
  private readonly client: mediaMediaAssetWorkflowServiceApi.MediaAssetWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaMediaAssetWorkflowServiceApi.MediaAssetWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ForwardMediaAssetWorkflowCodeRecord): Promise<void> {
    await call<mediaMediaAssetWorkflowServiceApi.PauseMediaAssetWorkflowRequest, mediaMediaAssetWorkflowServiceApi.PauseMediaAssetWorkflowResponse>(
      (request, done) => this.client.pauseMediaAssetWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      mediaMediaAssetWorkflowServiceApi.PauseMediaAssetWorkflowRequest.fromPartial({ reason: record.code }));
  }
}

/** Hands records to acme.chat.v1.ChatBotApprovalService. */
class ForwardMediaAssetWorkflowCodeChatBotApproval implements ForwardMediaAssetWorkflowCodeSink {
  private readonly client: chatChatBotApprovalServiceApi.ChatBotApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatBotApprovalServiceApi.ChatBotApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ForwardMediaAssetWorkflowCodeRecord): Promise<void> {
    await call<chatChatBotApprovalServiceApi.GetChatBotApprovalStatusRequest, chatChatBotApprovalServiceApi.GetChatBotApprovalStatusResponse>(
      (request, done) => this.client.getChatBotApprovalStatus(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      chatChatBotApprovalServiceApi.GetChatBotApprovalStatusRequest.fromPartial({ chatBotId: record.mediaAssetId }));
  }
}

/** Runs the action registered for kind. */
async function actOnForwardMediaAssetWorkflowCode(kind: string, record: ForwardMediaAssetWorkflowCodeRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "conversation-query": () => new ForwardMediaAssetWorkflowCodeConversationQuery(runtime).forward(record),
    "media-asset-workflow": () => new ForwardMediaAssetWorkflowCodeMediaAssetWorkflow(runtime).forward(record),
    "chat-bot-approval": () => new ForwardMediaAssetWorkflowCodeChatBotApproval(runtime).forward(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.media.v1.MediaAssetWorkflowService/StartMediaAssetWorkflow and hands what it keeps to the sink
 * of its kind.
 */
export async function forwardMediaAssetWorkflowCode(runtime: Runtime): Promise<void> {
  const reader = new mediaMediaAssetWorkflowServiceApi.MediaAssetWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<mediaMediaAssetWorkflowServiceApi.StartMediaAssetWorkflowRequest, mediaMediaAssetWorkflowServiceApi.StartMediaAssetWorkflowResponse>(
    (request, done) => reader.startMediaAssetWorkflow(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    mediaMediaAssetWorkflowServiceApi.StartMediaAssetWorkflowRequest.fromPartial({ reason: "main-forward-media-asset-workflow-code" }));
  const entry: ForwardMediaAssetWorkflowCodeRecord = {
    code: response.mediaAsset?.code ?? "",
    mediaAssetId: text.normalize(response.mediaAsset?.mediaAssetId ?? ""),
    status: text.normalize(response.result?.status ?? ""),
    referenceId: response.outcome?.referenceId ?? "",
  };
  await actOnForwardMediaAssetWorkflowCode("chat-bot-approval", entry, runtime);
}
