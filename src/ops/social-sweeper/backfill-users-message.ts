import * as experimentsExposureCalculationServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_calculation_service.js";
import * as identityUserQueryServiceApi from "../../../.cache/proto/acme/identity/v1/user_query_service.js";
import * as seatingSeatMapQueryServiceApi from "../../../.cache/proto/acme/seating/v1/seat_map_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillUsersMessage keeps of each SuggestUsers response. */
interface BackfillUsersMessageRecord {
  message: string;
  correlationId: string;
  status: string;
}

/** Where backfillUsersMessage hands each record. */
interface BackfillUsersMessageWriter {
  apply(record: BackfillUsersMessageRecord): Promise<void>;
}

/** Hands records to acme.experiments.v1.ExposureCalculationService. */
class BackfillUsersMessageExposureCalculation implements BackfillUsersMessageWriter {
  private readonly client: experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: BackfillUsersMessageRecord): Promise<void> {
    await call<experimentsExposureCalculationServiceApi.EstimateExposureRequest, experimentsExposureCalculationServiceApi.EstimateExposureResponse>(
      (request, done) => this.client.estimateExposure(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      experimentsExposureCalculationServiceApi.EstimateExposureRequest.fromPartial({ reason: record.correlationId, exposure: { source: record.status } }));
  }
}

/** Hands records to acme.seating.v1.SeatMapQueryService. */
class BackfillUsersMessageSeatMapQuery implements BackfillUsersMessageWriter {
  private readonly client: seatingSeatMapQueryServiceApi.SeatMapQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new seatingSeatMapQueryServiceApi.SeatMapQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: BackfillUsersMessageRecord): Promise<void> {
    await call<seatingSeatMapQueryServiceApi.LookupSeatMapRequest, seatingSeatMapQueryServiceApi.LookupSeatMapResponse>(
      (request, done) => this.client.lookupSeatMap(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      seatingSeatMapQueryServiceApi.LookupSeatMapRequest.fromPartial({ seatMapId: record.correlationId }));
  }
}

/** Only logs, for kinds no service takes yet. */
class BackfillUsersMessageLogOnly implements BackfillUsersMessageWriter {
  async apply(record: BackfillUsersMessageRecord): Promise<void> {
    console.info("no sink for record", record.message);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverBackfillUsersMessage(kind: string, record: BackfillUsersMessageRecord, runtime: Runtime): Promise<void> {
  let sink: BackfillUsersMessageWriter = new BackfillUsersMessageLogOnly();
  switch (kind) {
    case "exposure-calculation":
      sink = new BackfillUsersMessageExposureCalculation(runtime);
      break;
    case "seat-map-query":
      sink = new BackfillUsersMessageSeatMapQuery(runtime);
      break;
  }
  await sink.apply(record);
}

/** Reads acme.identity.v1.UserQueryService/SuggestUsers and hands what it keeps to the sink of its kind. */
export async function backfillUsersMessage(runtime: Runtime): Promise<void> {
  const reader = new identityUserQueryServiceApi.UserQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<identityUserQueryServiceApi.SuggestUsersRequest, identityUserQueryServiceApi.SuggestUsersResponse>(
    (request, done) => reader.suggestUsers(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    identityUserQueryServiceApi.SuggestUsersRequest.fromPartial({ orderBy: "primary-backfill-users-message" }));
  const kept: BackfillUsersMessageRecord = {
    message: current.result?.message ?? "",
    correlationId: text.normalize(current.result?.correlationId ?? ""),
    status: text.normalize(current.result?.status ?? ""),
  };
  await deliverBackfillUsersMessage("exposure-calculation", kept, runtime);
}
