import * as patientsPatientQueryServiceApi from "../../../.cache/proto/acme/patients/v1/patient_query_service.js";
import * as personalizationAffinityCalculationServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_calculation_service.js";
import * as showsShowQueryServiceApi from "../../../.cache/proto/acme/shows/v1/show_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replayPatientsId keeps of each BrowsePatients response. */
interface ReplayPatientsIdRecord {
  correlationId: string;
  status: string;
}

/** Where replayPatientsId hands each record. */
interface ReplayPatientsIdSink {
  apply(record: ReplayPatientsIdRecord): Promise<void>;
}

/** Sends records to acme.shows.v1.ShowQueryService. */
class ReplayPatientsIdShowQuery implements ReplayPatientsIdSink {
  private readonly client: showsShowQueryServiceApi.ShowQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new showsShowQueryServiceApi.ShowQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: ReplayPatientsIdRecord): Promise<void> {
    await call<showsShowQueryServiceApi.CountShowsRequest, showsShowQueryServiceApi.CountShowsResponse>(
      (request, done) => this.client.countShows(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      showsShowQueryServiceApi.CountShowsRequest.fromPartial({ filter: { region: record.correlationId }, orderBy: record.status }));
  }
}

/** Hands records to acme.personalization.v1.AffinityCalculationService. */
class ReplayPatientsIdAffinityCalculation implements ReplayPatientsIdSink {
  private readonly client: personalizationAffinityCalculationServiceApi.AffinityCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationAffinityCalculationServiceApi.AffinityCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: ReplayPatientsIdRecord): Promise<void> {
    await call<personalizationAffinityCalculationServiceApi.CalculateAffinityRequest, personalizationAffinityCalculationServiceApi.CalculateAffinityResponse>(
      (request, done) => this.client.calculateAffinity(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      personalizationAffinityCalculationServiceApi.CalculateAffinityRequest.fromPartial({ affinity: { affinityId: record.status } }));
  }
}

/** Reads acme.patients.v1.PatientQueryService/BrowsePatients and hands what it keeps to the sink of its kind. */
export async function replayPatientsId(runtime: Runtime): Promise<void> {
  const reader = new patientsPatientQueryServiceApi.PatientQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<patientsPatientQueryServiceApi.BrowsePatientsRequest, patientsPatientQueryServiceApi.BrowsePatientsResponse>(
    (request, done) => reader.browsePatients(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    patientsPatientQueryServiceApi.BrowsePatientsRequest.fromPartial({ orderBy: "primary-replay-patients-id" }));
  const record: ReplayPatientsIdRecord = {
    correlationId: text.normalize(current.result?.correlationId ?? ""),
    status: current.result?.status ?? "",
  };
  const sinks: ReplayPatientsIdSink[] = [
    new ReplayPatientsIdShowQuery(runtime),
    new ReplayPatientsIdAffinityCalculation(runtime),
  ];
  for (const sink of sinks) {
    await sink.apply(record);
  }
}
