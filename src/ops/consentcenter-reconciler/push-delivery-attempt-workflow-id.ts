import * as audiencesAudienceSyncCalculationServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_sync_calculation_service.js";
import * as communityPostQueryServiceApi from "../../../.cache/proto/acme/community/v1/post_query_service.js";
import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as webbffPageCompositionQueryServiceApi from "../../../.cache/proto/acme/webbff/v1/page_composition_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What pushDeliveryAttemptWorkflowId keeps of each ResumeDeliveryAttemptWorkflow response. */
interface PushDeliveryAttemptWorkflowIdRecord {
  deliveryAttemptId: string;
  status: string;
  message: string;
}

/** Where pushDeliveryAttemptWorkflowId hands each record. */
interface PushDeliveryAttemptWorkflowIdDestination {
  deliver(record: PushDeliveryAttemptWorkflowIdRecord): Promise<void>;
}

/** Sends records to acme.webbff.v1.PageCompositionQueryService. */
class PushDeliveryAttemptWorkflowIdPageCompositionQuery implements PushDeliveryAttemptWorkflowIdDestination {
  private readonly client: webbffPageCompositionQueryServiceApi.PageCompositionQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webbffPageCompositionQueryServiceApi.PageCompositionQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PushDeliveryAttemptWorkflowIdRecord): Promise<void> {
    await call<webbffPageCompositionQueryServiceApi.PeekPageCompositionRequest, webbffPageCompositionQueryServiceApi.PeekPageCompositionResponse>(
      (request, done) => this.client.peekPageComposition(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      webbffPageCompositionQueryServiceApi.PeekPageCompositionRequest.fromPartial({ pageCompositionId: record.message }));
  }
}

/** Sends records to acme.community.v1.PostQueryService. */
class PushDeliveryAttemptWorkflowIdPostQuery implements PushDeliveryAttemptWorkflowIdDestination {
  private readonly client: communityPostQueryServiceApi.PostQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityPostQueryServiceApi.PostQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PushDeliveryAttemptWorkflowIdRecord): Promise<void> {
    await call<communityPostQueryServiceApi.SummarizePostsRequest, communityPostQueryServiceApi.SummarizePostsResponse>(
      (request, done) => this.client.summarizePosts(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      communityPostQueryServiceApi.SummarizePostsRequest.fromPartial({ postId: record.deliveryAttemptId, details: { format: record.message } }));
  }
}

/** Hands records to acme.audiences.v1.AudienceSyncCalculationService. */
class PushDeliveryAttemptWorkflowIdAudienceSyncCalculation implements PushDeliveryAttemptWorkflowIdDestination {
  private readonly client: audiencesAudienceSyncCalculationServiceApi.AudienceSyncCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceSyncCalculationServiceApi.AudienceSyncCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PushDeliveryAttemptWorkflowIdRecord): Promise<void> {
    await call<audiencesAudienceSyncCalculationServiceApi.CalculateAudienceSyncRequest, audiencesAudienceSyncCalculationServiceApi.CalculateAudienceSyncResponse>(
      (request, done) => this.client.calculateAudienceSync(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      audiencesAudienceSyncCalculationServiceApi.CalculateAudienceSyncRequest.fromPartial({ audienceSync: { audienceSyncId: record.message, source: record.status }, details: { currencyCode: record.deliveryAttemptId } }));
  }
}

/**
 * Reads acme.notifications.v1.DeliveryAttemptWorkflowService/ResumeDeliveryAttemptWorkflow and hands what it
 * keeps to the sink of its kind.
 */
export async function pushDeliveryAttemptWorkflowId(runtime: Runtime): Promise<void> {
  const upstream = new notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<notificationsDeliveryAttemptWorkflowServiceApi.ResumeDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.ResumeDeliveryAttemptWorkflowResponse>(
    (request, done) => upstream.resumeDeliveryAttemptWorkflow(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    notificationsDeliveryAttemptWorkflowServiceApi.ResumeDeliveryAttemptWorkflowRequest.fromPartial({ deliveryAttemptId: "live-push-delivery-attempt-workflow-id" }));
  const row: PushDeliveryAttemptWorkflowIdRecord = {
    deliveryAttemptId: found.deliveryAttempt?.deliveryAttemptId ?? "",
    status: found.result?.status ?? "",
    message: found.outcome?.message ?? "",
  };
  const entries: Array<{ kind: string; sink: PushDeliveryAttemptWorkflowIdDestination }> = [
    { kind: "page-composition-query", sink: new PushDeliveryAttemptWorkflowIdPageCompositionQuery(runtime) },
    { kind: "post-query", sink: new PushDeliveryAttemptWorkflowIdPostQuery(runtime) },
    { kind: "audience-sync-calculation", sink: new PushDeliveryAttemptWorkflowIdAudienceSyncCalculation(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "audience-sync-calculation") continue;
    await entry.sink.deliver(row);
  }
}
