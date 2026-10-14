import * as communityForumWorkflowServiceApi from "../../../.cache/proto/acme/community/v1/forum_workflow_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillForumWorkflowStatus keeps of each AdvanceForumWorkflow response. */
interface BackfillForumWorkflowStatusRecord {
  status: string;
  name: string;
  parentId: string;
}

/**
 * Reads acme.community.v1.ForumWorkflowService/AdvanceForumWorkflow, keeps its fields by name, and passes
 * some of them to acme.personalization.v1.ProfileCalculationService.
 */
export async function backfillForumWorkflowStatus(runtime: Runtime): Promise<void> {
  const upstream = new communityForumWorkflowServiceApi.ForumWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<communityForumWorkflowServiceApi.AdvanceForumWorkflowRequest, communityForumWorkflowServiceApi.AdvanceForumWorkflowResponse>(
    (request, done) => upstream.advanceForumWorkflow(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    communityForumWorkflowServiceApi.AdvanceForumWorkflowRequest.fromPartial({ forumId: "current-backfill-forum-workflow-status" }));
  const kept: BackfillForumWorkflowStatusRecord = {
    status: reply.outcome?.status ?? "",
    name: text.normalize(reply.forum?.name ?? ""),
    parentId: text.normalize(reply.forum?.parentId ?? ""),
  };
  const slots = new URLSearchParams();
  slots.set("status", kept.status);
  slots.set("name", kept.name);
  slots.set("parent-id", kept.parentId);
  const writer = new personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  await call<personalizationProfileCalculationServiceApi.CalculateProfileRequest, personalizationProfileCalculationServiceApi.CalculateProfileResponse>(
    (request, done) => writer.calculateProfile(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    personalizationProfileCalculationServiceApi.CalculateProfileRequest.fromPartial({ reason: slots.get("name") ?? "" }));
}
