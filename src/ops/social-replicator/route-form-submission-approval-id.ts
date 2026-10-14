import * as datasetsDatasetServiceApi from "../../../.cache/proto/acme/datasets/v1/dataset_service.js";
import * as formsFormSubmissionApprovalServiceApi from "../../../.cache/proto/acme/forms/v1/form_submission_approval_service.js";
import * as mediaTranscodeJobApprovalServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_approval_service.js";
import * as webhooksWebhookDeliveryApprovalServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_delivery_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What routeFormSubmissionApprovalId keeps of each CommentFormSubmissionApproval response. */
interface RouteFormSubmissionApprovalIdRecord {
  correlationId: string;
  formSubmissionId: string;
  message: string;
  kind: string;
}

/** Where routeFormSubmissionApprovalId hands each record. */
interface RouteFormSubmissionApprovalIdDestination {
  deliver(record: RouteFormSubmissionApprovalIdRecord): Promise<void>;
}

/** Sends records to acme.media.v1.TranscodeJobApprovalService. */
class RouteFormSubmissionApprovalIdTranscodeJobApproval implements RouteFormSubmissionApprovalIdDestination {
  private readonly client: mediaTranscodeJobApprovalServiceApi.TranscodeJobApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaTranscodeJobApprovalServiceApi.TranscodeJobApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: RouteFormSubmissionApprovalIdRecord): Promise<void> {
    await call<mediaTranscodeJobApprovalServiceApi.ListPendingTranscodeJobsRequest, mediaTranscodeJobApprovalServiceApi.ListPendingTranscodeJobsResponse>(
      (request, done) => this.client.listPendingTranscodeJobs(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      mediaTranscodeJobApprovalServiceApi.ListPendingTranscodeJobsRequest.fromPartial({ filter: { query: record.kind } }));
  }
}

/** Sends records to acme.datasets.v1.DatasetService. */
class RouteFormSubmissionApprovalIdDataset implements RouteFormSubmissionApprovalIdDestination {
  private readonly client: datasetsDatasetServiceApi.DatasetServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new datasetsDatasetServiceApi.DatasetServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: RouteFormSubmissionApprovalIdRecord): Promise<void> {
    await call<datasetsDatasetServiceApi.CreateDatasetRequest, datasetsDatasetServiceApi.CreateDatasetResponse>(
      (request, done) => this.client.createDataset(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      datasetsDatasetServiceApi.CreateDatasetRequest.fromPartial({ dataset: { name: record.correlationId, code: record.formSubmissionId, datasetId: record.kind } }));
  }
}

/** Sends records to acme.webhooks.v1.WebhookDeliveryApprovalService. */
class RouteFormSubmissionApprovalIdWebhookDeliveryApproval implements RouteFormSubmissionApprovalIdDestination {
  private readonly client: webhooksWebhookDeliveryApprovalServiceApi.WebhookDeliveryApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookDeliveryApprovalServiceApi.WebhookDeliveryApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: RouteFormSubmissionApprovalIdRecord): Promise<void> {
    await call<webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryRequest, webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryResponse>(
      (request, done) => this.client.rejectWebhookDelivery(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryRequest.fromPartial({ webhookDelivery: { webhookDeliveryId: record.kind }, details: { approverEmail: record.formSubmissionId } }));
  }
}

/**
 * Reads acme.forms.v1.FormSubmissionApprovalService/CommentFormSubmissionApproval and hands what it keeps to
 * the sink of its kind.
 */
export async function routeFormSubmissionApprovalId(runtime: Runtime): Promise<void> {
  const source = new formsFormSubmissionApprovalServiceApi.FormSubmissionApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<formsFormSubmissionApprovalServiceApi.CommentFormSubmissionApprovalRequest, formsFormSubmissionApprovalServiceApi.CommentFormSubmissionApprovalResponse>(
    (request, done) => source.commentFormSubmissionApproval(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    formsFormSubmissionApprovalServiceApi.CommentFormSubmissionApprovalRequest.fromPartial({ formSubmissionId: "nightly-route-form-submission-approval-id" }));
  const entry: RouteFormSubmissionApprovalIdRecord = {
    correlationId: current.formSubmission?.correlationId ?? "",
    formSubmissionId: text.normalize(current.formSubmission?.formSubmissionId ?? ""),
    message: current.outcome?.message ?? "",
    kind: current.formSubmission?.kind ?? "",
  };
  const registry: Record<string, RouteFormSubmissionApprovalIdDestination> = {};
  for (const entry of [
    { kind: "transcode-job-approval", sink: new RouteFormSubmissionApprovalIdTranscodeJobApproval(runtime) },
    { kind: "dataset", sink: new RouteFormSubmissionApprovalIdDataset(runtime) },
    { kind: "webhook-delivery-approval", sink: new RouteFormSubmissionApprovalIdWebhookDeliveryApproval(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["dataset"]!.deliver(entry);
}
