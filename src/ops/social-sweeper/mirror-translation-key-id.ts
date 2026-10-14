import * as chatChatRoomCalculationServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_calculation_service.js";
import * as localizationTranslationKeyApprovalServiceApi from "../../../.cache/proto/acme/localization/v1/translation_key_approval_service.js";
import * as mediaMediaAssetApprovalServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What mirrorTranslationKeyId keeps of each EscalateTranslationKey response. */
interface MirrorTranslationKeyIdRecord {
  correlationId: string;
  status: string;
  resultStatus: string;
  referenceId: string;
}

/** Where mirrorTranslationKeyId hands each record. */
interface MirrorTranslationKeyIdWriter {
  write(record: MirrorTranslationKeyIdRecord): Promise<void>;
}

/** Hands records to acme.media.v1.MediaAssetApprovalService. */
class MirrorTranslationKeyIdMediaAssetApproval implements MirrorTranslationKeyIdWriter {
  private readonly client: mediaMediaAssetApprovalServiceApi.MediaAssetApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaMediaAssetApprovalServiceApi.MediaAssetApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: MirrorTranslationKeyIdRecord): Promise<void> {
    await call<mediaMediaAssetApprovalServiceApi.CommentMediaAssetApprovalRequest, mediaMediaAssetApprovalServiceApi.CommentMediaAssetApprovalResponse>(
      (request, done) => this.client.commentMediaAssetApproval(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      mediaMediaAssetApprovalServiceApi.CommentMediaAssetApprovalRequest.fromPartial({ reason: record.referenceId }));
  }
}

/** Hands records to acme.chat.v1.ChatRoomCalculationService. */
class MirrorTranslationKeyIdChatRoomCalculation implements MirrorTranslationKeyIdWriter {
  private readonly client: chatChatRoomCalculationServiceApi.ChatRoomCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatRoomCalculationServiceApi.ChatRoomCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: MirrorTranslationKeyIdRecord): Promise<void> {
    await call<chatChatRoomCalculationServiceApi.SimulateChatRoomRequest, chatChatRoomCalculationServiceApi.SimulateChatRoomResponse>(
      (request, done) => this.client.simulateChatRoom(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      chatChatRoomCalculationServiceApi.SimulateChatRoomRequest.fromPartial({ chatRoom: { code: record.resultStatus }, chatRoomId: record.status, details: { currencyCode: record.referenceId } }));
  }
}

/** Runs the action registered for kind. */
async function actOnMirrorTranslationKeyId(kind: string, record: MirrorTranslationKeyIdRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "media-asset-approval": () => new MirrorTranslationKeyIdMediaAssetApproval(runtime).write(record),
    "chat-room-calculation": () => new MirrorTranslationKeyIdChatRoomCalculation(runtime).write(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.localization.v1.TranslationKeyApprovalService/EscalateTranslationKey and hands what it keeps to
 * the sink of its kind.
 */
export async function mirrorTranslationKeyId(runtime: Runtime): Promise<void> {
  const upstream = new localizationTranslationKeyApprovalServiceApi.TranslationKeyApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<localizationTranslationKeyApprovalServiceApi.EscalateTranslationKeyRequest, localizationTranslationKeyApprovalServiceApi.EscalateTranslationKeyResponse>(
    (request, done) => upstream.escalateTranslationKey(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    localizationTranslationKeyApprovalServiceApi.EscalateTranslationKeyRequest.fromPartial({ reason: "default-mirror-translation-key-id" }));
  const record: MirrorTranslationKeyIdRecord = {
    correlationId: current.result?.correlationId ?? "",
    status: current.outcome?.status ?? "",
    resultStatus: current.result?.status ?? "",
    referenceId: current.outcome?.referenceId ?? "",
  };
  await actOnMirrorTranslationKeyId("chat-room-calculation", record, runtime);
}
