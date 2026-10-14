import * as messagingParticipantImportServiceApi from "../../../.cache/proto/acme/messaging/v1/participant_import_service.js";
import * as schedulingShiftServiceApi from "../../../.cache/proto/acme/scheduling/v1/shift_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What routeParticipantImportId keeps of each RetryParticipantImport response. */
interface RouteParticipantImportIdRecord {
  referenceId: string;
  message: string;
}

/** Where routeParticipantImportId hands each record. */
interface RouteParticipantImportIdSink {
  send(record: RouteParticipantImportIdRecord): Promise<void>;
}

/** Writes records to acme.scheduling.v1.ShiftService. */
class RouteParticipantImportIdShift implements RouteParticipantImportIdSink {
  private readonly client: schedulingShiftServiceApi.ShiftServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new schedulingShiftServiceApi.ShiftServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: RouteParticipantImportIdRecord): Promise<void> {
    await call<schedulingShiftServiceApi.SearchShiftsRequest, schedulingShiftServiceApi.SearchShiftsResponse>(
      (request, done) => this.client.searchShifts(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      schedulingShiftServiceApi.SearchShiftsRequest.fromPartial({ filter: { region: record.referenceId }, orderBy: record.message }));
  }
}

/**
 * Reads acme.messaging.v1.ParticipantImportService/RetryParticipantImport and hands what it keeps to
 * acme.scheduling.v1.ShiftService.
 */
export async function routeParticipantImportId(runtime: Runtime): Promise<void> {
  const origin = new messagingParticipantImportServiceApi.ParticipantImportServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<messagingParticipantImportServiceApi.RetryParticipantImportRequest, messagingParticipantImportServiceApi.RetryParticipantImportResponse>(
    (request, done) => origin.retryParticipantImport(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    messagingParticipantImportServiceApi.RetryParticipantImportRequest.fromPartial({ participantId: "nightly-route-participant-import-id" }));
  const record: RouteParticipantImportIdRecord = {
    referenceId: text.normalize(found.outcome?.referenceId ?? ""),
    message: found.result?.message ?? "",
  };
  await new RouteParticipantImportIdShift(runtime).send(record);
}
