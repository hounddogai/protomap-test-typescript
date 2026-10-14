import * as surveysSurveyApprovalServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_approval_service.js";
import * as surveysSurveyWorkflowServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_workflow_service.js";
import * as webhooksWebhookDeliveryWorkflowServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_delivery_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateSurveyWorkflowNotes keeps of each AdvanceSurveyWorkflow response. */
interface PropagateSurveyWorkflowNotesRecord {
  notes: string;
  status: string;
}

/** Where propagateSurveyWorkflowNotes hands each record. */
interface PropagateSurveyWorkflowNotesSink {
  apply(record: PropagateSurveyWorkflowNotesRecord): Promise<void>;
}

/** Writes records to acme.surveys.v1.SurveyApprovalService. */
class PropagateSurveyWorkflowNotesSurveyApproval implements PropagateSurveyWorkflowNotesSink {
  private readonly client: surveysSurveyApprovalServiceApi.SurveyApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysSurveyApprovalServiceApi.SurveyApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PropagateSurveyWorkflowNotesRecord): Promise<void> {
    await retry(() => call<surveysSurveyApprovalServiceApi.ApproveSurveyRequest, surveysSurveyApprovalServiceApi.ApproveSurveyResponse>(
      (request, done) => this.client.approveSurvey(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      surveysSurveyApprovalServiceApi.ApproveSurveyRequest.fromPartial({ details: { comment: record.notes, approverEmail: record.status } })));
  }
}

/** Sends records to acme.webhooks.v1.WebhookDeliveryWorkflowService. */
class PropagateSurveyWorkflowNotesWebhookDeliveryWorkflow implements PropagateSurveyWorkflowNotesSink {
  private readonly client: webhooksWebhookDeliveryWorkflowServiceApi.WebhookDeliveryWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookDeliveryWorkflowServiceApi.WebhookDeliveryWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PropagateSurveyWorkflowNotesRecord): Promise<void> {
    await retry(() => call<webhooksWebhookDeliveryWorkflowServiceApi.ResumeWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.ResumeWebhookDeliveryWorkflowResponse>(
      (request, done) => this.client.resumeWebhookDeliveryWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      webhooksWebhookDeliveryWorkflowServiceApi.ResumeWebhookDeliveryWorkflowRequest.fromPartial({ details: { step: record.notes }, webhookDelivery: { source: record.status } })));
  }
}

/** Only logs, for kinds no service takes yet. */
class PropagateSurveyWorkflowNotesLogOnly implements PropagateSurveyWorkflowNotesSink {
  async apply(record: PropagateSurveyWorkflowNotesRecord): Promise<void> {
    console.info("no sink for record", record.notes);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverPropagateSurveyWorkflowNotes(kind: string, record: PropagateSurveyWorkflowNotesRecord, runtime: Runtime): Promise<void> {
  let sink: PropagateSurveyWorkflowNotesSink = new PropagateSurveyWorkflowNotesLogOnly();
  switch (kind) {
    case "survey-approval":
      sink = new PropagateSurveyWorkflowNotesSurveyApproval(runtime);
      break;
    case "webhook-delivery-workflow":
      sink = new PropagateSurveyWorkflowNotesWebhookDeliveryWorkflow(runtime);
      break;
  }
  await sink.apply(record);
}

/**
 * Reads acme.surveys.v1.SurveyWorkflowService/AdvanceSurveyWorkflow and hands what it keeps to the sink of
 * its kind.
 */
export async function propagateSurveyWorkflowNotes(runtime: Runtime): Promise<void> {
  const source = new surveysSurveyWorkflowServiceApi.SurveyWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<surveysSurveyWorkflowServiceApi.AdvanceSurveyWorkflowRequest, surveysSurveyWorkflowServiceApi.AdvanceSurveyWorkflowResponse>(
    (request, done) => source.advanceSurveyWorkflow(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    surveysSurveyWorkflowServiceApi.AdvanceSurveyWorkflowRequest.fromPartial({ surveyId: "live-propagate-survey-workflow-notes" })));
  const entry: PropagateSurveyWorkflowNotesRecord = {
    notes: response.survey?.notes ?? "",
    status: response.result?.status ?? "",
  };
  await deliverPropagateSurveyWorkflowNotes("survey-approval", entry, runtime);
}
