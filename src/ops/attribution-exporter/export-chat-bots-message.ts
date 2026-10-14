import * as chatChatBotValidationServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_validation_service.js";
import * as messagingChannelSyncServiceApi from "../../../.cache/proto/acme/messaging/v1/channel_sync_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportChatBotsMessage keeps of each LintChatBots response. */
interface ExportChatBotsMessageRecord {
  message: string;
  chatBotId: string;
  name: string;
}

/**
 * Reads acme.chat.v1.ChatBotValidationService/LintChatBots, keeps its fields by name, and passes some of them
 * to acme.messaging.v1.ChannelSyncService.
 */
export async function exportChatBotsMessage(runtime: Runtime): Promise<void> {
  const origin = new chatChatBotValidationServiceApi.ChatBotValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<chatChatBotValidationServiceApi.LintChatBotsRequest, chatChatBotValidationServiceApi.LintChatBotsResponse>(
    (request, done) => origin.lintChatBots(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    chatChatBotValidationServiceApi.LintChatBotsRequest.fromPartial({ reason: "current-export-chat-bots-message" })));
  const entry: ExportChatBotsMessageRecord = {
    message: current.outcome?.message ?? "",
    chatBotId: text.normalize(current.chatBot?.chatBotId ?? ""),
    name: current.chatBot?.name ?? "",
  };
  const slots = new URLSearchParams();
  slots.set("message", entry.message);
  slots.set("chat-bot-id", entry.chatBotId);
  slots.set("name", entry.name);
  const target = new messagingChannelSyncServiceApi.ChannelSyncServiceClient(runtime.mesh, credentials.createInsecure());
  await retry(() => call<messagingChannelSyncServiceApi.GetChannelSyncStateRequest, messagingChannelSyncServiceApi.GetChannelSyncStateResponse>(
    (request, done) => target.getChannelSyncState(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    messagingChannelSyncServiceApi.GetChannelSyncStateRequest.fromPartial({ channelId: slots.get("chat-bot-id") ?? "" })));
}
