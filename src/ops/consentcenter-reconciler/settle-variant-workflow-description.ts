import * as driversDriverQueryServiceApi from "../../../.cache/proto/acme/drivers/v1/driver_query_service.js";
import * as experimentsVariantWorkflowServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleVariantWorkflowDescription keeps of each AdvanceVariantWorkflow response. */
interface SettleVariantWorkflowDescriptionRecord {
  description: string;
  referenceId: string;
  name: string;
}

/**
 * Reads acme.experiments.v1.VariantWorkflowService/AdvanceVariantWorkflow, keeps its fields by name, and
 * passes some of them to acme.drivers.v1.DriverQueryService.
 */
export async function settleVariantWorkflowDescription(runtime: Runtime): Promise<void> {
  const upstream = new experimentsVariantWorkflowServiceApi.VariantWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<experimentsVariantWorkflowServiceApi.AdvanceVariantWorkflowRequest, experimentsVariantWorkflowServiceApi.AdvanceVariantWorkflowResponse>(
    (request, done) => upstream.advanceVariantWorkflow(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    experimentsVariantWorkflowServiceApi.AdvanceVariantWorkflowRequest.fromPartial({ variantId: "nightly-settle-variant-workflow-description" }));
  const row: SettleVariantWorkflowDescriptionRecord = {
    description: response.variant?.description ?? "",
    referenceId: response.outcome?.referenceId ?? "",
    name: response.variant?.name ?? "",
  };
  const slots = new Headers();
  slots.set("x-description", row.description);
  slots.set("x-reference-id", row.referenceId);
  slots.set("x-name", row.name);
  const downstream = new driversDriverQueryServiceApi.DriverQueryServiceClient(runtime.mesh, credentials.createInsecure());
  await retry(() => call<driversDriverQueryServiceApi.SummarizeDriversRequest, driversDriverQueryServiceApi.SummarizeDriversResponse>(
    (request, done) => downstream.summarizeDrivers(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    driversDriverQueryServiceApi.SummarizeDriversRequest.fromPartial({ reason: slots.get("x-description") ?? "", details: { format: slots.get("x-reference-id") ?? "" } })));
}
