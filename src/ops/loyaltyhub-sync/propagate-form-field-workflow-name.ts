import * as analyticsAnalyticsEventQueryServiceApi from "../../../.cache/proto/acme/analytics/v1/analytics_event_query_service.js";
import * as chatChatRoomApprovalServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_approval_service.js";
import * as experimentsExperimentWorkflowServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_workflow_service.js";
import * as formsFormFieldWorkflowServiceApi from "../../../.cache/proto/acme/forms/v1/form_field_workflow_service.js";
import * as mediaMediaAssetCalculationServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateFormFieldWorkflowName keeps of each AdvanceFormFieldWorkflow response. */
interface PropagateFormFieldWorkflowNameRecord {
  name: string;
  referenceId: string;
  message: string;
}

/** Where propagateFormFieldWorkflowName hands each record. */
interface PropagateFormFieldWorkflowNameTarget {
  push(record: PropagateFormFieldWorkflowNameRecord): Promise<void>;
}

/** Sends records to acme.analytics.v1.AnalyticsEventQueryService. */
class PropagateFormFieldWorkflowNameAnalyticsEventQuery implements PropagateFormFieldWorkflowNameTarget {
  private readonly client: analyticsAnalyticsEventQueryServiceApi.AnalyticsEventQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new analyticsAnalyticsEventQueryServiceApi.AnalyticsEventQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: PropagateFormFieldWorkflowNameRecord): Promise<void> {
    await retry(() => call<analyticsAnalyticsEventQueryServiceApi.FindAnalyticsEventsRequest, analyticsAnalyticsEventQueryServiceApi.FindAnalyticsEventsResponse>(
      (request, done) => this.client.findAnalyticsEvents(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      analyticsAnalyticsEventQueryServiceApi.FindAnalyticsEventsRequest.fromPartial({ filter: { query: record.message }, orderBy: record.name })));
  }
}

/** Writes records to acme.experiments.v1.ExperimentWorkflowService. */
class PropagateFormFieldWorkflowNameExperimentWorkflow implements PropagateFormFieldWorkflowNameTarget {
  private readonly client: experimentsExperimentWorkflowServiceApi.ExperimentWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExperimentWorkflowServiceApi.ExperimentWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: PropagateFormFieldWorkflowNameRecord): Promise<void> {
    await retry(() => call<experimentsExperimentWorkflowServiceApi.ListExperimentWorkflowsRequest, experimentsExperimentWorkflowServiceApi.ListExperimentWorkflowsResponse>(
      (request, done) => this.client.listExperimentWorkflows(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      experimentsExperimentWorkflowServiceApi.ListExperimentWorkflowsRequest.fromPartial({ page: { pageToken: record.message }, orderBy: record.name, filter: { query: record.referenceId } })));
  }
}

/** Sends records to acme.chat.v1.ChatRoomApprovalService. */
class PropagateFormFieldWorkflowNameChatRoomApproval implements PropagateFormFieldWorkflowNameTarget {
  private readonly client: chatChatRoomApprovalServiceApi.ChatRoomApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatRoomApprovalServiceApi.ChatRoomApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: PropagateFormFieldWorkflowNameRecord): Promise<void> {
    await call<chatChatRoomApprovalServiceApi.SubmitChatRoomRequest, chatChatRoomApprovalServiceApi.SubmitChatRoomResponse>(
      (request, done) => this.client.submitChatRoom(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      chatChatRoomApprovalServiceApi.SubmitChatRoomRequest.fromPartial({ details: { comment: record.referenceId }, chatRoom: { chatRoomId: record.message } }));
  }
}

/** Hands records to acme.media.v1.MediaAssetCalculationService. */
class PropagateFormFieldWorkflowNameMediaAssetCalculation implements PropagateFormFieldWorkflowNameTarget {
  private readonly client: mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: PropagateFormFieldWorkflowNameRecord): Promise<void> {
    await retry(() => call<mediaMediaAssetCalculationServiceApi.SimulateMediaAssetRequest, mediaMediaAssetCalculationServiceApi.SimulateMediaAssetResponse>(
      (request, done) => this.client.simulateMediaAsset(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      mediaMediaAssetCalculationServiceApi.SimulateMediaAssetRequest.fromPartial({ details: { currencyCode: record.message } })));
  }
}

/**
 * Reads acme.forms.v1.FormFieldWorkflowService/AdvanceFormFieldWorkflow and hands what it keeps to the sink
 * of its kind.
 */
export async function propagateFormFieldWorkflowName(runtime: Runtime): Promise<void> {
  const reader = new formsFormFieldWorkflowServiceApi.FormFieldWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<formsFormFieldWorkflowServiceApi.AdvanceFormFieldWorkflowRequest, formsFormFieldWorkflowServiceApi.AdvanceFormFieldWorkflowResponse>(
    (request, done) => reader.advanceFormFieldWorkflow(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    formsFormFieldWorkflowServiceApi.AdvanceFormFieldWorkflowRequest.fromPartial({ formFieldId: "main-propagate-form-field-workflow-name" }));
  const row: PropagateFormFieldWorkflowNameRecord = {
    name: text.normalize(reply.formField?.name ?? ""),
    referenceId: reply.outcome?.referenceId ?? "",
    message: reply.outcome?.message ?? "",
  };
  const entries: Array<{ kind: string; sink: PropagateFormFieldWorkflowNameTarget }> = [
    { kind: "analytics-event-query", sink: new PropagateFormFieldWorkflowNameAnalyticsEventQuery(runtime) },
    { kind: "experiment-workflow", sink: new PropagateFormFieldWorkflowNameExperimentWorkflow(runtime) },
    { kind: "chat-room-approval", sink: new PropagateFormFieldWorkflowNameChatRoomApproval(runtime) },
    { kind: "media-asset-calculation", sink: new PropagateFormFieldWorkflowNameMediaAssetCalculation(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "analytics-event-query") continue;
    await entry.sink.push(row);
  }
}
