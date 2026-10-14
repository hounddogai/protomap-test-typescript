import * as featureflagsFeatureFlagQueryServiceApi from "../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as identityUserQueryServiceApi from "../../../.cache/proto/acme/identity/v1/user_query_service.js";
import * as notificationsNotificationNotificationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_notification_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relayUsersStatus keeps of each BrowseUsers response. */
interface RelayUsersStatusRecord {
  status: string;
  correlationId: string;
}

/** Where relayUsersStatus hands each record. */
interface RelayUsersStatusTarget {
  push(record: RelayUsersStatusRecord): Promise<void>;
}

/** Sends records to acme.featureflags.v1.FeatureFlagQueryService. */
class RelayUsersStatusFeatureFlagQuery implements RelayUsersStatusTarget {
  private readonly client: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RelayUsersStatusRecord): Promise<void> {
    await call<featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsResponse>(
      (request, done) => this.client.countFeatureFlags(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsRequest.fromPartial({ filter: { query: record.correlationId } }));
  }
}

/** Sends records to acme.notifications.v1.NotificationNotificationService. */
class RelayUsersStatusNotificationNotification implements RelayUsersStatusTarget {
  private readonly client: notificationsNotificationNotificationServiceApi.NotificationNotificationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationNotificationServiceApi.NotificationNotificationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RelayUsersStatusRecord): Promise<void> {
    await retry(() => call<notificationsNotificationNotificationServiceApi.GetNotificationPreferencesRequest, notificationsNotificationNotificationServiceApi.GetNotificationPreferencesResponse>(
      (request, done) => this.client.getNotificationPreferences(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      notificationsNotificationNotificationServiceApi.GetNotificationPreferencesRequest.fromPartial({ notificationId: record.correlationId })));
  }
}

/** Reads acme.identity.v1.UserQueryService/BrowseUsers and hands what it keeps to the sink of its kind. */
export async function relayUsersStatus(runtime: Runtime): Promise<void> {
  const source = new identityUserQueryServiceApi.UserQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<identityUserQueryServiceApi.BrowseUsersRequest, identityUserQueryServiceApi.BrowseUsersResponse>(
    (request, done) => source.browseUsers(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    identityUserQueryServiceApi.BrowseUsersRequest.fromPartial({ orderBy: "primary-relay-users-status" })));
  const record: RelayUsersStatusRecord = {
    status: text.normalize(current.result?.status ?? ""),
    correlationId: current.result?.correlationId ?? "",
  };
  const registry: Record<string, RelayUsersStatusTarget> = {};
  for (const entry of [
    { kind: "feature-flag-query", sink: new RelayUsersStatusFeatureFlagQuery(runtime) },
    { kind: "notification-notification", sink: new RelayUsersStatusNotificationNotification(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["feature-flag-query"]!.push(record);
}
