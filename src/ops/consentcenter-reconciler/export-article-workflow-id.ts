import * as communityForumValidationServiceApi from "../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as contentArticleWorkflowServiceApi from "../../../.cache/proto/acme/content/v1/article_workflow_service.js";
import * as experimentsExperimentValidationServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import * as localizationLocaleWorkflowServiceApi from "../../../.cache/proto/acme/localization/v1/locale_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportArticleWorkflowId keeps of each StartArticleWorkflow response. */
interface ExportArticleWorkflowIdRecord {
  referenceId: string;
  status: string;
  outcomeStatus: string;
  message: string;
}

/** Where exportArticleWorkflowId hands each record. */
interface ExportArticleWorkflowIdSink {
  deliver(record: ExportArticleWorkflowIdRecord): Promise<void>;
}

/** Writes records to acme.localization.v1.LocaleWorkflowService. */
class ExportArticleWorkflowIdLocaleWorkflow implements ExportArticleWorkflowIdSink {
  private readonly client: localizationLocaleWorkflowServiceApi.LocaleWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationLocaleWorkflowServiceApi.LocaleWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ExportArticleWorkflowIdRecord): Promise<void> {
    await retry(() => call<localizationLocaleWorkflowServiceApi.RetryLocaleWorkflowRequest, localizationLocaleWorkflowServiceApi.RetryLocaleWorkflowResponse>(
      (request, done) => this.client.retryLocaleWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      localizationLocaleWorkflowServiceApi.RetryLocaleWorkflowRequest.fromPartial({ locale: { description: record.status } })));
  }
}

/** Writes records to acme.experiments.v1.ExperimentValidationService. */
class ExportArticleWorkflowIdExperimentValidation implements ExportArticleWorkflowIdSink {
  private readonly client: experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ExportArticleWorkflowIdRecord): Promise<void> {
    await call<experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest, experimentsExperimentValidationServiceApi.CheckExperimentEligibilityResponse>(
      (request, done) => this.client.checkExperimentEligibility(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest.fromPartial({ details: { locale: record.status }, experiment: { title: record.referenceId, experimentId: record.message } }));
  }
}

/** Hands records to acme.community.v1.ForumValidationService. */
class ExportArticleWorkflowIdForumValidation implements ExportArticleWorkflowIdSink {
  private readonly client: communityForumValidationServiceApi.ForumValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityForumValidationServiceApi.ForumValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ExportArticleWorkflowIdRecord): Promise<void> {
    await call<communityForumValidationServiceApi.PreviewForumRequest, communityForumValidationServiceApi.PreviewForumResponse>(
      (request, done) => this.client.previewForum(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      communityForumValidationServiceApi.PreviewForumRequest.fromPartial({ reason: record.referenceId, details: { locale: record.outcomeStatus }, forum: { parentId: record.status } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class ExportArticleWorkflowIdLogOnly implements ExportArticleWorkflowIdSink {
  async deliver(record: ExportArticleWorkflowIdRecord): Promise<void> {
    console.info("no sink for record", record.referenceId);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverExportArticleWorkflowId(kind: string, record: ExportArticleWorkflowIdRecord, runtime: Runtime): Promise<void> {
  let sink: ExportArticleWorkflowIdSink = new ExportArticleWorkflowIdLogOnly();
  switch (kind) {
    case "locale-workflow":
      sink = new ExportArticleWorkflowIdLocaleWorkflow(runtime);
      break;
    case "experiment-validation":
      sink = new ExportArticleWorkflowIdExperimentValidation(runtime);
      break;
    case "forum-validation":
      sink = new ExportArticleWorkflowIdForumValidation(runtime);
      break;
  }
  await sink.deliver(record);
}

/**
 * Reads acme.content.v1.ArticleWorkflowService/StartArticleWorkflow and hands what it keeps to the sink of
 * its kind.
 */
export async function exportArticleWorkflowId(runtime: Runtime): Promise<void> {
  const upstream = new contentArticleWorkflowServiceApi.ArticleWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<contentArticleWorkflowServiceApi.StartArticleWorkflowRequest, contentArticleWorkflowServiceApi.StartArticleWorkflowResponse>(
    (request, done) => upstream.startArticleWorkflow(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    contentArticleWorkflowServiceApi.StartArticleWorkflowRequest.fromPartial({ articleId: "current-export-article-workflow-id" }));
  const kept: ExportArticleWorkflowIdRecord = {
    referenceId: text.normalize(found.outcome?.referenceId ?? ""),
    status: found.result?.status ?? "",
    outcomeStatus: found.outcome?.status ?? "",
    message: found.result?.message ?? "",
  };
  await deliverExportArticleWorkflowId("locale-workflow", kept, runtime);
}
