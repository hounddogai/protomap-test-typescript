import * as communityForumApprovalServiceApi from "../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as labelingLabelingTaskQueryServiceApi from "../../../.cache/proto/acme/labeling/v1/labeling_task_query_service.js";
import * as localizationTranslationKeyWorkflowServiceApi from "../../../.cache/proto/acme/localization/v1/translation_key_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relayLabelingTasksUri keeps of each SummarizeLabelingTasks response. */
interface RelayLabelingTasksUriRecord {
  downloadUri: string;
  message: string;
  status: string;
  correlationId: string;
}

/** Where relayLabelingTasksUri hands each record. */
interface RelayLabelingTasksUriDestination {
  forward(record: RelayLabelingTasksUriRecord): Promise<void>;
}

/** Sends records to acme.localization.v1.TranslationKeyWorkflowService. */
class RelayLabelingTasksUriTranslationKeyWorkflow implements RelayLabelingTasksUriDestination {
  private readonly client: localizationTranslationKeyWorkflowServiceApi.TranslationKeyWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationTranslationKeyWorkflowServiceApi.TranslationKeyWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: RelayLabelingTasksUriRecord): Promise<void> {
    await retry(() => call<localizationTranslationKeyWorkflowServiceApi.RetryTranslationKeyWorkflowRequest, localizationTranslationKeyWorkflowServiceApi.RetryTranslationKeyWorkflowResponse>(
      (request, done) => this.client.retryTranslationKeyWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      localizationTranslationKeyWorkflowServiceApi.RetryTranslationKeyWorkflowRequest.fromPartial({ translationKey: { code: record.downloadUri } })));
  }
}

/** Writes records to acme.community.v1.ForumApprovalService. */
class RelayLabelingTasksUriForumApproval implements RelayLabelingTasksUriDestination {
  private readonly client: communityForumApprovalServiceApi.ForumApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityForumApprovalServiceApi.ForumApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: RelayLabelingTasksUriRecord): Promise<void> {
    await call<communityForumApprovalServiceApi.GetForumApprovalStatusRequest, communityForumApprovalServiceApi.GetForumApprovalStatusResponse>(
      (request, done) => this.client.getForumApprovalStatus(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      communityForumApprovalServiceApi.GetForumApprovalStatusRequest.fromPartial({ forumId: record.status }));
  }
}

/**
 * Reads acme.labeling.v1.LabelingTaskQueryService/SummarizeLabelingTasks and hands what it keeps to the sink
 * of its kind.
 */
export async function relayLabelingTasksUri(runtime: Runtime): Promise<void> {
  const upstream = new labelingLabelingTaskQueryServiceApi.LabelingTaskQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<labelingLabelingTaskQueryServiceApi.SummarizeLabelingTasksRequest, labelingLabelingTaskQueryServiceApi.SummarizeLabelingTasksResponse>(
    (request, done) => upstream.summarizeLabelingTasks(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    labelingLabelingTaskQueryServiceApi.SummarizeLabelingTasksRequest.fromPartial({ labelingTaskId: "default-relay-labeling-tasks-uri" }));
  const record: RelayLabelingTasksUriRecord = {
    downloadUri: text.normalize(reply.downloadUri),
    message: reply.result?.message ?? "",
    status: text.normalize(reply.result?.status ?? ""),
    correlationId: reply.result?.correlationId ?? "",
  };
  const sinks: RelayLabelingTasksUriDestination[] = [
    new RelayLabelingTasksUriTranslationKeyWorkflow(runtime),
    new RelayLabelingTasksUriForumApproval(runtime),
  ];
  for (const sink of sinks) {
    await sink.forward(record);
  }
}
