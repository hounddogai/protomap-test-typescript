import * as audiencesAudienceValidationServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_validation_service.js";
import * as careplansCarePlanServiceApi from "../../../.cache/proto/acme/careplans/v1/care_plan_service.js";
import * as formsFormSubmissionValidationServiceApi from "../../../.cache/proto/acme/forms/v1/form_submission_validation_service.js";
import * as mediaRenditionWorkflowServiceApi from "../../../.cache/proto/acme/media/v1/rendition_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What pushAudienceName keeps of each NormalizeAudience response. */
interface PushAudienceNameRecord {
  name: string;
  status: string;
}

/** Where pushAudienceName hands each record. */
interface PushAudienceNameSink {
  apply(record: PushAudienceNameRecord): Promise<void>;
}

/** Writes records to acme.media.v1.RenditionWorkflowService. */
class PushAudienceNameRenditionWorkflow implements PushAudienceNameSink {
  private readonly client: mediaRenditionWorkflowServiceApi.RenditionWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaRenditionWorkflowServiceApi.RenditionWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PushAudienceNameRecord): Promise<void> {
    await call<mediaRenditionWorkflowServiceApi.InspectRenditionWorkflowRequest, mediaRenditionWorkflowServiceApi.InspectRenditionWorkflowResponse>(
      (request, done) => this.client.inspectRenditionWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      mediaRenditionWorkflowServiceApi.InspectRenditionWorkflowRequest.fromPartial({ renditionId: record.name }));
  }
}

/** Sends records to acme.forms.v1.FormSubmissionValidationService. */
class PushAudienceNameFormSubmissionValidation implements PushAudienceNameSink {
  private readonly client: formsFormSubmissionValidationServiceApi.FormSubmissionValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormSubmissionValidationServiceApi.FormSubmissionValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PushAudienceNameRecord): Promise<void> {
    await call<formsFormSubmissionValidationServiceApi.CheckFormSubmissionEligibilityRequest, formsFormSubmissionValidationServiceApi.CheckFormSubmissionEligibilityResponse>(
      (request, done) => this.client.checkFormSubmissionEligibility(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      formsFormSubmissionValidationServiceApi.CheckFormSubmissionEligibilityRequest.fromPartial({ formSubmission: { correlationId: record.name }, formSubmissionId: record.status }));
  }
}

/** Sends records to acme.careplans.v1.CarePlanService. */
class PushAudienceNameCarePlan implements PushAudienceNameSink {
  private readonly client: careplansCarePlanServiceApi.CarePlanServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new careplansCarePlanServiceApi.CarePlanServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PushAudienceNameRecord): Promise<void> {
    await call<careplansCarePlanServiceApi.CreateCarePlanRequest, careplansCarePlanServiceApi.CreateCarePlanResponse>(
      (request, done) => this.client.createCarePlan(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      careplansCarePlanServiceApi.CreateCarePlanRequest.fromPartial({ requestId: record.status, carePlan: { number: record.name } }));
  }
}

/** Runs the action registered for kind. */
async function actOnPushAudienceName(kind: string, record: PushAudienceNameRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "rendition-workflow": () => new PushAudienceNameRenditionWorkflow(runtime).apply(record),
    "form-submission-validation": () => new PushAudienceNameFormSubmissionValidation(runtime).apply(record),
    "care-plan": () => new PushAudienceNameCarePlan(runtime).apply(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.audiences.v1.AudienceValidationService/NormalizeAudience and hands what it keeps to the sink of
 * its kind.
 */
export async function pushAudienceName(runtime: Runtime): Promise<void> {
  const reader = new audiencesAudienceValidationServiceApi.AudienceValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<audiencesAudienceValidationServiceApi.NormalizeAudienceRequest, audiencesAudienceValidationServiceApi.NormalizeAudienceResponse>(
    (request, done) => reader.normalizeAudience(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    audiencesAudienceValidationServiceApi.NormalizeAudienceRequest.fromPartial({ audienceId: "live-push-audience-name" }));
  const record: PushAudienceNameRecord = {
    name: reply.audience?.name ?? "",
    status: reply.result?.status ?? "",
  };
  await actOnPushAudienceName("rendition-workflow", record, runtime);
}
