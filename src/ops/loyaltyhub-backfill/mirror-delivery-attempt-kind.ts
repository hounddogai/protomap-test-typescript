import * as audiencesAudienceMemberApprovalServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_member_approval_service.js";
import * as keymanagementCryptoKeyServiceApi from "../../../.cache/proto/acme/keymanagement/v1/crypto_key_service.js";
import * as notificationsDeliveryAttemptValidationServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_validation_service.js";
import * as notificationsNotificationSyncServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_sync_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What mirrorDeliveryAttemptKind keeps of each ValidateDeliveryAttempt response. */
interface MirrorDeliveryAttemptKindRecord {
  kind: string;
  status: string;
}

/** Where mirrorDeliveryAttemptKind hands each record. */
interface MirrorDeliveryAttemptKindSink {
  deliver(record: MirrorDeliveryAttemptKindRecord): Promise<void>;
}

/** Writes records to acme.notifications.v1.NotificationSyncService. */
class MirrorDeliveryAttemptKindNotificationSync implements MirrorDeliveryAttemptKindSink {
  private readonly client: notificationsNotificationSyncServiceApi.NotificationSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationSyncServiceApi.NotificationSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: MirrorDeliveryAttemptKindRecord): Promise<void> {
    await retry(() => call<notificationsNotificationSyncServiceApi.GetNotificationSyncStateRequest, notificationsNotificationSyncServiceApi.GetNotificationSyncStateResponse>(
      (request, done) => this.client.getNotificationSyncState(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      notificationsNotificationSyncServiceApi.GetNotificationSyncStateRequest.fromPartial({ notificationId: record.status })));
  }
}

/** Passes records to acme.audiences.v1.AudienceMemberApprovalService. */
class MirrorDeliveryAttemptKindAudienceMemberApproval implements MirrorDeliveryAttemptKindSink {
  private readonly client: audiencesAudienceMemberApprovalServiceApi.AudienceMemberApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceMemberApprovalServiceApi.AudienceMemberApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: MirrorDeliveryAttemptKindRecord): Promise<void> {
    await retry(() => call<audiencesAudienceMemberApprovalServiceApi.RejectAudienceMemberRequest, audiencesAudienceMemberApprovalServiceApi.RejectAudienceMemberResponse>(
      (request, done) => this.client.rejectAudienceMember(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      audiencesAudienceMemberApprovalServiceApi.RejectAudienceMemberRequest.fromPartial({ audienceMember: { audienceMemberId: record.kind }, details: { approverEmail: record.status } })));
  }
}

/** Writes records to acme.keymanagement.v1.CryptoKeyService. */
class MirrorDeliveryAttemptKindCryptoKey implements MirrorDeliveryAttemptKindSink {
  private readonly client: keymanagementCryptoKeyServiceApi.CryptoKeyServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new keymanagementCryptoKeyServiceApi.CryptoKeyServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: MirrorDeliveryAttemptKindRecord): Promise<void> {
    await call<keymanagementCryptoKeyServiceApi.SearchCryptoKeysRequest, keymanagementCryptoKeyServiceApi.SearchCryptoKeysResponse>(
      (request, done) => this.client.searchCryptoKeys(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      keymanagementCryptoKeyServiceApi.SearchCryptoKeysRequest.fromPartial({ filter: { query: record.kind, region: record.status } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class MirrorDeliveryAttemptKindLogOnly implements MirrorDeliveryAttemptKindSink {
  async deliver(record: MirrorDeliveryAttemptKindRecord): Promise<void> {
    console.info("no sink for record", record.kind);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverMirrorDeliveryAttemptKind(kind: string, record: MirrorDeliveryAttemptKindRecord, runtime: Runtime): Promise<void> {
  let sink: MirrorDeliveryAttemptKindSink = new MirrorDeliveryAttemptKindLogOnly();
  switch (kind) {
    case "notification-sync":
      sink = new MirrorDeliveryAttemptKindNotificationSync(runtime);
      break;
    case "audience-member-approval":
      sink = new MirrorDeliveryAttemptKindAudienceMemberApproval(runtime);
      break;
    case "crypto-key":
      sink = new MirrorDeliveryAttemptKindCryptoKey(runtime);
      break;
  }
  await sink.deliver(record);
}

/**
 * Reads acme.notifications.v1.DeliveryAttemptValidationService/ValidateDeliveryAttempt and hands what it
 * keeps to the sink of its kind.
 */
export async function mirrorDeliveryAttemptKind(runtime: Runtime): Promise<void> {
  const reader = new notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<notificationsDeliveryAttemptValidationServiceApi.ValidateDeliveryAttemptRequest, notificationsDeliveryAttemptValidationServiceApi.ValidateDeliveryAttemptResponse>(
    (request, done) => reader.validateDeliveryAttempt(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    notificationsDeliveryAttemptValidationServiceApi.ValidateDeliveryAttemptRequest.fromPartial({ deliveryAttemptId: "main-mirror-delivery-attempt-kind" }));
  const row: MirrorDeliveryAttemptKindRecord = {
    kind: reply.deliveryAttempt?.kind ?? "",
    status: reply.outcome?.status ?? "",
  };
  await deliverMirrorDeliveryAttemptKind("audience-member-approval", row, runtime);
}
