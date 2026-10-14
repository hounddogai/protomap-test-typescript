import * as experimentsVariantValidationServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_validation_service.js";
import * as labelingLabelingTaskQueryServiceApi from "../../../.cache/proto/acme/labeling/v1/labeling_task_query_service.js";
import * as patientsPatientServiceApi from "../../../.cache/proto/acme/patients/v1/patient_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryPatientStatus keeps of each CreatePatient response. */
interface CarryPatientStatusRecord {
  status: string;
  correlationId: string;
  patientId: string;
  message: string;
}

/** Where carryPatientStatus hands each record. */
interface CarryPatientStatusDestination {
  deliver(record: CarryPatientStatusRecord): Promise<void>;
}

/** Hands records to acme.labeling.v1.LabelingTaskQueryService. */
class CarryPatientStatusLabelingTaskQuery implements CarryPatientStatusDestination {
  private readonly client: labelingLabelingTaskQueryServiceApi.LabelingTaskQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new labelingLabelingTaskQueryServiceApi.LabelingTaskQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CarryPatientStatusRecord): Promise<void> {
    await call<labelingLabelingTaskQueryServiceApi.SummarizeLabelingTasksRequest, labelingLabelingTaskQueryServiceApi.SummarizeLabelingTasksResponse>(
      (request, done) => this.client.summarizeLabelingTasks(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      labelingLabelingTaskQueryServiceApi.SummarizeLabelingTasksRequest.fromPartial({ reason: record.correlationId }));
  }
}

/** Sends records to acme.experiments.v1.VariantValidationService. */
class CarryPatientStatusVariantValidation implements CarryPatientStatusDestination {
  private readonly client: experimentsVariantValidationServiceApi.VariantValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsVariantValidationServiceApi.VariantValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CarryPatientStatusRecord): Promise<void> {
    await call<experimentsVariantValidationServiceApi.ExplainVariantDecisionRequest, experimentsVariantValidationServiceApi.ExplainVariantDecisionResponse>(
      (request, done) => this.client.explainVariantDecision(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      experimentsVariantValidationServiceApi.ExplainVariantDecisionRequest.fromPartial({ variant: { description: record.status }, details: { locale: record.message } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class CarryPatientStatusLogOnly implements CarryPatientStatusDestination {
  async deliver(record: CarryPatientStatusRecord): Promise<void> {
    console.info("no sink for record", record.status);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchCarryPatientStatus(kind: string, record: CarryPatientStatusRecord, runtime: Runtime): Promise<void> {
  let write = (item: CarryPatientStatusRecord): Promise<void> => new CarryPatientStatusLogOnly().deliver(item);
  switch (kind) {
    case "labeling-task-query":
      write = (item) => new CarryPatientStatusLabelingTaskQuery(runtime).deliver(item);
      break;
    case "variant-validation":
      write = (item) => new CarryPatientStatusVariantValidation(runtime).deliver(item);
      break;
  }
  await write(record);
}

/** Reads acme.patients.v1.PatientService/CreatePatient and hands what it keeps to the sink of its kind. */
export async function carryPatientStatus(runtime: Runtime): Promise<void> {
  const upstream = new patientsPatientServiceApi.PatientServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<patientsPatientServiceApi.CreatePatientRequest, patientsPatientServiceApi.CreatePatientResponse>(
    (request, done) => upstream.createPatient(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    patientsPatientServiceApi.CreatePatientRequest.fromPartial({ requestId: "nightly-carry-patient-status" })));
  const row: CarryPatientStatusRecord = {
    status: response.result?.status ?? "",
    correlationId: response.result?.correlationId ?? "",
    patientId: text.normalize(response.patient?.patientId ?? ""),
    message: response.result?.message ?? "",
  };
  await dispatchCarryPatientStatus("variant-validation", row, runtime);
}
