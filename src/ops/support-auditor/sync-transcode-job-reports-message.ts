import * as bankingBankAccountServiceApi from "../../../.cache/proto/acme/banking/v1/bank_account_service.js";
import * as insurancePolicyServiceApi from "../../../.cache/proto/acme/insurance/v1/policy_service.js";
import * as mediaTranscodeJobReportingServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_reporting_service.js";
import * as personalizationAffinityReportingServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_reporting_service.js";
import * as pipelinesPipelineCalculationServiceApi from "../../../.cache/proto/acme/pipelines/v1/pipeline_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncTranscodeJobReportsMessage keeps of each ListTranscodeJobReports response. */
interface SyncTranscodeJobReportsMessageRecord {
  message: string;
  correlationId: string;
}

/** Where syncTranscodeJobReportsMessage hands each record. */
interface SyncTranscodeJobReportsMessageWriter {
  apply(record: SyncTranscodeJobReportsMessageRecord): Promise<void>;
}

/** Writes records to acme.pipelines.v1.PipelineCalculationService. */
class SyncTranscodeJobReportsMessagePipelineCalculation implements SyncTranscodeJobReportsMessageWriter {
  private readonly client: pipelinesPipelineCalculationServiceApi.PipelineCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new pipelinesPipelineCalculationServiceApi.PipelineCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SyncTranscodeJobReportsMessageRecord): Promise<void> {
    await retry(() => call<pipelinesPipelineCalculationServiceApi.GetPipelineRatesRequest, pipelinesPipelineCalculationServiceApi.GetPipelineRatesResponse>(
      (request, done) => this.client.getPipelineRates(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      pipelinesPipelineCalculationServiceApi.GetPipelineRatesRequest.fromPartial({ pipelineId: record.message })));
  }
}

/** Sends records to acme.banking.v1.BankAccountService. */
class SyncTranscodeJobReportsMessageBankAccount implements SyncTranscodeJobReportsMessageWriter {
  private readonly client: bankingBankAccountServiceApi.BankAccountServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new bankingBankAccountServiceApi.BankAccountServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SyncTranscodeJobReportsMessageRecord): Promise<void> {
    await retry(() => call<bankingBankAccountServiceApi.CreateBankAccountRequest, bankingBankAccountServiceApi.CreateBankAccountResponse>(
      (request, done) => this.client.createBankAccount(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      bankingBankAccountServiceApi.CreateBankAccountRequest.fromPartial({ bankAccount: { bankAccountId: record.correlationId } })));
  }
}

/** Writes records to acme.personalization.v1.AffinityReportingService. */
class SyncTranscodeJobReportsMessageAffinityReporting implements SyncTranscodeJobReportsMessageWriter {
  private readonly client: personalizationAffinityReportingServiceApi.AffinityReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationAffinityReportingServiceApi.AffinityReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SyncTranscodeJobReportsMessageRecord): Promise<void> {
    await retry(() => call<personalizationAffinityReportingServiceApi.ScheduleAffinityReportRequest, personalizationAffinityReportingServiceApi.ScheduleAffinityReportResponse>(
      (request, done) => this.client.scheduleAffinityReport(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      personalizationAffinityReportingServiceApi.ScheduleAffinityReportRequest.fromPartial({ details: { cron: record.message } })));
  }
}

/** Hands records to acme.insurance.v1.PolicyService. */
class SyncTranscodeJobReportsMessagePolicy implements SyncTranscodeJobReportsMessageWriter {
  private readonly client: insurancePolicyServiceApi.PolicyServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new insurancePolicyServiceApi.PolicyServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SyncTranscodeJobReportsMessageRecord): Promise<void> {
    await call<insurancePolicyServiceApi.SearchPoliciesRequest, insurancePolicyServiceApi.SearchPoliciesResponse>(
      (request, done) => this.client.searchPolicies(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      insurancePolicyServiceApi.SearchPoliciesRequest.fromPartial({ filter: { ownerId: record.correlationId } }));
  }
}

/**
 * Reads acme.media.v1.TranscodeJobReportingService/ListTranscodeJobReports and hands what it keeps to the
 * sink of its kind.
 */
export async function syncTranscodeJobReportsMessage(runtime: Runtime): Promise<void> {
  const origin = new mediaTranscodeJobReportingServiceApi.TranscodeJobReportingServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<mediaTranscodeJobReportingServiceApi.ListTranscodeJobReportsRequest, mediaTranscodeJobReportingServiceApi.ListTranscodeJobReportsResponse>(
    (request, done) => origin.listTranscodeJobReports(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    mediaTranscodeJobReportingServiceApi.ListTranscodeJobReportsRequest.fromPartial({ orderBy: "live-sync-transcode-job-reports-message" }));
  const entry: SyncTranscodeJobReportsMessageRecord = {
    message: reply.result?.message ?? "",
    correlationId: text.normalize(reply.result?.correlationId ?? ""),
  };
  const registry: Record<string, SyncTranscodeJobReportsMessageWriter> = {};
  for (const entry of [
    { kind: "pipeline-calculation", sink: new SyncTranscodeJobReportsMessagePipelineCalculation(runtime) },
    { kind: "bank-account", sink: new SyncTranscodeJobReportsMessageBankAccount(runtime) },
    { kind: "affinity-reporting", sink: new SyncTranscodeJobReportsMessageAffinityReporting(runtime) },
    { kind: "policy", sink: new SyncTranscodeJobReportsMessagePolicy(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["policy"]!.apply(entry);
}
