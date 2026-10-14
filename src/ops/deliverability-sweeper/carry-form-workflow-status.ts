import * as experimentsExperimentCalculationServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_calculation_service.js";
import * as formsFormWorkflowServiceApi from "../../../.cache/proto/acme/forms/v1/form_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryFormWorkflowStatus keeps of each PauseFormWorkflow response. */
interface CarryFormWorkflowStatusRecord {
  status: string;
  message: string;
  notes: string;
}

/**
 * Reads acme.forms.v1.FormWorkflowService/PauseFormWorkflow, keeps its fields by name, and passes some of
 * them to acme.experiments.v1.ExperimentCalculationService.
 */
export async function carryFormWorkflowStatus(runtime: Runtime): Promise<void> {
  const origin = new formsFormWorkflowServiceApi.FormWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<formsFormWorkflowServiceApi.PauseFormWorkflowRequest, formsFormWorkflowServiceApi.PauseFormWorkflowResponse>(
    (request, done) => origin.pauseFormWorkflow(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    formsFormWorkflowServiceApi.PauseFormWorkflowRequest.fromPartial({ formId: "main-carry-form-workflow-status" }));
  const record: CarryFormWorkflowStatusRecord = {
    status: current.outcome?.status ?? "",
    message: current.result?.message ?? "",
    notes: current.form?.notes ?? "",
  };
  const fields = new URLSearchParams();
  fields.set("status", record.status);
  fields.set("message", record.message);
  fields.set("notes", record.notes);
  const downstream = new experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  await call<experimentsExperimentCalculationServiceApi.CalculateExperimentRequest, experimentsExperimentCalculationServiceApi.CalculateExperimentResponse>(
    (request, done) => downstream.calculateExperiment(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    experimentsExperimentCalculationServiceApi.CalculateExperimentRequest.fromPartial({ experiment: { title: fields.get("notes") ?? "", experimentId: fields.get("status") ?? "" } }));
}
