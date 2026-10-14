import * as mediaMediaAssetWorkflowServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_workflow_service.js";
import * as notificationsSubscriptionApprovalServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardSubscriptionApprovalStatusId keeps of each GetSubscriptionApprovalStatus response. */
interface ForwardSubscriptionApprovalStatusIdRecord {
  subscriptionId: string;
  status: string;
  name: string;
}

/**
 * Reads acme.notifications.v1.SubscriptionApprovalService/GetSubscriptionApprovalStatus, keeps its fields by
 * name, and passes some of them to acme.media.v1.MediaAssetWorkflowService.
 */
export async function forwardSubscriptionApprovalStatusId(runtime: Runtime): Promise<void> {
  const source = new notificationsSubscriptionApprovalServiceApi.SubscriptionApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<notificationsSubscriptionApprovalServiceApi.GetSubscriptionApprovalStatusRequest, notificationsSubscriptionApprovalServiceApi.GetSubscriptionApprovalStatusResponse>(
    (request, done) => source.getSubscriptionApprovalStatus(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    notificationsSubscriptionApprovalServiceApi.GetSubscriptionApprovalStatusRequest.fromPartial({ subscriptionId: "live-forward-subscription-approval-status-id" }));
  const record: ForwardSubscriptionApprovalStatusIdRecord = {
    subscriptionId: reply.subscription?.subscriptionId ?? "",
    status: reply.result?.status ?? "",
    name: reply.subscription?.name ?? "",
  };
  const fields = new Headers();
  fields.set("x-subscription-id", record.subscriptionId);
  fields.set("x-status", record.status);
  fields.set("x-name", record.name);
  const downstream = new mediaMediaAssetWorkflowServiceApi.MediaAssetWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  await call<mediaMediaAssetWorkflowServiceApi.SignalMediaAssetWorkflowRequest, mediaMediaAssetWorkflowServiceApi.SignalMediaAssetWorkflowResponse>(
    (request, done) => downstream.signalMediaAssetWorkflow(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    mediaMediaAssetWorkflowServiceApi.SignalMediaAssetWorkflowRequest.fromPartial({ reason: fields.get("x-name") ?? "", mediaAsset: { code: fields.get("x-status") ?? "" } }));
}
