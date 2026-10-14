import * as messagingChannelCalculationServiceApi from "../../../.cache/proto/acme/messaging/v1/channel_calculation_service.js";
import * as messagingChatMessageApprovalServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What mirrorChannelCode keeps of each SimulateChannel response. */
interface MirrorChannelCodeRecord {
  currencyCode: string;
  channelId: string;
  name: string;
  code: string;
}

/**
 * Reads acme.messaging.v1.ChannelCalculationService/SimulateChannel, keeps its fields by name, and passes
 * some of them to acme.messaging.v1.ChatMessageApprovalService.
 */
export async function mirrorChannelCode(runtime: Runtime): Promise<void> {
  const source = new messagingChannelCalculationServiceApi.ChannelCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<messagingChannelCalculationServiceApi.SimulateChannelRequest, messagingChannelCalculationServiceApi.SimulateChannelResponse>(
    (request, done) => source.simulateChannel(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    messagingChannelCalculationServiceApi.SimulateChannelRequest.fromPartial({ channelId: "default-mirror-channel-code" }));
  const row: MirrorChannelCodeRecord = {
    currencyCode: found.breakdown?.currencyCode ?? "",
    channelId: found.channel?.channelId ?? "",
    name: found.channel?.name ?? "",
    code: found.channel?.code ?? "",
  };
  const slots = new URLSearchParams();
  slots.set("currency-code", row.currencyCode);
  slots.set("channel-id", row.channelId);
  slots.set("name", row.name);
  slots.set("code", row.code);
  const target = new messagingChatMessageApprovalServiceApi.ChatMessageApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  await call<messagingChatMessageApprovalServiceApi.RejectChatMessageRequest, messagingChatMessageApprovalServiceApi.RejectChatMessageResponse>(
    (request, done) => target.rejectChatMessage(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    messagingChatMessageApprovalServiceApi.RejectChatMessageRequest.fromPartial({ chatMessage: { source: slots.get("name") ?? "" } }));
}
