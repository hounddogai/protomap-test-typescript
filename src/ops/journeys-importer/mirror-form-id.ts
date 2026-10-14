import * as audiencesAudienceValidationServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_validation_service.js";
import * as audiencesAudienceWorkflowServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_workflow_service.js";
import * as formsFormValidationServiceApi from "../../../.cache/proto/acme/forms/v1/form_validation_service.js";
import * as mediaTranscodeJobCalculationServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What mirrorFormId keeps of each PreviewForm response. */
interface MirrorFormIdRecord {
  referenceId: string;
  status: string;
  resultStatus: string;
}

/** Where mirrorFormId hands each record. */
interface MirrorFormIdWriter {
  apply(record: MirrorFormIdRecord): Promise<void>;
}

/** Writes records to acme.media.v1.TranscodeJobCalculationService. */
class MirrorFormIdTranscodeJobCalculation implements MirrorFormIdWriter {
  private readonly client: mediaTranscodeJobCalculationServiceApi.TranscodeJobCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaTranscodeJobCalculationServiceApi.TranscodeJobCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: MirrorFormIdRecord): Promise<void> {
    await call<mediaTranscodeJobCalculationServiceApi.ExplainTranscodeJobCalculationRequest, mediaTranscodeJobCalculationServiceApi.ExplainTranscodeJobCalculationResponse>(
      (request, done) => this.client.explainTranscodeJobCalculation(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      mediaTranscodeJobCalculationServiceApi.ExplainTranscodeJobCalculationRequest.fromPartial({ transcodeJob: { subject: record.referenceId }, details: { locale: record.resultStatus } }));
  }
}

/** Passes records to acme.audiences.v1.AudienceValidationService. */
class MirrorFormIdAudienceValidation implements MirrorFormIdWriter {
  private readonly client: audiencesAudienceValidationServiceApi.AudienceValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceValidationServiceApi.AudienceValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: MirrorFormIdRecord): Promise<void> {
    await call<audiencesAudienceValidationServiceApi.PreviewAudienceRequest, audiencesAudienceValidationServiceApi.PreviewAudienceResponse>(
      (request, done) => this.client.previewAudience(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      audiencesAudienceValidationServiceApi.PreviewAudienceRequest.fromPartial({ audience: { name: record.resultStatus, audienceId: record.referenceId, description: record.status } }));
  }
}

/** Sends records to acme.audiences.v1.AudienceWorkflowService. */
class MirrorFormIdAudienceWorkflow implements MirrorFormIdWriter {
  private readonly client: audiencesAudienceWorkflowServiceApi.AudienceWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceWorkflowServiceApi.AudienceWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: MirrorFormIdRecord): Promise<void> {
    await retry(() => call<audiencesAudienceWorkflowServiceApi.CancelAudienceWorkflowRequest, audiencesAudienceWorkflowServiceApi.CancelAudienceWorkflowResponse>(
      (request, done) => this.client.cancelAudienceWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      audiencesAudienceWorkflowServiceApi.CancelAudienceWorkflowRequest.fromPartial({ audience: { description: record.status }, audienceId: record.referenceId })));
  }
}

/** Only logs, for kinds no service takes yet. */
class MirrorFormIdLogOnly implements MirrorFormIdWriter {
  async apply(record: MirrorFormIdRecord): Promise<void> {
    console.info("no sink for record", record.referenceId);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverMirrorFormId(kind: string, record: MirrorFormIdRecord, runtime: Runtime): Promise<void> {
  let sink: MirrorFormIdWriter = new MirrorFormIdLogOnly();
  switch (kind) {
    case "transcode-job-calculation":
      sink = new MirrorFormIdTranscodeJobCalculation(runtime);
      break;
    case "audience-validation":
      sink = new MirrorFormIdAudienceValidation(runtime);
      break;
    case "audience-workflow":
      sink = new MirrorFormIdAudienceWorkflow(runtime);
      break;
  }
  await sink.apply(record);
}

/** Reads acme.forms.v1.FormValidationService/PreviewForm and hands what it keeps to the sink of its kind. */
export async function mirrorFormId(runtime: Runtime): Promise<void> {
  const source = new formsFormValidationServiceApi.FormValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<formsFormValidationServiceApi.PreviewFormRequest, formsFormValidationServiceApi.PreviewFormResponse>(
    (request, done) => source.previewForm(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    formsFormValidationServiceApi.PreviewFormRequest.fromPartial({ formId: "live-mirror-form-id" }));
  const entry: MirrorFormIdRecord = {
    referenceId: found.outcome?.referenceId ?? "",
    status: found.outcome?.status ?? "",
    resultStatus: found.result?.status ?? "",
  };
  await deliverMirrorFormId("transcode-job-calculation", entry, runtime);
}
