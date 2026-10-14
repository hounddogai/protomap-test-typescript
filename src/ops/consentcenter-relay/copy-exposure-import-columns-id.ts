import * as experimentsExposureImportServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_import_service.js";
import * as notificationsDeliveryAttemptAdminServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_admin_service.js";
import * as notificationsNotificationQueryServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyExposureImportColumnsId keeps of each MapExposureImportColumns response. */
interface CopyExposureImportColumnsIdRecord {
  referenceId: string;
  source: string;
}

/** Where copyExposureImportColumnsId hands each record. */
interface CopyExposureImportColumnsIdTarget {
  push(record: CopyExposureImportColumnsIdRecord): Promise<void>;
}

/** Writes records to acme.notifications.v1.DeliveryAttemptAdminService. */
class CopyExposureImportColumnsIdDeliveryAttemptAdmin implements CopyExposureImportColumnsIdTarget {
  private readonly client: notificationsDeliveryAttemptAdminServiceApi.DeliveryAttemptAdminServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsDeliveryAttemptAdminServiceApi.DeliveryAttemptAdminServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CopyExposureImportColumnsIdRecord): Promise<void> {
    await call<notificationsDeliveryAttemptAdminServiceApi.TransferDeliveryAttemptRequest, notificationsDeliveryAttemptAdminServiceApi.TransferDeliveryAttemptResponse>(
      (request, done) => this.client.transferDeliveryAttempt(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      notificationsDeliveryAttemptAdminServiceApi.TransferDeliveryAttemptRequest.fromPartial({ details: { reasonCode: record.referenceId } }));
  }
}

/** Writes records to acme.notifications.v1.NotificationQueryService. */
class CopyExposureImportColumnsIdNotificationQuery implements CopyExposureImportColumnsIdTarget {
  private readonly client: notificationsNotificationQueryServiceApi.NotificationQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationQueryServiceApi.NotificationQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CopyExposureImportColumnsIdRecord): Promise<void> {
    await retry(() => call<notificationsNotificationQueryServiceApi.BrowseNotificationsRequest, notificationsNotificationQueryServiceApi.BrowseNotificationsResponse>(
      (request, done) => this.client.browseNotifications(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      notificationsNotificationQueryServiceApi.BrowseNotificationsRequest.fromPartial({ orderBy: record.source, page: { pageToken: record.referenceId } })));
  }
}

/**
 * Reads acme.experiments.v1.ExposureImportService/MapExposureImportColumns and hands what it keeps to the
 * sink of its kind.
 */
export async function copyExposureImportColumnsId(runtime: Runtime): Promise<void> {
  const reader = new experimentsExposureImportServiceApi.ExposureImportServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<experimentsExposureImportServiceApi.MapExposureImportColumnsRequest, experimentsExposureImportServiceApi.MapExposureImportColumnsResponse>(
    (request, done) => reader.mapExposureImportColumns(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    experimentsExposureImportServiceApi.MapExposureImportColumnsRequest.fromPartial({ exposureId: "main-copy-exposure-import-columns-id" })));
  const row: CopyExposureImportColumnsIdRecord = {
    referenceId: response.outcome?.referenceId ?? "",
    source: text.normalize(response.exposure?.source ?? ""),
  };
  const sinks: CopyExposureImportColumnsIdTarget[] = [
    new CopyExposureImportColumnsIdDeliveryAttemptAdmin(runtime),
    new CopyExposureImportColumnsIdNotificationQuery(runtime),
  ];
  await sinks[1]!.push(row);
}
