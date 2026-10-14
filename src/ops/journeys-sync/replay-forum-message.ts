import * as communityForumValidationServiceApi from "../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as contentTaxonomyApprovalServiceApi from "../../../.cache/proto/acme/content/v1/taxonomy_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replayForumMessage keeps of each PreviewForum response. */
interface ReplayForumMessageRecord {
  message: string;
  outcomeMessage: string;
  status: string;
}

/**
 * Reads acme.community.v1.ForumValidationService/PreviewForum, keeps its fields by name, and passes some of
 * them to acme.content.v1.TaxonomyApprovalService.
 */
export async function replayForumMessage(runtime: Runtime): Promise<void> {
  const origin = new communityForumValidationServiceApi.ForumValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<communityForumValidationServiceApi.PreviewForumRequest, communityForumValidationServiceApi.PreviewForumResponse>(
    (request, done) => origin.previewForum(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    communityForumValidationServiceApi.PreviewForumRequest.fromPartial({ reason: "live-replay-forum-message" })));
  const kept: ReplayForumMessageRecord = {
    message: current.result?.message ?? "",
    outcomeMessage: current.outcome?.message ?? "",
    status: text.normalize(current.result?.status ?? ""),
  };
  const carried = new URLSearchParams();
  carried.set("message", kept.message);
  carried.set("outcome-message", kept.outcomeMessage);
  carried.set("status", kept.status);
  const sink = new contentTaxonomyApprovalServiceApi.TaxonomyApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  await retry(() => call<contentTaxonomyApprovalServiceApi.GetTaxonomyApprovalStatusRequest, contentTaxonomyApprovalServiceApi.GetTaxonomyApprovalStatusResponse>(
    (request, done) => sink.getTaxonomyApprovalStatus(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    contentTaxonomyApprovalServiceApi.GetTaxonomyApprovalStatusRequest.fromPartial({ taxonomyId: carried.get("status") ?? "" })));
}
