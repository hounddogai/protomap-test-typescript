import * as chatChatRoomQueryServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_query_service.js";
import * as customersHouseholdQueryServiceApi from "../../../.cache/proto/acme/customers/v1/household_query_service.js";
import * as mediaMediaAssetLifecycleServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_lifecycle_service.js";
import * as messagingChatMessageSyncServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_sync_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What routeMediaAssetMessage keeps of each ActivateMediaAsset response. */
interface RouteMediaAssetMessageRecord {
  message: string;
  correlationId: string;
}

/** Where routeMediaAssetMessage hands each record. */
interface RouteMediaAssetMessageWriter {
  forward(record: RouteMediaAssetMessageRecord): Promise<void>;
}

/** Hands records to acme.chat.v1.ChatRoomQueryService. */
class RouteMediaAssetMessageChatRoomQuery implements RouteMediaAssetMessageWriter {
  private readonly client: chatChatRoomQueryServiceApi.ChatRoomQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatRoomQueryServiceApi.ChatRoomQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: RouteMediaAssetMessageRecord): Promise<void> {
    await retry(() => call<chatChatRoomQueryServiceApi.LookupChatRoomRequest, chatChatRoomQueryServiceApi.LookupChatRoomResponse>(
      (request, done) => this.client.lookupChatRoom(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      chatChatRoomQueryServiceApi.LookupChatRoomRequest.fromPartial({ chatRoomId: record.message })));
  }
}

/** Sends records to acme.messaging.v1.ChatMessageSyncService. */
class RouteMediaAssetMessageChatMessageSync implements RouteMediaAssetMessageWriter {
  private readonly client: messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: RouteMediaAssetMessageRecord): Promise<void> {
    await retry(() => call<messagingChatMessageSyncServiceApi.ReconcileChatMessagesRequest, messagingChatMessageSyncServiceApi.ReconcileChatMessagesResponse>(
      (request, done) => this.client.reconcileChatMessages(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      messagingChatMessageSyncServiceApi.ReconcileChatMessagesRequest.fromPartial({ chatMessage: { kind: record.correlationId } })));
  }
}

/** Passes records to acme.customers.v1.HouseholdQueryService. */
class RouteMediaAssetMessageHouseholdQuery implements RouteMediaAssetMessageWriter {
  private readonly client: customersHouseholdQueryServiceApi.HouseholdQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new customersHouseholdQueryServiceApi.HouseholdQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: RouteMediaAssetMessageRecord): Promise<void> {
    await call<customersHouseholdQueryServiceApi.PeekHouseholdRequest, customersHouseholdQueryServiceApi.PeekHouseholdResponse>(
      (request, done) => this.client.peekHousehold(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      customersHouseholdQueryServiceApi.PeekHouseholdRequest.fromPartial({ householdId: record.correlationId }));
  }
}

/**
 * Reads acme.media.v1.MediaAssetLifecycleService/ActivateMediaAsset and hands what it keeps to the sink of
 * its kind.
 */
export async function routeMediaAssetMessage(runtime: Runtime): Promise<void> {
  const source = new mediaMediaAssetLifecycleServiceApi.MediaAssetLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<mediaMediaAssetLifecycleServiceApi.ActivateMediaAssetRequest, mediaMediaAssetLifecycleServiceApi.ActivateMediaAssetResponse>(
    (request, done) => source.activateMediaAsset(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    mediaMediaAssetLifecycleServiceApi.ActivateMediaAssetRequest.fromPartial({ reason: "default-route-media-asset-message" })));
  const kept: RouteMediaAssetMessageRecord = {
    message: reply.result?.message ?? "",
    correlationId: reply.result?.correlationId ?? "",
  };
  const registry: Record<string, RouteMediaAssetMessageWriter> = {};
  for (const entry of [
    { kind: "chat-room-query", sink: new RouteMediaAssetMessageChatRoomQuery(runtime) },
    { kind: "chat-message-sync", sink: new RouteMediaAssetMessageChatMessageSync(runtime) },
    { kind: "household-query", sink: new RouteMediaAssetMessageHouseholdQuery(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["chat-room-query"]!.forward(kept);
}
