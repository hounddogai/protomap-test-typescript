import * as broadcastsBroadcastServiceApi from "../../../.cache/proto/acme/broadcasts/v1/broadcast_service.js";
import * as chatHandoffWorkflowServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_workflow_service.js";
import * as mediaRenditionSyncServiceApi from "../../../.cache/proto/acme/media/v1/rendition_sync_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardHandoffWorkflowStatus keeps of each StartHandoffWorkflow response. */
interface ForwardHandoffWorkflowStatusRecord {
  status: string;
  message: string;
}

/** Where forwardHandoffWorkflowStatus hands each record. */
interface ForwardHandoffWorkflowStatusTarget {
  write(record: ForwardHandoffWorkflowStatusRecord): Promise<void>;
}

/** Hands records to acme.broadcasts.v1.BroadcastService. */
class ForwardHandoffWorkflowStatusBroadcast implements ForwardHandoffWorkflowStatusTarget {
  private readonly client: broadcastsBroadcastServiceApi.BroadcastServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new broadcastsBroadcastServiceApi.BroadcastServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ForwardHandoffWorkflowStatusRecord): Promise<void> {
    await retry(() => call<broadcastsBroadcastServiceApi.CreateBroadcastRequest, broadcastsBroadcastServiceApi.CreateBroadcastResponse>(
      (request, done) => this.client.createBroadcast(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      broadcastsBroadcastServiceApi.CreateBroadcastRequest.fromPartial({ requestId: record.message, broadcast: { broadcastId: record.status } })));
  }
}

/** Writes records to acme.media.v1.RenditionSyncService. */
class ForwardHandoffWorkflowStatusRenditionSync implements ForwardHandoffWorkflowStatusTarget {
  private readonly client: mediaRenditionSyncServiceApi.RenditionSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaRenditionSyncServiceApi.RenditionSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ForwardHandoffWorkflowStatusRecord): Promise<void> {
    await call<mediaRenditionSyncServiceApi.PullRenditionsRequest, mediaRenditionSyncServiceApi.PullRenditionsResponse>(
      (request, done) => this.client.pullRenditions(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      mediaRenditionSyncServiceApi.PullRenditionsRequest.fromPartial({ details: { checksum: record.status } }));
  }
}

/**
 * Reads acme.chat.v1.HandoffWorkflowService/StartHandoffWorkflow and hands what it keeps to the sink of its
 * kind.
 */
export async function forwardHandoffWorkflowStatus(runtime: Runtime): Promise<void> {
  const upstream = new chatHandoffWorkflowServiceApi.HandoffWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<chatHandoffWorkflowServiceApi.StartHandoffWorkflowRequest, chatHandoffWorkflowServiceApi.StartHandoffWorkflowResponse>(
    (request, done) => upstream.startHandoffWorkflow(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    chatHandoffWorkflowServiceApi.StartHandoffWorkflowRequest.fromPartial({ handoffId: "current-forward-handoff-workflow-status" }));
  const kept: ForwardHandoffWorkflowStatusRecord = {
    status: found.result?.status ?? "",
    message: found.result?.message ?? "",
  };
  const registry: Record<string, ForwardHandoffWorkflowStatusTarget> = {};
  for (const entry of [
    { kind: "broadcast", sink: new ForwardHandoffWorkflowStatusBroadcast(runtime) },
    { kind: "rendition-sync", sink: new ForwardHandoffWorkflowStatusRenditionSync(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["broadcast"]!.write(kept);
}
