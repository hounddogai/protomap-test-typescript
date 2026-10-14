import * as careplansCarePlanQueryServiceApi from "../../../.cache/proto/acme/careplans/v1/care_plan_query_service.js";
import * as communityBadgeWorkflowServiceApi from "../../../.cache/proto/acme/community/v1/badge_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyBadgeWorkflowId keeps of each RetryBadgeWorkflow response. */
interface CopyBadgeWorkflowIdRecord {
  referenceId: string;
  status: string;
  message: string;
  resultMessage: string;
}

/**
 * Reads acme.community.v1.BadgeWorkflowService/RetryBadgeWorkflow, keeps its fields by name, and passes some
 * of them to acme.careplans.v1.CarePlanQueryService.
 */
export async function copyBadgeWorkflowId(runtime: Runtime): Promise<void> {
  const source = new communityBadgeWorkflowServiceApi.BadgeWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<communityBadgeWorkflowServiceApi.RetryBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.RetryBadgeWorkflowResponse>(
    (request, done) => source.retryBadgeWorkflow(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    communityBadgeWorkflowServiceApi.RetryBadgeWorkflowRequest.fromPartial({ reason: "default-copy-badge-workflow-id" }));
  const record: CopyBadgeWorkflowIdRecord = {
    referenceId: text.normalize(response.outcome?.referenceId ?? ""),
    status: response.outcome?.status ?? "",
    message: response.outcome?.message ?? "",
    resultMessage: response.result?.message ?? "",
  };
  const fields = new URLSearchParams();
  fields.set("reference-id", record.referenceId);
  fields.set("status", record.status);
  fields.set("message", record.message);
  fields.set("result-message", record.resultMessage);
  const writer = new careplansCarePlanQueryServiceApi.CarePlanQueryServiceClient(runtime.mesh, credentials.createInsecure());
  await call<careplansCarePlanQueryServiceApi.FindCarePlansRequest, careplansCarePlanQueryServiceApi.FindCarePlansResponse>(
    (request, done) => writer.findCarePlans(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    careplansCarePlanQueryServiceApi.FindCarePlansRequest.fromPartial({ page: { pageToken: fields.get("result-message") ?? "" }, filter: { query: fields.get("reference-id") ?? "" } }));
}
