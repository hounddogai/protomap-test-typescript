import * as mediaTranscodeJobLifecycleServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_lifecycle_service.js";
import * as showsShowQueryServiceApi from "../../../.cache/proto/acme/shows/v1/show_query_service.js";
import * as surveysSurveyApprovalServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardShowsTimezone keeps of each SummarizeShows response. */
interface ForwardShowsTimezoneRecord {
  timezone: string;
  status: string;
  correlationId: string;
}

/** Where forwardShowsTimezone hands each record. */
interface ForwardShowsTimezoneSink {
  push(record: ForwardShowsTimezoneRecord): Promise<void>;
}

/** Passes records to acme.media.v1.TranscodeJobLifecycleService. */
class ForwardShowsTimezoneTranscodeJobLifecycle implements ForwardShowsTimezoneSink {
  private readonly client: mediaTranscodeJobLifecycleServiceApi.TranscodeJobLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaTranscodeJobLifecycleServiceApi.TranscodeJobLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ForwardShowsTimezoneRecord): Promise<void> {
    await retry(() => call<mediaTranscodeJobLifecycleServiceApi.TerminateTranscodeJobRequest, mediaTranscodeJobLifecycleServiceApi.TerminateTranscodeJobResponse>(
      (request, done) => this.client.terminateTranscodeJob(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      mediaTranscodeJobLifecycleServiceApi.TerminateTranscodeJobRequest.fromPartial({ details: { reasonCode: record.correlationId }, transcodeJobId: record.timezone, reason: record.status })));
  }
}

/** Passes records to acme.surveys.v1.SurveyApprovalService. */
class ForwardShowsTimezoneSurveyApproval implements ForwardShowsTimezoneSink {
  private readonly client: surveysSurveyApprovalServiceApi.SurveyApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysSurveyApprovalServiceApi.SurveyApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ForwardShowsTimezoneRecord): Promise<void> {
    await call<surveysSurveyApprovalServiceApi.SubmitSurveyRequest, surveysSurveyApprovalServiceApi.SubmitSurveyResponse>(
      (request, done) => this.client.submitSurvey(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      surveysSurveyApprovalServiceApi.SubmitSurveyRequest.fromPartial({ survey: { number: record.status } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class ForwardShowsTimezoneLogOnly implements ForwardShowsTimezoneSink {
  async push(record: ForwardShowsTimezoneRecord): Promise<void> {
    console.info("no sink for record", record.timezone);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverForwardShowsTimezone(kind: string, record: ForwardShowsTimezoneRecord, runtime: Runtime): Promise<void> {
  let sink: ForwardShowsTimezoneSink = new ForwardShowsTimezoneLogOnly();
  switch (kind) {
    case "transcode-job-lifecycle":
      sink = new ForwardShowsTimezoneTranscodeJobLifecycle(runtime);
      break;
    case "survey-approval":
      sink = new ForwardShowsTimezoneSurveyApproval(runtime);
      break;
  }
  await sink.push(record);
}

/** Reads acme.shows.v1.ShowQueryService/SummarizeShows and hands what it keeps to the sink of its kind. */
export async function forwardShowsTimezone(runtime: Runtime): Promise<void> {
  const source = new showsShowQueryServiceApi.ShowQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<showsShowQueryServiceApi.SummarizeShowsRequest, showsShowQueryServiceApi.SummarizeShowsResponse>(
    (request, done) => source.summarizeShows(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    showsShowQueryServiceApi.SummarizeShowsRequest.fromPartial({ reason: "main-forward-shows-timezone" }));
  const kept: ForwardShowsTimezoneRecord = {
    timezone: current.period?.timezone ?? "",
    status: current.result?.status ?? "",
    correlationId: current.result?.correlationId ?? "",
  };
  await deliverForwardShowsTimezone("transcode-job-lifecycle", kept, runtime);
}
