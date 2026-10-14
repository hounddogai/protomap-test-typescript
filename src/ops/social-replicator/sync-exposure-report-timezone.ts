import * as communityPostValidationServiceApi from "../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as experimentsExposureReportingServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_reporting_service.js";
import * as fleetVehicleQueryServiceApi from "../../../.cache/proto/acme/fleet/v1/vehicle_query_service.js";
import * as webbffPageCompositionNotificationServiceApi from "../../../.cache/proto/acme/webbff/v1/page_composition_notification_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncExposureReportTimezone keeps of each ScheduleExposureReport response. */
interface SyncExposureReportTimezoneRecord {
  timezone: string;
  downloadUri: string;
}

/** Where syncExposureReportTimezone hands each record. */
interface SyncExposureReportTimezoneSink {
  send(record: SyncExposureReportTimezoneRecord): Promise<void>;
}

/** Passes records to acme.community.v1.PostValidationService. */
class SyncExposureReportTimezonePostValidation implements SyncExposureReportTimezoneSink {
  private readonly client: communityPostValidationServiceApi.PostValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityPostValidationServiceApi.PostValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: SyncExposureReportTimezoneRecord): Promise<void> {
    await call<communityPostValidationServiceApi.CheckPostEligibilityRequest, communityPostValidationServiceApi.CheckPostEligibilityResponse>(
      (request, done) => this.client.checkPostEligibility(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      communityPostValidationServiceApi.CheckPostEligibilityRequest.fromPartial({ post: { notes: record.timezone } }));
  }
}

/** Hands records to acme.webbff.v1.PageCompositionNotificationService. */
class SyncExposureReportTimezonePageCompositionNotification implements SyncExposureReportTimezoneSink {
  private readonly client: webbffPageCompositionNotificationServiceApi.PageCompositionNotificationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webbffPageCompositionNotificationServiceApi.PageCompositionNotificationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: SyncExposureReportTimezoneRecord): Promise<void> {
    await retry(() => call<webbffPageCompositionNotificationServiceApi.ListPageCompositionSubscriptionsRequest, webbffPageCompositionNotificationServiceApi.ListPageCompositionSubscriptionsResponse>(
      (request, done) => this.client.listPageCompositionSubscriptions(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      webbffPageCompositionNotificationServiceApi.ListPageCompositionSubscriptionsRequest.fromPartial({ orderBy: record.downloadUri })));
  }
}

/** Writes records to acme.fleet.v1.VehicleQueryService. */
class SyncExposureReportTimezoneVehicleQuery implements SyncExposureReportTimezoneSink {
  private readonly client: fleetVehicleQueryServiceApi.VehicleQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new fleetVehicleQueryServiceApi.VehicleQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: SyncExposureReportTimezoneRecord): Promise<void> {
    await call<fleetVehicleQueryServiceApi.PeekVehicleRequest, fleetVehicleQueryServiceApi.PeekVehicleResponse>(
      (request, done) => this.client.peekVehicle(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      fleetVehicleQueryServiceApi.PeekVehicleRequest.fromPartial({ vehicleId: record.timezone }));
  }
}

/**
 * Reads acme.experiments.v1.ExposureReportingService/ScheduleExposureReport and hands what it keeps to the
 * sink of its kind.
 */
export async function syncExposureReportTimezone(runtime: Runtime): Promise<void> {
  const origin = new experimentsExposureReportingServiceApi.ExposureReportingServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<experimentsExposureReportingServiceApi.ScheduleExposureReportRequest, experimentsExposureReportingServiceApi.ScheduleExposureReportResponse>(
    (request, done) => origin.scheduleExposureReport(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    experimentsExposureReportingServiceApi.ScheduleExposureReportRequest.fromPartial({ reason: "main-sync-exposure-report-timezone" }));
  const record: SyncExposureReportTimezoneRecord = {
    timezone: found.period?.timezone ?? "",
    downloadUri: found.downloadUri,
  };
  const registry: Record<string, SyncExposureReportTimezoneSink> = {};
  for (const entry of [
    { kind: "post-validation", sink: new SyncExposureReportTimezonePostValidation(runtime) },
    { kind: "page-composition-notification", sink: new SyncExposureReportTimezonePageCompositionNotification(runtime) },
    { kind: "vehicle-query", sink: new SyncExposureReportTimezoneVehicleQuery(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["page-composition-notification"]!.send(record);
}
