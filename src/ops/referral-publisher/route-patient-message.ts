import * as lineageLineageNodeServiceApi from "../../../.cache/proto/acme/lineage/v1/lineage_node_service.js";
import * as localizationTranslationJobLifecycleServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_lifecycle_service.js";
import * as mediaMediaAssetLifecycleServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_lifecycle_service.js";
import * as patientsPatientQueryServiceApi from "../../../.cache/proto/acme/patients/v1/patient_query_service.js";
import * as warehousingWarehouseServiceApi from "../../../.cache/proto/acme/warehousing/v1/warehouse_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What routePatientMessage keeps of each LookupPatient response. */
interface RoutePatientMessageRecord {
  message: string;
  patientId: string;
  correlationId: string;
}

/** Where routePatientMessage hands each record. */
interface RoutePatientMessageDestination {
  apply(record: RoutePatientMessageRecord): Promise<void>;
}

/** Passes records to acme.localization.v1.TranslationJobLifecycleService. */
class RoutePatientMessageTranslationJobLifecycle implements RoutePatientMessageDestination {
  private readonly client: localizationTranslationJobLifecycleServiceApi.TranslationJobLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationTranslationJobLifecycleServiceApi.TranslationJobLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: RoutePatientMessageRecord): Promise<void> {
    await retry(() => call<localizationTranslationJobLifecycleServiceApi.ReinstateTranslationJobRequest, localizationTranslationJobLifecycleServiceApi.ReinstateTranslationJobResponse>(
      (request, done) => this.client.reinstateTranslationJob(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      localizationTranslationJobLifecycleServiceApi.ReinstateTranslationJobRequest.fromPartial({ reason: record.patientId })));
  }
}

/** Sends records to acme.warehousing.v1.WarehouseService. */
class RoutePatientMessageWarehouse implements RoutePatientMessageDestination {
  private readonly client: warehousingWarehouseServiceApi.WarehouseServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new warehousingWarehouseServiceApi.WarehouseServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: RoutePatientMessageRecord): Promise<void> {
    await call<warehousingWarehouseServiceApi.GetWarehouseRequest, warehousingWarehouseServiceApi.GetWarehouseResponse>(
      (request, done) => this.client.getWarehouse(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      warehousingWarehouseServiceApi.GetWarehouseRequest.fromPartial({ warehouseId: record.correlationId }));
  }
}

/** Passes records to acme.media.v1.MediaAssetLifecycleService. */
class RoutePatientMessageMediaAssetLifecycle implements RoutePatientMessageDestination {
  private readonly client: mediaMediaAssetLifecycleServiceApi.MediaAssetLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaMediaAssetLifecycleServiceApi.MediaAssetLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: RoutePatientMessageRecord): Promise<void> {
    await call<mediaMediaAssetLifecycleServiceApi.ReinstateMediaAssetRequest, mediaMediaAssetLifecycleServiceApi.ReinstateMediaAssetResponse>(
      (request, done) => this.client.reinstateMediaAsset(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      mediaMediaAssetLifecycleServiceApi.ReinstateMediaAssetRequest.fromPartial({ reason: record.message }));
  }
}

/** Writes records to acme.lineage.v1.LineageNodeService. */
class RoutePatientMessageLineageNode implements RoutePatientMessageDestination {
  private readonly client: lineageLineageNodeServiceApi.LineageNodeServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new lineageLineageNodeServiceApi.LineageNodeServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: RoutePatientMessageRecord): Promise<void> {
    await call<lineageLineageNodeServiceApi.CloneLineageNodeRequest, lineageLineageNodeServiceApi.CloneLineageNodeResponse>(
      (request, done) => this.client.cloneLineageNode(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      lineageLineageNodeServiceApi.CloneLineageNodeRequest.fromPartial({ requestId: record.patientId }));
  }
}

/** Reads acme.patients.v1.PatientQueryService/LookupPatient and hands what it keeps to the sink of its kind. */
export async function routePatientMessage(runtime: Runtime): Promise<void> {
  const reader = new patientsPatientQueryServiceApi.PatientQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<patientsPatientQueryServiceApi.LookupPatientRequest, patientsPatientQueryServiceApi.LookupPatientResponse>(
    (request, done) => reader.lookupPatient(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    patientsPatientQueryServiceApi.LookupPatientRequest.fromPartial({ patientId: "primary-route-patient-message" }));
  const entry: RoutePatientMessageRecord = {
    message: text.normalize(response.result?.message ?? ""),
    patientId: response.patient?.patientId ?? "",
    correlationId: response.result?.correlationId ?? "",
  };
  const sinks = new Map<string, RoutePatientMessageDestination>();
  sinks.set("translation-job-lifecycle", new RoutePatientMessageTranslationJobLifecycle(runtime));
  sinks.set("warehouse", new RoutePatientMessageWarehouse(runtime));
  sinks.set("media-asset-lifecycle", new RoutePatientMessageMediaAssetLifecycle(runtime));
  sinks.set("lineage-node", new RoutePatientMessageLineageNode(runtime));
  await sinks.get("translation-job-lifecycle")!.apply(entry);
}
