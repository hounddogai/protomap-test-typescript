import * as audiencesAudienceSyncWorkflowServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_sync_workflow_service.js";
import * as communityPostApprovalServiceApi from "../../../.cache/proto/acme/community/v1/post_approval_service.js";
import * as notificationsSubscriptionWorkflowServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replayPostStatus keeps of each SubmitPost response. */
interface ReplayPostStatusRecord {
  status: string;
  message: string;
}

/** Where replayPostStatus hands each record. */
interface ReplayPostStatusDestination {
  write(record: ReplayPostStatusRecord): Promise<void>;
}

/** Hands records to acme.audiences.v1.AudienceSyncWorkflowService. */
class ReplayPostStatusAudienceSyncWorkflow implements ReplayPostStatusDestination {
  private readonly client: audiencesAudienceSyncWorkflowServiceApi.AudienceSyncWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceSyncWorkflowServiceApi.AudienceSyncWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ReplayPostStatusRecord): Promise<void> {
    await call<audiencesAudienceSyncWorkflowServiceApi.AdvanceAudienceSyncWorkflowRequest, audiencesAudienceSyncWorkflowServiceApi.AdvanceAudienceSyncWorkflowResponse>(
      (request, done) => this.client.advanceAudienceSyncWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      audiencesAudienceSyncWorkflowServiceApi.AdvanceAudienceSyncWorkflowRequest.fromPartial({ audienceSync: { kind: record.status, audienceSyncId: record.message } }));
  }
}

/** Hands records to acme.notifications.v1.SubscriptionWorkflowService. */
class ReplayPostStatusSubscriptionWorkflow implements ReplayPostStatusDestination {
  private readonly client: notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ReplayPostStatusRecord): Promise<void> {
    await call<notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowResponse>(
      (request, done) => this.client.retrySubscriptionWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowRequest.fromPartial({ details: { step: record.status }, subscriptionId: record.message }));
  }
}

/** Only logs, for kinds no service takes yet. */
class ReplayPostStatusLogOnly implements ReplayPostStatusDestination {
  async write(record: ReplayPostStatusRecord): Promise<void> {
    console.info("no sink for record", record.status);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverReplayPostStatus(kind: string, record: ReplayPostStatusRecord, runtime: Runtime): Promise<void> {
  let sink: ReplayPostStatusDestination = new ReplayPostStatusLogOnly();
  switch (kind) {
    case "audience-sync-workflow":
      sink = new ReplayPostStatusAudienceSyncWorkflow(runtime);
      break;
    case "subscription-workflow":
      sink = new ReplayPostStatusSubscriptionWorkflow(runtime);
      break;
  }
  await sink.write(record);
}

/** Reads acme.community.v1.PostApprovalService/SubmitPost and hands what it keeps to the sink of its kind. */
export async function replayPostStatus(runtime: Runtime): Promise<void> {
  const source = new communityPostApprovalServiceApi.PostApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<communityPostApprovalServiceApi.SubmitPostRequest, communityPostApprovalServiceApi.SubmitPostResponse>(
    (request, done) => source.submitPost(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    communityPostApprovalServiceApi.SubmitPostRequest.fromPartial({ postId: "main-replay-post-status" })));
  const row: ReplayPostStatusRecord = {
    status: current.result?.status ?? "",
    message: current.result?.message ?? "",
  };
  await deliverReplayPostStatus("subscription-workflow", row, runtime);
}
