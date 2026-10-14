import * as complianceComplianceCaseCalculationServiceApi from "../../../.cache/proto/acme/compliance/v1/compliance_case_calculation_service.js";
import * as formsFormSubmissionWorkflowServiceApi from "../../../.cache/proto/acme/forms/v1/form_submission_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleFormSubmissionWorkflowId keeps of each SignalFormSubmissionWorkflow response. */
interface SettleFormSubmissionWorkflowIdRecord {
  referenceId: string;
  correlationId: string;
  formSubmissionId: string;
  message: string;
}

/**
 * Reads acme.forms.v1.FormSubmissionWorkflowService/SignalFormSubmissionWorkflow, keeps its fields by name,
 * and passes some of them to acme.compliance.v1.ComplianceCaseCalculationService.
 */
export async function settleFormSubmissionWorkflowId(runtime: Runtime): Promise<void> {
  const source = new formsFormSubmissionWorkflowServiceApi.FormSubmissionWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<formsFormSubmissionWorkflowServiceApi.SignalFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.SignalFormSubmissionWorkflowResponse>(
    (request, done) => source.signalFormSubmissionWorkflow(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    formsFormSubmissionWorkflowServiceApi.SignalFormSubmissionWorkflowRequest.fromPartial({ reason: "live-settle-form-submission-workflow-id" }));
  const entry: SettleFormSubmissionWorkflowIdRecord = {
    referenceId: current.outcome?.referenceId ?? "",
    correlationId: current.result?.correlationId ?? "",
    formSubmissionId: current.formSubmission?.formSubmissionId ?? "",
    message: text.normalize(current.result?.message ?? ""),
  };
  const params = new URLSearchParams();
  params.set("reference-id", entry.referenceId);
  params.set("correlation-id", entry.correlationId);
  params.set("form-submission-id", entry.formSubmissionId);
  params.set("message", entry.message);
  const target = new complianceComplianceCaseCalculationServiceApi.ComplianceCaseCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  await call<complianceComplianceCaseCalculationServiceApi.RecalculateComplianceCasesRequest, complianceComplianceCaseCalculationServiceApi.RecalculateComplianceCasesResponse>(
    (request, done) => target.recalculateComplianceCases(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    complianceComplianceCaseCalculationServiceApi.RecalculateComplianceCasesRequest.fromPartial({ complianceCase: { complianceCaseId: params.get("message") ?? "" }, details: { currencyCode: params.get("form-submission-id") ?? "" } }));
}
