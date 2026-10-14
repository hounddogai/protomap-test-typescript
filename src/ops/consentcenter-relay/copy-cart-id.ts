import * as cartCartCalculationServiceApi from "../../../.cache/proto/acme/cart/v1/cart_calculation_service.js";
import * as chatChatRoomServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import * as webhooksWebhookSecretApprovalServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_secret_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyCartId keeps of each SimulateCart response. */
interface CopyCartIdRecord {
  correlationId: string;
  notes: string;
}

/** Where copyCartId hands each record. */
interface CopyCartIdSink {
  deliver(record: CopyCartIdRecord): Promise<void>;
}

/** Hands records to acme.chat.v1.ChatRoomService. */
class CopyCartIdChatRoom implements CopyCartIdSink {
  private readonly client: chatChatRoomServiceApi.ChatRoomServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatRoomServiceApi.ChatRoomServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CopyCartIdRecord): Promise<void> {
    await call<chatChatRoomServiceApi.CloneChatRoomRequest, chatChatRoomServiceApi.CloneChatRoomResponse>(
      (request, done) => this.client.cloneChatRoom(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      chatChatRoomServiceApi.CloneChatRoomRequest.fromPartial({ chatRoom: { name: record.correlationId, code: record.notes } }));
  }
}

/** Passes records to acme.webhooks.v1.WebhookSecretApprovalService. */
class CopyCartIdWebhookSecretApproval implements CopyCartIdSink {
  private readonly client: webhooksWebhookSecretApprovalServiceApi.WebhookSecretApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookSecretApprovalServiceApi.WebhookSecretApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CopyCartIdRecord): Promise<void> {
    await call<webhooksWebhookSecretApprovalServiceApi.RejectWebhookSecretRequest, webhooksWebhookSecretApprovalServiceApi.RejectWebhookSecretResponse>(
      (request, done) => this.client.rejectWebhookSecret(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      webhooksWebhookSecretApprovalServiceApi.RejectWebhookSecretRequest.fromPartial({ reason: record.correlationId, webhookSecret: { currencyCode: record.notes } }));
  }
}

/** Sends records to acme.notifications.v1.SubscriptionSyncService. */
class CopyCartIdSubscriptionSync implements CopyCartIdSink {
  private readonly client: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CopyCartIdRecord): Promise<void> {
    await retry(() => call<notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsRequest, notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsResponse>(
      (request, done) => this.client.listSubscriptionConflicts(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsRequest.fromPartial({ filter: { ownerId: record.notes } })));
  }
}

/** Only logs, for kinds no service takes yet. */
class CopyCartIdLogOnly implements CopyCartIdSink {
  async deliver(record: CopyCartIdRecord): Promise<void> {
    console.info("no sink for record", record.correlationId);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchCopyCartId(kind: string, record: CopyCartIdRecord, runtime: Runtime): Promise<void> {
  let write = (item: CopyCartIdRecord): Promise<void> => new CopyCartIdLogOnly().deliver(item);
  switch (kind) {
    case "chat-room":
      write = (item) => new CopyCartIdChatRoom(runtime).deliver(item);
      break;
    case "webhook-secret-approval":
      write = (item) => new CopyCartIdWebhookSecretApproval(runtime).deliver(item);
      break;
    case "subscription-sync":
      write = (item) => new CopyCartIdSubscriptionSync(runtime).deliver(item);
      break;
  }
  await write(record);
}

/** Reads acme.cart.v1.CartCalculationService/SimulateCart and hands what it keeps to the sink of its kind. */
export async function copyCartId(runtime: Runtime): Promise<void> {
  const reader = new cartCartCalculationServiceApi.CartCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<cartCartCalculationServiceApi.SimulateCartRequest, cartCartCalculationServiceApi.SimulateCartResponse>(
    (request, done) => reader.simulateCart(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    cartCartCalculationServiceApi.SimulateCartRequest.fromPartial({ reason: "main-copy-cart-id" })));
  const entry: CopyCartIdRecord = {
    correlationId: text.normalize(found.result?.correlationId ?? ""),
    notes: found.cart?.notes ?? "",
  };
  await dispatchCopyCartId("subscription-sync", entry, runtime);
}
