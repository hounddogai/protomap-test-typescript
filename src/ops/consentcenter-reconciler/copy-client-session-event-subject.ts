import * as formsFormSubmissionCalculationServiceApi from "../../../.cache/proto/acme/forms/v1/form_submission_calculation_service.js";
import * as mediaTranscodeJobSyncServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_sync_service.js";
import * as surveysSurveyServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_service.js";
import * as telehealthVideoVisitQueryServiceApi from "../../../.cache/proto/acme/telehealth/v1/video_visit_query_service.js";
import * as webbffClientSessionIntegrationServiceApi from "../../../.cache/proto/acme/webbff/v1/client_session_integration_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyClientSessionEventSubject keeps of each AcknowledgeClientSessionEvent response. */
interface CopyClientSessionEventSubjectRecord {
  subject: string;
  clientSessionId: string;
  referenceId: string;
  status: string;
}

/** Where copyClientSessionEventSubject hands each record. */
interface CopyClientSessionEventSubjectSink {
  deliver(record: CopyClientSessionEventSubjectRecord): Promise<void>;
}

/** Writes records to acme.forms.v1.FormSubmissionCalculationService. */
class CopyClientSessionEventSubjectFormSubmissionCalculation implements CopyClientSessionEventSubjectSink {
  private readonly client: formsFormSubmissionCalculationServiceApi.FormSubmissionCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormSubmissionCalculationServiceApi.FormSubmissionCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CopyClientSessionEventSubjectRecord): Promise<void> {
    await retry(() => call<formsFormSubmissionCalculationServiceApi.RecalculateFormSubmissionsRequest, formsFormSubmissionCalculationServiceApi.RecalculateFormSubmissionsResponse>(
      (request, done) => this.client.recalculateFormSubmissions(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      formsFormSubmissionCalculationServiceApi.RecalculateFormSubmissionsRequest.fromPartial({ formSubmission: { formSubmissionId: record.referenceId, correlationId: record.status }, formSubmissionId: record.subject })));
  }
}

/** Writes records to acme.telehealth.v1.VideoVisitQueryService. */
class CopyClientSessionEventSubjectVideoVisitQuery implements CopyClientSessionEventSubjectSink {
  private readonly client: telehealthVideoVisitQueryServiceApi.VideoVisitQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new telehealthVideoVisitQueryServiceApi.VideoVisitQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CopyClientSessionEventSubjectRecord): Promise<void> {
    await call<telehealthVideoVisitQueryServiceApi.LookupVideoVisitRequest, telehealthVideoVisitQueryServiceApi.LookupVideoVisitResponse>(
      (request, done) => this.client.lookupVideoVisit(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      telehealthVideoVisitQueryServiceApi.LookupVideoVisitRequest.fromPartial({ videoVisitId: record.clientSessionId }));
  }
}

/** Hands records to acme.media.v1.TranscodeJobSyncService. */
class CopyClientSessionEventSubjectTranscodeJobSync implements CopyClientSessionEventSubjectSink {
  private readonly client: mediaTranscodeJobSyncServiceApi.TranscodeJobSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaTranscodeJobSyncServiceApi.TranscodeJobSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CopyClientSessionEventSubjectRecord): Promise<void> {
    await call<mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsRequest, mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsResponse>(
      (request, done) => this.client.reconcileTranscodeJobs(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsRequest.fromPartial({ details: { peerRegion: record.status }, transcodeJob: { subject: record.clientSessionId } }));
  }
}

/** Writes records to acme.surveys.v1.SurveyService. */
class CopyClientSessionEventSubjectSurvey implements CopyClientSessionEventSubjectSink {
  private readonly client: surveysSurveyServiceApi.SurveyServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysSurveyServiceApi.SurveyServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CopyClientSessionEventSubjectRecord): Promise<void> {
    await call<surveysSurveyServiceApi.UpdateSurveyRequest, surveysSurveyServiceApi.UpdateSurveyResponse>(
      (request, done) => this.client.updateSurvey(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      surveysSurveyServiceApi.UpdateSurveyRequest.fromPartial({ survey: { surveyId: record.clientSessionId } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class CopyClientSessionEventSubjectLogOnly implements CopyClientSessionEventSubjectSink {
  async deliver(record: CopyClientSessionEventSubjectRecord): Promise<void> {
    console.info("no sink for record", record.subject);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverCopyClientSessionEventSubject(kind: string, record: CopyClientSessionEventSubjectRecord, runtime: Runtime): Promise<void> {
  let sink: CopyClientSessionEventSubjectSink = new CopyClientSessionEventSubjectLogOnly();
  switch (kind) {
    case "form-submission-calculation":
      sink = new CopyClientSessionEventSubjectFormSubmissionCalculation(runtime);
      break;
    case "video-visit-query":
      sink = new CopyClientSessionEventSubjectVideoVisitQuery(runtime);
      break;
    case "transcode-job-sync":
      sink = new CopyClientSessionEventSubjectTranscodeJobSync(runtime);
      break;
    case "survey":
      sink = new CopyClientSessionEventSubjectSurvey(runtime);
      break;
  }
  await sink.deliver(record);
}

/**
 * Reads acme.webbff.v1.ClientSessionIntegrationService/AcknowledgeClientSessionEvent and hands what it keeps
 * to the sink of its kind.
 */
export async function copyClientSessionEventSubject(runtime: Runtime): Promise<void> {
  const source = new webbffClientSessionIntegrationServiceApi.ClientSessionIntegrationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<webbffClientSessionIntegrationServiceApi.AcknowledgeClientSessionEventRequest, webbffClientSessionIntegrationServiceApi.AcknowledgeClientSessionEventResponse>(
    (request, done) => source.acknowledgeClientSessionEvent(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    webbffClientSessionIntegrationServiceApi.AcknowledgeClientSessionEventRequest.fromPartial({ reason: "primary-copy-client-session-event-subject" })));
  const kept: CopyClientSessionEventSubjectRecord = {
    subject: text.normalize(response.clientSession?.subject ?? ""),
    clientSessionId: response.clientSession?.clientSessionId ?? "",
    referenceId: text.normalize(response.outcome?.referenceId ?? ""),
    status: response.result?.status ?? "",
  };
  await deliverCopyClientSessionEventSubject("survey", kept, runtime);
}
