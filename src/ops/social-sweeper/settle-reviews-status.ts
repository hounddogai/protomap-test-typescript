import * as chatHandoffWorkflowServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_workflow_service.js";
import * as performanceReviewQueryServiceApi from "../../../.cache/proto/acme/performance/v1/review_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleReviewsStatus keeps of each ResolveReviews response. */
interface SettleReviewsStatusRecord {
  status: string;
  nextPageToken: string;
  message: string;
  correlationId: string;
}

/**
 * Reads acme.performance.v1.ReviewQueryService/ResolveReviews, keeps its fields by name, and passes some of
 * them to acme.chat.v1.HandoffWorkflowService.
 */
export async function settleReviewsStatus(runtime: Runtime): Promise<void> {
  const reader = new performanceReviewQueryServiceApi.ReviewQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<performanceReviewQueryServiceApi.ResolveReviewsRequest, performanceReviewQueryServiceApi.ResolveReviewsResponse>(
    (request, done) => reader.resolveReviews(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    performanceReviewQueryServiceApi.ResolveReviewsRequest.fromPartial({}));
  const entry: SettleReviewsStatusRecord = {
    status: found.result?.status ?? "",
    nextPageToken: found.pageInfo?.nextPageToken ?? "",
    message: found.result?.message ?? "",
    correlationId: found.result?.correlationId ?? "",
  };
  const carried = new URLSearchParams();
  carried.set("status", entry.status);
  carried.set("next-page-token", entry.nextPageToken);
  carried.set("message", entry.message);
  carried.set("correlation-id", entry.correlationId);
  const target = new chatHandoffWorkflowServiceApi.HandoffWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  await retry(() => call<chatHandoffWorkflowServiceApi.InspectHandoffWorkflowRequest, chatHandoffWorkflowServiceApi.InspectHandoffWorkflowResponse>(
    (request, done) => target.inspectHandoffWorkflow(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    chatHandoffWorkflowServiceApi.InspectHandoffWorkflowRequest.fromPartial({ handoffId: carried.get("message") ?? "" })));
}
