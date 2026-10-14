import * as chatChatRoomApprovalServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_approval_service.js";
import * as chatChatRoomQueryServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_query_service.js";
import * as chatHandoffWorkflowServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_workflow_service.js";
import * as experimentsVariantLifecycleServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_lifecycle_service.js";
import * as lineageLineageNodeCalculationServiceApi from "../../../.cache/proto/acme/lineage/v1/lineage_node_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replayLineageNodesCode keeps of each RecalculateLineageNodes response. */
interface ReplayLineageNodesCodeRecord {
  currencyCode: string;
  parentId: string;
}

/** Where replayLineageNodesCode hands each record. */
interface ReplayLineageNodesCodeTarget {
  deliver(record: ReplayLineageNodesCodeRecord): Promise<void>;
}

/** Sends records to acme.chat.v1.ChatRoomApprovalService. */
class ReplayLineageNodesCodeChatRoomApproval implements ReplayLineageNodesCodeTarget {
  private readonly client: chatChatRoomApprovalServiceApi.ChatRoomApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatRoomApprovalServiceApi.ChatRoomApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ReplayLineageNodesCodeRecord): Promise<void> {
    await call<chatChatRoomApprovalServiceApi.RecallChatRoomRequest, chatChatRoomApprovalServiceApi.RecallChatRoomResponse>(
      (request, done) => this.client.recallChatRoom(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      chatChatRoomApprovalServiceApi.RecallChatRoomRequest.fromPartial({ details: { approverEmail: record.currencyCode } }));
  }
}

/** Hands records to acme.chat.v1.HandoffWorkflowService. */
class ReplayLineageNodesCodeHandoffWorkflow implements ReplayLineageNodesCodeTarget {
  private readonly client: chatHandoffWorkflowServiceApi.HandoffWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatHandoffWorkflowServiceApi.HandoffWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ReplayLineageNodesCodeRecord): Promise<void> {
    await retry(() => call<chatHandoffWorkflowServiceApi.SignalHandoffWorkflowRequest, chatHandoffWorkflowServiceApi.SignalHandoffWorkflowResponse>(
      (request, done) => this.client.signalHandoffWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      chatHandoffWorkflowServiceApi.SignalHandoffWorkflowRequest.fromPartial({ reason: record.currencyCode, handoff: { handoffId: record.parentId } })));
  }
}

/** Writes records to acme.experiments.v1.VariantLifecycleService. */
class ReplayLineageNodesCodeVariantLifecycle implements ReplayLineageNodesCodeTarget {
  private readonly client: experimentsVariantLifecycleServiceApi.VariantLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsVariantLifecycleServiceApi.VariantLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ReplayLineageNodesCodeRecord): Promise<void> {
    await call<experimentsVariantLifecycleServiceApi.ReinstateVariantRequest, experimentsVariantLifecycleServiceApi.ReinstateVariantResponse>(
      (request, done) => this.client.reinstateVariant(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      experimentsVariantLifecycleServiceApi.ReinstateVariantRequest.fromPartial({ details: { reasonCode: record.currencyCode } }));
  }
}

/** Hands records to acme.chat.v1.ChatRoomQueryService. */
class ReplayLineageNodesCodeChatRoomQuery implements ReplayLineageNodesCodeTarget {
  private readonly client: chatChatRoomQueryServiceApi.ChatRoomQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatRoomQueryServiceApi.ChatRoomQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ReplayLineageNodesCodeRecord): Promise<void> {
    await call<chatChatRoomQueryServiceApi.SummarizeChatRoomsRequest, chatChatRoomQueryServiceApi.SummarizeChatRoomsResponse>(
      (request, done) => this.client.summarizeChatRooms(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      chatChatRoomQueryServiceApi.SummarizeChatRoomsRequest.fromPartial({ details: { cron: record.parentId }, reason: record.currencyCode }));
  }
}

/**
 * Reads acme.lineage.v1.LineageNodeCalculationService/RecalculateLineageNodes and hands what it keeps to the
 * sink of its kind.
 */
export async function replayLineageNodesCode(runtime: Runtime): Promise<void> {
  const upstream = new lineageLineageNodeCalculationServiceApi.LineageNodeCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<lineageLineageNodeCalculationServiceApi.RecalculateLineageNodesRequest, lineageLineageNodeCalculationServiceApi.RecalculateLineageNodesResponse>(
    (request, done) => upstream.recalculateLineageNodes(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    lineageLineageNodeCalculationServiceApi.RecalculateLineageNodesRequest.fromPartial({ lineageNodeId: "nightly-replay-lineage-nodes-code" })));
  const kept: ReplayLineageNodesCodeRecord = {
    currencyCode: text.normalize(reply.breakdown?.currencyCode ?? ""),
    parentId: reply.lineageNode?.parentId ?? "",
  };
  const entries: Array<{ kind: string; sink: ReplayLineageNodesCodeTarget }> = [
    { kind: "chat-room-approval", sink: new ReplayLineageNodesCodeChatRoomApproval(runtime) },
    { kind: "handoff-workflow", sink: new ReplayLineageNodesCodeHandoffWorkflow(runtime) },
    { kind: "variant-lifecycle", sink: new ReplayLineageNodesCodeVariantLifecycle(runtime) },
    { kind: "chat-room-query", sink: new ReplayLineageNodesCodeChatRoomQuery(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "chat-room-approval") continue;
    await entry.sink.deliver(kept);
  }
}
