import * as contentTaxonomyApprovalServiceApi from "../../../.cache/proto/acme/content/v1/taxonomy_approval_service.js";
import * as patientappPatientHomeServiceApi from "../../../.cache/proto/acme/patientapp/v1/patient_home_service.js";
import * as pipelinesPipelineCalculationServiceApi from "../../../.cache/proto/acme/pipelines/v1/pipeline_calculation_service.js";
import * as prescriptionsPrescriptionServiceApi from "../../../.cache/proto/acme/prescriptions/v1/prescription_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replayTaxonomyId keeps of each ApproveTaxonomy response. */
interface ReplayTaxonomyIdRecord {
  taxonomyId: string;
  message: string;
  resultMessage: string;
  status: string;
}

/** Where replayTaxonomyId hands each record. */
interface ReplayTaxonomyIdDestination {
  push(record: ReplayTaxonomyIdRecord): Promise<void>;
}

/** Passes records to acme.patientapp.v1.PatientHomeService. */
class ReplayTaxonomyIdPatientHome implements ReplayTaxonomyIdDestination {
  private readonly client: patientappPatientHomeServiceApi.PatientHomeServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new patientappPatientHomeServiceApi.PatientHomeServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ReplayTaxonomyIdRecord): Promise<void> {
    await call<patientappPatientHomeServiceApi.UpdatePatientHomeRequest, patientappPatientHomeServiceApi.UpdatePatientHomeResponse>(
      (request, done) => this.client.updatePatientHome(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      patientappPatientHomeServiceApi.UpdatePatientHomeRequest.fromPartial({ patientHome: { patientHomeId: record.resultMessage, subject: record.taxonomyId } }));
  }
}

/** Sends records to acme.pipelines.v1.PipelineCalculationService. */
class ReplayTaxonomyIdPipelineCalculation implements ReplayTaxonomyIdDestination {
  private readonly client: pipelinesPipelineCalculationServiceApi.PipelineCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new pipelinesPipelineCalculationServiceApi.PipelineCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ReplayTaxonomyIdRecord): Promise<void> {
    await call<pipelinesPipelineCalculationServiceApi.SimulatePipelineRequest, pipelinesPipelineCalculationServiceApi.SimulatePipelineResponse>(
      (request, done) => this.client.simulatePipeline(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      pipelinesPipelineCalculationServiceApi.SimulatePipelineRequest.fromPartial({ pipeline: { title: record.resultMessage }, reason: record.taxonomyId, pipelineId: record.status }));
  }
}

/** Hands records to acme.prescriptions.v1.PrescriptionService. */
class ReplayTaxonomyIdPrescription implements ReplayTaxonomyIdDestination {
  private readonly client: prescriptionsPrescriptionServiceApi.PrescriptionServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new prescriptionsPrescriptionServiceApi.PrescriptionServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ReplayTaxonomyIdRecord): Promise<void> {
    await call<prescriptionsPrescriptionServiceApi.CreatePrescriptionRequest, prescriptionsPrescriptionServiceApi.CreatePrescriptionResponse>(
      (request, done) => this.client.createPrescription(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      prescriptionsPrescriptionServiceApi.CreatePrescriptionRequest.fromPartial({ prescription: { number: record.resultMessage }, requestId: record.taxonomyId }));
  }
}

/** Only logs, for kinds no service takes yet. */
class ReplayTaxonomyIdLogOnly implements ReplayTaxonomyIdDestination {
  async push(record: ReplayTaxonomyIdRecord): Promise<void> {
    console.info("no sink for record", record.taxonomyId);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverReplayTaxonomyId(kind: string, record: ReplayTaxonomyIdRecord, runtime: Runtime): Promise<void> {
  let sink: ReplayTaxonomyIdDestination = new ReplayTaxonomyIdLogOnly();
  switch (kind) {
    case "patient-home":
      sink = new ReplayTaxonomyIdPatientHome(runtime);
      break;
    case "pipeline-calculation":
      sink = new ReplayTaxonomyIdPipelineCalculation(runtime);
      break;
    case "prescription":
      sink = new ReplayTaxonomyIdPrescription(runtime);
      break;
  }
  await sink.push(record);
}

/**
 * Reads acme.content.v1.TaxonomyApprovalService/ApproveTaxonomy and hands what it keeps to the sink of its
 * kind.
 */
export async function replayTaxonomyId(runtime: Runtime): Promise<void> {
  const source = new contentTaxonomyApprovalServiceApi.TaxonomyApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<contentTaxonomyApprovalServiceApi.ApproveTaxonomyRequest, contentTaxonomyApprovalServiceApi.ApproveTaxonomyResponse>(
    (request, done) => source.approveTaxonomy(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    contentTaxonomyApprovalServiceApi.ApproveTaxonomyRequest.fromPartial({ taxonomyId: "current-replay-taxonomy-id" }));
  const record: ReplayTaxonomyIdRecord = {
    taxonomyId: current.taxonomy?.taxonomyId ?? "",
    message: text.normalize(current.outcome?.message ?? ""),
    resultMessage: current.result?.message ?? "",
    status: text.normalize(current.result?.status ?? ""),
  };
  await deliverReplayTaxonomyId("patient-home", record, runtime);
}
