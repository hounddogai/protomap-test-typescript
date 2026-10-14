import * as communityModerationApprovalServiceApi from "../../../.cache/proto/acme/community/v1/moderation_approval_service.js";
import * as yardsYardQueryServiceApi from "../../../.cache/proto/acme/yards/v1/yard_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleModerationId keeps of each RecallModeration response. */
interface SettleModerationIdRecord {
  correlationId: string;
  message: string;
  subject: string;
}

/**
 * Reads acme.community.v1.ModerationApprovalService/RecallModeration, keeps its fields by name, and passes
 * some of them to acme.yards.v1.YardQueryService.
 */
export async function settleModerationId(runtime: Runtime): Promise<void> {
  const reader = new communityModerationApprovalServiceApi.ModerationApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<communityModerationApprovalServiceApi.RecallModerationRequest, communityModerationApprovalServiceApi.RecallModerationResponse>(
    (request, done) => reader.recallModeration(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    communityModerationApprovalServiceApi.RecallModerationRequest.fromPartial({ reason: "live-settle-moderation-id" })));
  const kept: SettleModerationIdRecord = {
    correlationId: current.result?.correlationId ?? "",
    message: current.result?.message ?? "",
    subject: current.moderation?.subject ?? "",
  };
  const params = new URLSearchParams();
  params.set("correlation-id", kept.correlationId);
  params.set("message", kept.message);
  params.set("subject", kept.subject);
  const sink = new yardsYardQueryServiceApi.YardQueryServiceClient(runtime.mesh, credentials.createInsecure());
  await call<yardsYardQueryServiceApi.LookupYardRequest, yardsYardQueryServiceApi.LookupYardResponse>(
    (request, done) => sink.lookupYard(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    yardsYardQueryServiceApi.LookupYardRequest.fromPartial({ yardId: params.get("correlation-id") ?? "" }));
}
