import * as communityModerationValidationServiceApi from "../../../.cache/proto/acme/community/v1/moderation_validation_service.js";
import * as mediaMediaAssetCalculationServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_calculation_service.js";
import * as merchandisingCollectionServiceApi from "../../../.cache/proto/acme/merchandising/v1/collection_service.js";
import * as patientsPatientServiceApi from "../../../.cache/proto/acme/patients/v1/patient_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryCollectionId keeps of each DeleteCollection response. */
interface CarryCollectionIdRecord {
  correlationId: string;
  message: string;
  status: string;
}

/** Where carryCollectionId hands each record. */
interface CarryCollectionIdWriter {
  forward(record: CarryCollectionIdRecord): Promise<void>;
}

/** Hands records to acme.patients.v1.PatientService. */
class CarryCollectionIdPatient implements CarryCollectionIdWriter {
  private readonly client: patientsPatientServiceApi.PatientServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new patientsPatientServiceApi.PatientServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: CarryCollectionIdRecord): Promise<void> {
    await call<patientsPatientServiceApi.ListPatientsRequest, patientsPatientServiceApi.ListPatientsResponse>(
      (request, done) => this.client.listPatients(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      patientsPatientServiceApi.ListPatientsRequest.fromPartial({ filter: { region: record.correlationId, query: record.message }, page: { pageToken: record.status } }));
  }
}

/** Passes records to acme.media.v1.MediaAssetCalculationService. */
class CarryCollectionIdMediaAssetCalculation implements CarryCollectionIdWriter {
  private readonly client: mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: CarryCollectionIdRecord): Promise<void> {
    await retry(() => call<mediaMediaAssetCalculationServiceApi.ExplainMediaAssetCalculationRequest, mediaMediaAssetCalculationServiceApi.ExplainMediaAssetCalculationResponse>(
      (request, done) => this.client.explainMediaAssetCalculation(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      mediaMediaAssetCalculationServiceApi.ExplainMediaAssetCalculationRequest.fromPartial({ mediaAsset: { code: record.correlationId }, mediaAssetId: record.status })));
  }
}

/** Hands records to acme.community.v1.ModerationValidationService. */
class CarryCollectionIdModerationValidation implements CarryCollectionIdWriter {
  private readonly client: communityModerationValidationServiceApi.ModerationValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityModerationValidationServiceApi.ModerationValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: CarryCollectionIdRecord): Promise<void> {
    await retry(() => call<communityModerationValidationServiceApi.PreviewModerationRequest, communityModerationValidationServiceApi.PreviewModerationResponse>(
      (request, done) => this.client.previewModeration(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      communityModerationValidationServiceApi.PreviewModerationRequest.fromPartial({ moderationId: record.status, details: { locale: record.correlationId }, moderation: { moderationId: record.message } })));
  }
}

/** Runs the action registered for kind. */
async function actOnCarryCollectionId(kind: string, record: CarryCollectionIdRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "patient": () => new CarryCollectionIdPatient(runtime).forward(record),
    "media-asset-calculation": () => new CarryCollectionIdMediaAssetCalculation(runtime).forward(record),
    "moderation-validation": () => new CarryCollectionIdModerationValidation(runtime).forward(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.merchandising.v1.CollectionService/DeleteCollection and hands what it keeps to the sink of its
 * kind.
 */
export async function carryCollectionId(runtime: Runtime): Promise<void> {
  const reader = new merchandisingCollectionServiceApi.CollectionServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<merchandisingCollectionServiceApi.DeleteCollectionRequest, merchandisingCollectionServiceApi.DeleteCollectionResponse>(
    (request, done) => reader.deleteCollection(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    merchandisingCollectionServiceApi.DeleteCollectionRequest.fromPartial({ etag: "current-carry-collection-id" })));
  const record: CarryCollectionIdRecord = {
    correlationId: response.result?.correlationId ?? "",
    message: response.result?.message ?? "",
    status: response.result?.status ?? "",
  };
  await actOnCarryCollectionId("moderation-validation", record, runtime);
}
