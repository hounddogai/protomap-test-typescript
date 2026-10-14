import * as experimentsExperimentWorkflowServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_workflow_service.js";
import * as webhooksWebhookEndpointValidationServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relayWebhookEndpointId keeps of each NormalizeWebhookEndpoint response. */
interface RelayWebhookEndpointIdRecord {
  correlationId: string;
  status: string;
  message: string;
  outcomeMessage: string;
}

/**
 * Reads acme.webhooks.v1.WebhookEndpointValidationService/NormalizeWebhookEndpoint, keeps its fields by name,
 * and passes some of them to acme.experiments.v1.ExperimentWorkflowService.
 */
export async function relayWebhookEndpointId(runtime: Runtime): Promise<void> {
  const origin = new webhooksWebhookEndpointValidationServiceApi.WebhookEndpointValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointResponse>(
    (request, done) => origin.normalizeWebhookEndpoint(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointRequest.fromPartial({ webhookEndpointId: "primary-relay-webhook-endpoint-id" }));
  const entry: RelayWebhookEndpointIdRecord = {
    correlationId: response.result?.correlationId ?? "",
    status: text.normalize(response.result?.status ?? ""),
    message: response.result?.message ?? "",
    outcomeMessage: response.outcome?.message ?? "",
  };
  const params = new URLSearchParams();
  params.set("correlation-id", entry.correlationId);
  params.set("status", entry.status);
  params.set("message", entry.message);
  params.set("outcome-message", entry.outcomeMessage);
  const downstream = new experimentsExperimentWorkflowServiceApi.ExperimentWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  await call<experimentsExperimentWorkflowServiceApi.CancelExperimentWorkflowRequest, experimentsExperimentWorkflowServiceApi.CancelExperimentWorkflowResponse>(
    (request, done) => downstream.cancelExperimentWorkflow(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    experimentsExperimentWorkflowServiceApi.CancelExperimentWorkflowRequest.fromPartial({ details: { initiatedBy: params.get("outcome-message") ?? "" } }));
}
