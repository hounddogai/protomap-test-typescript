import * as fanportalFanSessionServiceApi from "../../../.cache/proto/acme/fanportal/v1/fan_session_service.js";
import * as notificationsNotificationTemplateExportServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import * as toursTourQueryServiceApi from "../../../.cache/proto/acme/tours/v1/tour_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryToursId keeps of each BrowseTours response. */
interface CarryToursIdRecord {
  correlationId: string;
  message: string;
}

/** Where carryToursId hands each record. */
interface CarryToursIdWriter {
  write(record: CarryToursIdRecord): Promise<void>;
}

/** Hands records to acme.notifications.v1.NotificationTemplateExportService. */
class CarryToursIdNotificationTemplateExport implements CarryToursIdWriter {
  private readonly client: notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: CarryToursIdRecord): Promise<void> {
    await call<notificationsNotificationTemplateExportServiceApi.CancelNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.CancelNotificationTemplateExportResponse>(
      (request, done) => this.client.cancelNotificationTemplateExport(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      notificationsNotificationTemplateExportServiceApi.CancelNotificationTemplateExportRequest.fromPartial({ reason: record.correlationId, notificationTemplateId: record.message }));
  }
}

/** Writes records to acme.fanportal.v1.FanSessionService. */
class CarryToursIdFanSession implements CarryToursIdWriter {
  private readonly client: fanportalFanSessionServiceApi.FanSessionServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new fanportalFanSessionServiceApi.FanSessionServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: CarryToursIdRecord): Promise<void> {
    await retry(() => call<fanportalFanSessionServiceApi.CreateFanSessionRequest, fanportalFanSessionServiceApi.CreateFanSessionResponse>(
      (request, done) => this.client.createFanSession(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      fanportalFanSessionServiceApi.CreateFanSessionRequest.fromPartial({ fanSession: { fanSessionId: record.correlationId, subject: record.message } })));
  }
}

/** Reads acme.tours.v1.TourQueryService/BrowseTours and hands what it keeps to the sink of its kind. */
export async function carryToursId(runtime: Runtime): Promise<void> {
  const upstream = new toursTourQueryServiceApi.TourQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<toursTourQueryServiceApi.BrowseToursRequest, toursTourQueryServiceApi.BrowseToursResponse>(
    (request, done) => upstream.browseTours(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    toursTourQueryServiceApi.BrowseToursRequest.fromPartial({ orderBy: "current-carry-tours-id" })));
  const record: CarryToursIdRecord = {
    correlationId: text.normalize(reply.result?.correlationId ?? ""),
    message: reply.result?.message ?? "",
  };
  const sinks = new Map<string, CarryToursIdWriter>();
  sinks.set("notification-template-export", new CarryToursIdNotificationTemplateExport(runtime));
  sinks.set("fan-session", new CarryToursIdFanSession(runtime));
  await sinks.get("notification-template-export")!.write(record);
}
