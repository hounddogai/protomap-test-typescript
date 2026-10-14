import * as corporateeventsCorporateEventQueryServiceApi from "../../../.cache/proto/acme/corporateevents/v1/corporate_event_query_service.js";
import * as labelingLabelingTaskServiceApi from "../../../.cache/proto/acme/labeling/v1/labeling_task_service.js";
import * as notificationsDeliveryAttemptExportServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_export_service.js";
import * as notificationsNotificationQueryServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What handOffNotificationsId keeps of each ResolveNotifications response. */
interface HandOffNotificationsIdRecord {
  correlationId: string;
  nextPageToken: string;
  message: string;
  status: string;
}

/** Where handOffNotificationsId hands each record. */
interface HandOffNotificationsIdTarget {
  deliver(record: HandOffNotificationsIdRecord): Promise<void>;
}

/** Hands records to acme.labeling.v1.LabelingTaskService. */
class HandOffNotificationsIdLabelingTask implements HandOffNotificationsIdTarget {
  private readonly client: labelingLabelingTaskServiceApi.LabelingTaskServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new labelingLabelingTaskServiceApi.LabelingTaskServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: HandOffNotificationsIdRecord): Promise<void> {
    await call<labelingLabelingTaskServiceApi.SearchLabelingTasksRequest, labelingLabelingTaskServiceApi.SearchLabelingTasksResponse>(
      (request, done) => this.client.searchLabelingTasks(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      labelingLabelingTaskServiceApi.SearchLabelingTasksRequest.fromPartial({ filter: { region: record.nextPageToken, ownerId: record.status }, orderBy: record.message }));
  }
}

/** Hands records to acme.corporateevents.v1.CorporateEventQueryService. */
class HandOffNotificationsIdCorporateEventQuery implements HandOffNotificationsIdTarget {
  private readonly client: corporateeventsCorporateEventQueryServiceApi.CorporateEventQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new corporateeventsCorporateEventQueryServiceApi.CorporateEventQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: HandOffNotificationsIdRecord): Promise<void> {
    await call<corporateeventsCorporateEventQueryServiceApi.SummarizeCorporateEventsRequest, corporateeventsCorporateEventQueryServiceApi.SummarizeCorporateEventsResponse>(
      (request, done) => this.client.summarizeCorporateEvents(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      corporateeventsCorporateEventQueryServiceApi.SummarizeCorporateEventsRequest.fromPartial({ details: { cron: record.status } }));
  }
}

/** Passes records to acme.notifications.v1.DeliveryAttemptExportService. */
class HandOffNotificationsIdDeliveryAttemptExport implements HandOffNotificationsIdTarget {
  private readonly client: notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: HandOffNotificationsIdRecord): Promise<void> {
    await retry(() => call<notificationsDeliveryAttemptExportServiceApi.ListDeliveryAttemptExportsRequest, notificationsDeliveryAttemptExportServiceApi.ListDeliveryAttemptExportsResponse>(
      (request, done) => this.client.listDeliveryAttemptExports(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      notificationsDeliveryAttemptExportServiceApi.ListDeliveryAttemptExportsRequest.fromPartial({ orderBy: record.nextPageToken })));
  }
}

/** Runs the action registered for kind. */
async function actOnHandOffNotificationsId(kind: string, record: HandOffNotificationsIdRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "labeling-task": () => new HandOffNotificationsIdLabelingTask(runtime).deliver(record),
    "corporate-event-query": () => new HandOffNotificationsIdCorporateEventQuery(runtime).deliver(record),
    "delivery-attempt-export": () => new HandOffNotificationsIdDeliveryAttemptExport(runtime).deliver(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.notifications.v1.NotificationQueryService/ResolveNotifications and hands what it keeps to the
 * sink of its kind.
 */
export async function handOffNotificationsId(runtime: Runtime): Promise<void> {
  const reader = new notificationsNotificationQueryServiceApi.NotificationQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<notificationsNotificationQueryServiceApi.ResolveNotificationsRequest, notificationsNotificationQueryServiceApi.ResolveNotificationsResponse>(
    (request, done) => reader.resolveNotifications(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    notificationsNotificationQueryServiceApi.ResolveNotificationsRequest.fromPartial({}));
  const row: HandOffNotificationsIdRecord = {
    correlationId: current.result?.correlationId ?? "",
    nextPageToken: current.pageInfo?.nextPageToken ?? "",
    message: text.normalize(current.result?.message ?? ""),
    status: text.normalize(current.result?.status ?? ""),
  };
  await actOnHandOffNotificationsId("corporate-event-query", row, runtime);
}
