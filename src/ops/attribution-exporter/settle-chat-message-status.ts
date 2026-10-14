import * as communityForumWorkflowServiceApi from "../../../.cache/proto/acme/community/v1/forum_workflow_service.js";
import * as mediaTranscodeJobWorkflowServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_workflow_service.js";
import * as messagingChatMessageLifecycleServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_lifecycle_service.js";
import * as pipelinesPipelineServiceApi from "../../../.cache/proto/acme/pipelines/v1/pipeline_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleChatMessageStatus keeps of each ExpireChatMessage response. */
interface SettleChatMessageStatusRecord {
  status: string;
  correlationId: string;
}

/** Where settleChatMessageStatus hands each record. */
interface SettleChatMessageStatusTarget {
  push(record: SettleChatMessageStatusRecord): Promise<void>;
}

/** Sends records to acme.media.v1.TranscodeJobWorkflowService. */
class SettleChatMessageStatusTranscodeJobWorkflow implements SettleChatMessageStatusTarget {
  private readonly client: mediaTranscodeJobWorkflowServiceApi.TranscodeJobWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaTranscodeJobWorkflowServiceApi.TranscodeJobWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: SettleChatMessageStatusRecord): Promise<void> {
    await call<mediaTranscodeJobWorkflowServiceApi.RetryTranscodeJobWorkflowRequest, mediaTranscodeJobWorkflowServiceApi.RetryTranscodeJobWorkflowResponse>(
      (request, done) => this.client.retryTranscodeJobWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      mediaTranscodeJobWorkflowServiceApi.RetryTranscodeJobWorkflowRequest.fromPartial({ transcodeJob: { subject: record.status } }));
  }
}

/** Passes records to acme.community.v1.ForumWorkflowService. */
class SettleChatMessageStatusForumWorkflow implements SettleChatMessageStatusTarget {
  private readonly client: communityForumWorkflowServiceApi.ForumWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityForumWorkflowServiceApi.ForumWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: SettleChatMessageStatusRecord): Promise<void> {
    await call<communityForumWorkflowServiceApi.ResumeForumWorkflowRequest, communityForumWorkflowServiceApi.ResumeForumWorkflowResponse>(
      (request, done) => this.client.resumeForumWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      communityForumWorkflowServiceApi.ResumeForumWorkflowRequest.fromPartial({ reason: record.status, details: { initiatedBy: record.correlationId } }));
  }
}

/** Sends records to acme.pipelines.v1.PipelineService. */
class SettleChatMessageStatusPipeline implements SettleChatMessageStatusTarget {
  private readonly client: pipelinesPipelineServiceApi.PipelineServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new pipelinesPipelineServiceApi.PipelineServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: SettleChatMessageStatusRecord): Promise<void> {
    await call<pipelinesPipelineServiceApi.ClonePipelineRequest, pipelinesPipelineServiceApi.ClonePipelineResponse>(
      (request, done) => this.client.clonePipeline(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      pipelinesPipelineServiceApi.ClonePipelineRequest.fromPartial({ pipeline: { title: record.correlationId }, requestId: record.status }));
  }
}

/**
 * Reads acme.messaging.v1.ChatMessageLifecycleService/ExpireChatMessage and hands what it keeps to the sink
 * of its kind.
 */
export async function settleChatMessageStatus(runtime: Runtime): Promise<void> {
  const source = new messagingChatMessageLifecycleServiceApi.ChatMessageLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<messagingChatMessageLifecycleServiceApi.ExpireChatMessageRequest, messagingChatMessageLifecycleServiceApi.ExpireChatMessageResponse>(
    (request, done) => source.expireChatMessage(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    messagingChatMessageLifecycleServiceApi.ExpireChatMessageRequest.fromPartial({ reason: "default-settle-chat-message-status" })));
  const row: SettleChatMessageStatusRecord = {
    status: text.normalize(response.result?.status ?? ""),
    correlationId: response.result?.correlationId ?? "",
  };
  const sinks: SettleChatMessageStatusTarget[] = [
    new SettleChatMessageStatusTranscodeJobWorkflow(runtime),
    new SettleChatMessageStatusForumWorkflow(runtime),
    new SettleChatMessageStatusPipeline(runtime),
  ];
  await sinks[0]!.push(row);
}
