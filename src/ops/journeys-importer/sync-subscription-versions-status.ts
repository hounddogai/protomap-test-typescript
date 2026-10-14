import * as communityPostValidationServiceApi from "../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as notificationsNotificationHistoryServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import * as notificationsSubscriptionHistoryServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_history_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncSubscriptionVersionsStatus keeps of each CompareSubscriptionVersions response. */
interface SyncSubscriptionVersionsStatusRecord {
  status: string;
  description: string;
  outcomeStatus: string;
  referenceId: string;
}

/** Where syncSubscriptionVersionsStatus hands each record. */
interface SyncSubscriptionVersionsStatusDestination {
  send(record: SyncSubscriptionVersionsStatusRecord): Promise<void>;
}

/** Writes records to acme.community.v1.PostValidationService. */
class SyncSubscriptionVersionsStatusPostValidation implements SyncSubscriptionVersionsStatusDestination {
  private readonly client: communityPostValidationServiceApi.PostValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityPostValidationServiceApi.PostValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: SyncSubscriptionVersionsStatusRecord): Promise<void> {
    await retry(() => call<communityPostValidationServiceApi.ExplainPostDecisionRequest, communityPostValidationServiceApi.ExplainPostDecisionResponse>(
      (request, done) => this.client.explainPostDecision(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      communityPostValidationServiceApi.ExplainPostDecisionRequest.fromPartial({ post: { postId: record.description } })));
  }
}

/** Passes records to acme.notifications.v1.NotificationHistoryService. */
class SyncSubscriptionVersionsStatusNotificationHistory implements SyncSubscriptionVersionsStatusDestination {
  private readonly client: notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: SyncSubscriptionVersionsStatusRecord): Promise<void> {
    await call<notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest, notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionResponse>(
      (request, done) => this.client.annotateNotificationVersion(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest.fromPartial({ reason: record.description, details: { authorEmail: record.referenceId }, notification: { notificationId: record.outcomeStatus } }));
  }
}

/**
 * Reads acme.notifications.v1.SubscriptionHistoryService/CompareSubscriptionVersions and hands what it keeps
 * to the sink of its kind.
 */
export async function syncSubscriptionVersionsStatus(runtime: Runtime): Promise<void> {
  const upstream = new notificationsSubscriptionHistoryServiceApi.SubscriptionHistoryServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<notificationsSubscriptionHistoryServiceApi.CompareSubscriptionVersionsRequest, notificationsSubscriptionHistoryServiceApi.CompareSubscriptionVersionsResponse>(
    (request, done) => upstream.compareSubscriptionVersions(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    notificationsSubscriptionHistoryServiceApi.CompareSubscriptionVersionsRequest.fromPartial({ subscriptionId: "default-sync-subscription-versions-status" }));
  const kept: SyncSubscriptionVersionsStatusRecord = {
    status: text.normalize(found.result?.status ?? ""),
    description: found.subscription?.description ?? "",
    outcomeStatus: found.outcome?.status ?? "",
    referenceId: found.outcome?.referenceId ?? "",
  };
  const registry: Record<string, SyncSubscriptionVersionsStatusDestination> = {};
  for (const entry of [
    { kind: "post-validation", sink: new SyncSubscriptionVersionsStatusPostValidation(runtime) },
    { kind: "notification-history", sink: new SyncSubscriptionVersionsStatusNotificationHistory(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["post-validation"]!.send(kept);
}
