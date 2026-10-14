import * as devicesManagedDeviceServiceApi from "../../../.cache/proto/acme/devices/v1/managed_device_service.js";
import * as driverappDriverHomeQueryServiceApi from "../../../.cache/proto/acme/driverapp/v1/driver_home_query_service.js";
import * as notificationsNotificationTemplateExportServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryDriverHomeMessage keeps of each LookupDriverHome response. */
interface CarryDriverHomeMessageRecord {
  message: string;
  subject: string;
  correlationId: string;
}

/** Where carryDriverHomeMessage hands each record. */
interface CarryDriverHomeMessageTarget {
  apply(record: CarryDriverHomeMessageRecord): Promise<void>;
}

/** Hands records to acme.devices.v1.ManagedDeviceService. */
class CarryDriverHomeMessageManagedDevice implements CarryDriverHomeMessageTarget {
  private readonly client: devicesManagedDeviceServiceApi.ManagedDeviceServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new devicesManagedDeviceServiceApi.ManagedDeviceServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CarryDriverHomeMessageRecord): Promise<void> {
    await call<devicesManagedDeviceServiceApi.GetManagedDeviceRequest, devicesManagedDeviceServiceApi.GetManagedDeviceResponse>(
      (request, done) => this.client.getManagedDevice(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      devicesManagedDeviceServiceApi.GetManagedDeviceRequest.fromPartial({ managedDeviceId: record.correlationId }));
  }
}

/** Sends records to acme.notifications.v1.NotificationTemplateExportService. */
class CarryDriverHomeMessageNotificationTemplateExport implements CarryDriverHomeMessageTarget {
  private readonly client: notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CarryDriverHomeMessageRecord): Promise<void> {
    await call<notificationsNotificationTemplateExportServiceApi.ListNotificationTemplateExportsRequest, notificationsNotificationTemplateExportServiceApi.ListNotificationTemplateExportsResponse>(
      (request, done) => this.client.listNotificationTemplateExports(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      notificationsNotificationTemplateExportServiceApi.ListNotificationTemplateExportsRequest.fromPartial({ filter: { ownerId: record.correlationId } }));
  }
}

/**
 * Reads acme.driverapp.v1.DriverHomeQueryService/LookupDriverHome and hands what it keeps to the sink of its
 * kind.
 */
export async function carryDriverHomeMessage(runtime: Runtime): Promise<void> {
  const reader = new driverappDriverHomeQueryServiceApi.DriverHomeQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<driverappDriverHomeQueryServiceApi.LookupDriverHomeRequest, driverappDriverHomeQueryServiceApi.LookupDriverHomeResponse>(
    (request, done) => reader.lookupDriverHome(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    driverappDriverHomeQueryServiceApi.LookupDriverHomeRequest.fromPartial({ driverHomeId: "nightly-carry-driver-home-message" }));
  const entry: CarryDriverHomeMessageRecord = {
    message: text.normalize(response.result?.message ?? ""),
    subject: text.normalize(response.driverHome?.subject ?? ""),
    correlationId: response.result?.correlationId ?? "",
  };
  const entries: Array<{ kind: string; sink: CarryDriverHomeMessageTarget }> = [
    { kind: "managed-device", sink: new CarryDriverHomeMessageManagedDevice(runtime) },
    { kind: "notification-template-export", sink: new CarryDriverHomeMessageNotificationTemplateExport(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "notification-template-export") continue;
    await entry.sink.apply(entry);
  }
}
