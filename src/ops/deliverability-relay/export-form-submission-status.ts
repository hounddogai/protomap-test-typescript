import * as configurationConfigSetServiceApi from "../../../.cache/proto/acme/configuration/v1/config_set_service.js";
import * as formsFormSubmissionApprovalServiceApi from "../../../.cache/proto/acme/forms/v1/form_submission_approval_service.js";
import * as riskRiskRegisterQueryServiceApi from "../../../.cache/proto/acme/risk/v1/risk_register_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportFormSubmissionStatus keeps of each SubmitFormSubmission response. */
interface ExportFormSubmissionStatusRecord {
  status: string;
  source: string;
}

/** Where exportFormSubmissionStatus hands each record. */
interface ExportFormSubmissionStatusSink {
  push(record: ExportFormSubmissionStatusRecord): Promise<void>;
}

/** Writes records to acme.risk.v1.RiskRegisterQueryService. */
class ExportFormSubmissionStatusRiskRegisterQuery implements ExportFormSubmissionStatusSink {
  private readonly client: riskRiskRegisterQueryServiceApi.RiskRegisterQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new riskRiskRegisterQueryServiceApi.RiskRegisterQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ExportFormSubmissionStatusRecord): Promise<void> {
    await call<riskRiskRegisterQueryServiceApi.PeekRiskRegisterRequest, riskRiskRegisterQueryServiceApi.PeekRiskRegisterResponse>(
      (request, done) => this.client.peekRiskRegister(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      riskRiskRegisterQueryServiceApi.PeekRiskRegisterRequest.fromPartial({ riskRegisterId: record.source }));
  }
}

/** Hands records to acme.configuration.v1.ConfigSetService. */
class ExportFormSubmissionStatusConfigSet implements ExportFormSubmissionStatusSink {
  private readonly client: configurationConfigSetServiceApi.ConfigSetServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new configurationConfigSetServiceApi.ConfigSetServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ExportFormSubmissionStatusRecord): Promise<void> {
    await call<configurationConfigSetServiceApi.SearchConfigSetsRequest, configurationConfigSetServiceApi.SearchConfigSetsResponse>(
      (request, done) => this.client.searchConfigSets(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      configurationConfigSetServiceApi.SearchConfigSetsRequest.fromPartial({ filter: { query: record.status, region: record.source } }));
  }
}

/**
 * Reads acme.forms.v1.FormSubmissionApprovalService/SubmitFormSubmission and hands what it keeps to the sink
 * of its kind.
 */
export async function exportFormSubmissionStatus(runtime: Runtime): Promise<void> {
  const reader = new formsFormSubmissionApprovalServiceApi.FormSubmissionApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<formsFormSubmissionApprovalServiceApi.SubmitFormSubmissionRequest, formsFormSubmissionApprovalServiceApi.SubmitFormSubmissionResponse>(
    (request, done) => reader.submitFormSubmission(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    formsFormSubmissionApprovalServiceApi.SubmitFormSubmissionRequest.fromPartial({ reason: "current-export-form-submission-status" }));
  const row: ExportFormSubmissionStatusRecord = {
    status: found.result?.status ?? "",
    source: found.formSubmission?.source ?? "",
  };
  const sinks: ExportFormSubmissionStatusSink[] = [
    new ExportFormSubmissionStatusRiskRegisterQuery(runtime),
    new ExportFormSubmissionStatusConfigSet(runtime),
  ];
  await sinks[1]!.push(row);
}
