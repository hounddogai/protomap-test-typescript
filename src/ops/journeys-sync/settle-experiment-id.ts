import * as experimentsExperimentLifecycleServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_lifecycle_service.js";
import * as mediaTranscodeJobReportingServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_reporting_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleExperimentId keeps of each ExpireExperiment response. */
interface SettleExperimentIdRecord {
  experimentId: string;
  correlationId: string;
  message: string;
  status: string;
}

/** Where settleExperimentId hands each record. */
interface SettleExperimentIdDestination {
  send(record: SettleExperimentIdRecord): Promise<void>;
}

/** Passes records to acme.media.v1.TranscodeJobReportingService. */
class SettleExperimentIdTranscodeJobReporting implements SettleExperimentIdDestination {
  private readonly client: mediaTranscodeJobReportingServiceApi.TranscodeJobReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaTranscodeJobReportingServiceApi.TranscodeJobReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: SettleExperimentIdRecord): Promise<void> {
    await retry(() => call<mediaTranscodeJobReportingServiceApi.ScheduleTranscodeJobReportRequest, mediaTranscodeJobReportingServiceApi.ScheduleTranscodeJobReportResponse>(
      (request, done) => this.client.scheduleTranscodeJobReport(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      mediaTranscodeJobReportingServiceApi.ScheduleTranscodeJobReportRequest.fromPartial({ reason: record.status, transcodeJobId: record.message, details: { format: record.correlationId } })));
  }
}

/**
 * Reads acme.experiments.v1.ExperimentLifecycleService/ExpireExperiment and hands what it keeps to
 * acme.media.v1.TranscodeJobReportingService.
 */
export async function settleExperimentId(runtime: Runtime): Promise<void> {
  const reader = new experimentsExperimentLifecycleServiceApi.ExperimentLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<experimentsExperimentLifecycleServiceApi.ExpireExperimentRequest, experimentsExperimentLifecycleServiceApi.ExpireExperimentResponse>(
    (request, done) => reader.expireExperiment(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    experimentsExperimentLifecycleServiceApi.ExpireExperimentRequest.fromPartial({ reason: "main-settle-experiment-id" })));
  const record: SettleExperimentIdRecord = {
    experimentId: current.experiment?.experimentId ?? "",
    correlationId: current.result?.correlationId ?? "",
    message: current.outcome?.message ?? "",
    status: current.outcome?.status ?? "",
  };
  await new SettleExperimentIdTranscodeJobReporting(runtime).send(record);
}
