import * as contentArticleWorkflowServiceApi from "../../../.cache/proto/acme/content/v1/article_workflow_service.js";
import * as formsFormSubmissionWorkflowServiceApi from "../../../.cache/proto/acme/forms/v1/form_submission_workflow_service.js";
import * as localizationTranslationKeyApprovalServiceApi from "../../../.cache/proto/acme/localization/v1/translation_key_approval_service.js";
import * as mediaRenditionLifecycleServiceApi from "../../../.cache/proto/acme/media/v1/rendition_lifecycle_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryRenditionMessage keeps of each ReinstateRendition response. */
interface CarryRenditionMessageRecord {
  message: string;
  referenceId: string;
  status: string;
}

/** Where carryRenditionMessage hands each record. */
interface CarryRenditionMessageDestination {
  deliver(record: CarryRenditionMessageRecord): Promise<void>;
}

/** Writes records to acme.forms.v1.FormSubmissionWorkflowService. */
class CarryRenditionMessageFormSubmissionWorkflow implements CarryRenditionMessageDestination {
  private readonly client: formsFormSubmissionWorkflowServiceApi.FormSubmissionWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormSubmissionWorkflowServiceApi.FormSubmissionWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CarryRenditionMessageRecord): Promise<void> {
    await call<formsFormSubmissionWorkflowServiceApi.InspectFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.InspectFormSubmissionWorkflowResponse>(
      (request, done) => this.client.inspectFormSubmissionWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      formsFormSubmissionWorkflowServiceApi.InspectFormSubmissionWorkflowRequest.fromPartial({ formSubmissionId: record.referenceId }));
  }
}

/** Sends records to acme.content.v1.ArticleWorkflowService. */
class CarryRenditionMessageArticleWorkflow implements CarryRenditionMessageDestination {
  private readonly client: contentArticleWorkflowServiceApi.ArticleWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentArticleWorkflowServiceApi.ArticleWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CarryRenditionMessageRecord): Promise<void> {
    await retry(() => call<contentArticleWorkflowServiceApi.CancelArticleWorkflowRequest, contentArticleWorkflowServiceApi.CancelArticleWorkflowResponse>(
      (request, done) => this.client.cancelArticleWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      contentArticleWorkflowServiceApi.CancelArticleWorkflowRequest.fromPartial({ details: { initiatedBy: record.status } })));
  }
}

/** Writes records to acme.localization.v1.TranslationKeyApprovalService. */
class CarryRenditionMessageTranslationKeyApproval implements CarryRenditionMessageDestination {
  private readonly client: localizationTranslationKeyApprovalServiceApi.TranslationKeyApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationTranslationKeyApprovalServiceApi.TranslationKeyApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CarryRenditionMessageRecord): Promise<void> {
    await retry(() => call<localizationTranslationKeyApprovalServiceApi.SubmitTranslationKeyRequest, localizationTranslationKeyApprovalServiceApi.SubmitTranslationKeyResponse>(
      (request, done) => this.client.submitTranslationKey(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      localizationTranslationKeyApprovalServiceApi.SubmitTranslationKeyRequest.fromPartial({ details: { comment: record.message } })));
  }
}

/**
 * Reads acme.media.v1.RenditionLifecycleService/ReinstateRendition and hands what it keeps to the sink of its
 * kind.
 */
export async function carryRenditionMessage(runtime: Runtime): Promise<void> {
  const source = new mediaRenditionLifecycleServiceApi.RenditionLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<mediaRenditionLifecycleServiceApi.ReinstateRenditionRequest, mediaRenditionLifecycleServiceApi.ReinstateRenditionResponse>(
    (request, done) => source.reinstateRendition(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    mediaRenditionLifecycleServiceApi.ReinstateRenditionRequest.fromPartial({ reason: "primary-carry-rendition-message" })));
  const row: CarryRenditionMessageRecord = {
    message: found.result?.message ?? "",
    referenceId: text.normalize(found.outcome?.referenceId ?? ""),
    status: found.outcome?.status ?? "",
  };
  const sinks: CarryRenditionMessageDestination[] = [
    new CarryRenditionMessageFormSubmissionWorkflow(runtime),
    new CarryRenditionMessageArticleWorkflow(runtime),
    new CarryRenditionMessageTranslationKeyApproval(runtime),
  ];
  for (const sink of sinks) {
    await sink.deliver(row);
  }
}
