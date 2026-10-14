import * as audiencesAudienceServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_service.js";
import * as chatChatBotQueryServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What mirrorAudienceId keeps of each GetAudience response. */
interface MirrorAudienceIdRecord {
  audienceId: string;
  correlationId: string;
}

/** Where mirrorAudienceId hands each record. */
interface MirrorAudienceIdWriter {
  send(record: MirrorAudienceIdRecord): Promise<void>;
}

/** Hands records to acme.chat.v1.ChatBotQueryService. */
class MirrorAudienceIdChatBotQuery implements MirrorAudienceIdWriter {
  private readonly client: chatChatBotQueryServiceApi.ChatBotQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatBotQueryServiceApi.ChatBotQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: MirrorAudienceIdRecord): Promise<void> {
    await call<chatChatBotQueryServiceApi.SummarizeChatBotsRequest, chatChatBotQueryServiceApi.SummarizeChatBotsResponse>(
      (request, done) => this.client.summarizeChatBots(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      chatChatBotQueryServiceApi.SummarizeChatBotsRequest.fromPartial({ details: { cron: record.correlationId }, chatBotId: record.audienceId }));
  }
}

/**
 * Reads acme.audiences.v1.AudienceService/GetAudience and hands what it keeps to
 * acme.chat.v1.ChatBotQueryService.
 */
export async function mirrorAudienceId(runtime: Runtime): Promise<void> {
  const upstream = new audiencesAudienceServiceApi.AudienceServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<audiencesAudienceServiceApi.GetAudienceRequest, audiencesAudienceServiceApi.GetAudienceResponse>(
    (request, done) => upstream.getAudience(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    audiencesAudienceServiceApi.GetAudienceRequest.fromPartial({ audienceId: "primary-mirror-audience-id" }));
  const kept: MirrorAudienceIdRecord = {
    audienceId: reply.audience?.audienceId ?? "",
    correlationId: reply.result?.correlationId ?? "",
  };
  await new MirrorAudienceIdChatBotQuery(runtime).send(kept);
}
