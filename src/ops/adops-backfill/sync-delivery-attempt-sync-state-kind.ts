import * as broadcastsBroadcastQueryServiceApi from "../../../.cache/proto/acme/broadcasts/v1/broadcast_query_service.js";
import * as chatChatRoomQueryServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_query_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncDeliveryAttemptSyncStateKind keeps of each GetDeliveryAttemptSyncState response. */
interface SyncDeliveryAttemptSyncStateKindRecord {
  kind: string;
  correlationId: string;
}

/** Where syncDeliveryAttemptSyncStateKind hands each record. */
interface SyncDeliveryAttemptSyncStateKindWriter {
  write(record: SyncDeliveryAttemptSyncStateKindRecord): Promise<void>;
}

/** Writes records to acme.broadcasts.v1.BroadcastQueryService. */
class SyncDeliveryAttemptSyncStateKindBroadcastQuery implements SyncDeliveryAttemptSyncStateKindWriter {
  private readonly client: broadcastsBroadcastQueryServiceApi.BroadcastQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new broadcastsBroadcastQueryServiceApi.BroadcastQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: SyncDeliveryAttemptSyncStateKindRecord): Promise<void> {
    await call<broadcastsBroadcastQueryServiceApi.LookupBroadcastRequest, broadcastsBroadcastQueryServiceApi.LookupBroadcastResponse>(
      (request, done) => this.client.lookupBroadcast(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      broadcastsBroadcastQueryServiceApi.LookupBroadcastRequest.fromPartial({ broadcastId: record.correlationId }));
  }
}

/** Writes records to acme.chat.v1.ChatRoomQueryService. */
class SyncDeliveryAttemptSyncStateKindChatRoomQuery implements SyncDeliveryAttemptSyncStateKindWriter {
  private readonly client: chatChatRoomQueryServiceApi.ChatRoomQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatRoomQueryServiceApi.ChatRoomQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: SyncDeliveryAttemptSyncStateKindRecord): Promise<void> {
    await call<chatChatRoomQueryServiceApi.FindChatRoomsRequest, chatChatRoomQueryServiceApi.FindChatRoomsResponse>(
      (request, done) => this.client.findChatRooms(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      chatChatRoomQueryServiceApi.FindChatRoomsRequest.fromPartial({ filter: { query: record.correlationId } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class SyncDeliveryAttemptSyncStateKindLogOnly implements SyncDeliveryAttemptSyncStateKindWriter {
  async write(record: SyncDeliveryAttemptSyncStateKindRecord): Promise<void> {
    console.info("no sink for record", record.kind);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverSyncDeliveryAttemptSyncStateKind(kind: string, record: SyncDeliveryAttemptSyncStateKindRecord, runtime: Runtime): Promise<void> {
  let sink: SyncDeliveryAttemptSyncStateKindWriter = new SyncDeliveryAttemptSyncStateKindLogOnly();
  switch (kind) {
    case "broadcast-query":
      sink = new SyncDeliveryAttemptSyncStateKindBroadcastQuery(runtime);
      break;
    case "chat-room-query":
      sink = new SyncDeliveryAttemptSyncStateKindChatRoomQuery(runtime);
      break;
  }
  await sink.write(record);
}

/**
 * Reads acme.notifications.v1.DeliveryAttemptSyncService/GetDeliveryAttemptSyncState and hands what it keeps
 * to the sink of its kind.
 */
export async function syncDeliveryAttemptSyncStateKind(runtime: Runtime): Promise<void> {
  const origin = new notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<notificationsDeliveryAttemptSyncServiceApi.GetDeliveryAttemptSyncStateRequest, notificationsDeliveryAttemptSyncServiceApi.GetDeliveryAttemptSyncStateResponse>(
    (request, done) => origin.getDeliveryAttemptSyncState(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    notificationsDeliveryAttemptSyncServiceApi.GetDeliveryAttemptSyncStateRequest.fromPartial({ deliveryAttemptId: "nightly-sync-delivery-attempt-sync-state-kind" })));
  const record: SyncDeliveryAttemptSyncStateKindRecord = {
    kind: found.deliveryAttempt?.kind ?? "",
    correlationId: found.result?.correlationId ?? "",
  };
  await deliverSyncDeliveryAttemptSyncStateKind("chat-room-query", record, runtime);
}
