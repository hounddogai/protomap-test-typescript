import * as experimentsExperimentReportingServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_reporting_service.js";
import * as localizationTranslationJobLifecycleServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_lifecycle_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleExperimentReportId keeps of each ScheduleExperimentReport response. */
interface SettleExperimentReportIdRecord {
  correlationId: string;
  downloadUri: string;
  timezone: string;
  status: string;
}

/** Where settleExperimentReportId hands each record. */
interface SettleExperimentReportIdTarget {
  write(record: SettleExperimentReportIdRecord): Promise<void>;
}

/** Passes records to acme.localization.v1.TranslationJobLifecycleService. */
class SettleExperimentReportIdTranslationJobLifecycle implements SettleExperimentReportIdTarget {
  private readonly client: localizationTranslationJobLifecycleServiceApi.TranslationJobLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationTranslationJobLifecycleServiceApi.TranslationJobLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: SettleExperimentReportIdRecord): Promise<void> {
    await retry(() => call<localizationTranslationJobLifecycleServiceApi.GetTranslationJobLifecycleRequest, localizationTranslationJobLifecycleServiceApi.GetTranslationJobLifecycleResponse>(
      (request, done) => this.client.getTranslationJobLifecycle(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      localizationTranslationJobLifecycleServiceApi.GetTranslationJobLifecycleRequest.fromPartial({ translationJobId: record.correlationId })));
  }
}

/** Passes records to acme.experiments.v1.ExperimentReportingService. */
class SettleExperimentReportIdExperimentReporting implements SettleExperimentReportIdTarget {
  private readonly client: experimentsExperimentReportingServiceApi.ExperimentReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExperimentReportingServiceApi.ExperimentReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: SettleExperimentReportIdRecord): Promise<void> {
    await retry(() => call<experimentsExperimentReportingServiceApi.GenerateExperimentReportRequest, experimentsExperimentReportingServiceApi.GenerateExperimentReportResponse>(
      (request, done) => this.client.generateExperimentReport(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      experimentsExperimentReportingServiceApi.GenerateExperimentReportRequest.fromPartial({ details: { cron: record.status }, experimentId: record.timezone })));
  }
}

/**
 * Reads acme.experiments.v1.ExperimentReportingService/ScheduleExperimentReport and hands what it keeps to
 * the sink of its kind.
 */
export async function settleExperimentReportId(runtime: Runtime): Promise<void> {
  const upstream = new experimentsExperimentReportingServiceApi.ExperimentReportingServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<experimentsExperimentReportingServiceApi.ScheduleExperimentReportRequest, experimentsExperimentReportingServiceApi.ScheduleExperimentReportResponse>(
    (request, done) => upstream.scheduleExperimentReport(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    experimentsExperimentReportingServiceApi.ScheduleExperimentReportRequest.fromPartial({ reason: "live-settle-experiment-report-id" })));
  const record: SettleExperimentReportIdRecord = {
    correlationId: reply.result?.correlationId ?? "",
    downloadUri: text.normalize(reply.downloadUri),
    timezone: text.normalize(reply.period?.timezone ?? ""),
    status: reply.result?.status ?? "",
  };
  const entries: Array<{ kind: string; sink: SettleExperimentReportIdTarget }> = [
    { kind: "translation-job-lifecycle", sink: new SettleExperimentReportIdTranslationJobLifecycle(runtime) },
    { kind: "experiment-reporting", sink: new SettleExperimentReportIdExperimentReporting(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "translation-job-lifecycle") continue;
    await entry.sink.write(record);
  }
}
