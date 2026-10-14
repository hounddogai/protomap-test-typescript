import * as lineageLineageNodeServiceApi from "../../../.cache/proto/acme/lineage/v1/lineage_node_service.js";
import * as mediaRenditionApprovalServiceApi from "../../../.cache/proto/acme/media/v1/rendition_approval_service.js";
import * as messagingParticipantApprovalServiceApi from "../../../.cache/proto/acme/messaging/v1/participant_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportRenditionCode keeps of each ApproveRendition response. */
interface ExportRenditionCodeRecord {
  code: string;
  renditionId: string;
  status: string;
  message: string;
}

/** Where exportRenditionCode hands each record. */
interface ExportRenditionCodeWriter {
  apply(record: ExportRenditionCodeRecord): Promise<void>;
}

/** Writes records to acme.lineage.v1.LineageNodeService. */
class ExportRenditionCodeLineageNode implements ExportRenditionCodeWriter {
  private readonly client: lineageLineageNodeServiceApi.LineageNodeServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new lineageLineageNodeServiceApi.LineageNodeServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: ExportRenditionCodeRecord): Promise<void> {
    await call<lineageLineageNodeServiceApi.CloneLineageNodeRequest, lineageLineageNodeServiceApi.CloneLineageNodeResponse>(
      (request, done) => this.client.cloneLineageNode(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      lineageLineageNodeServiceApi.CloneLineageNodeRequest.fromPartial({ lineageNode: { lineageNodeId: record.message } }));
  }
}

/** Writes records to acme.messaging.v1.ParticipantApprovalService. */
class ExportRenditionCodeParticipantApproval implements ExportRenditionCodeWriter {
  private readonly client: messagingParticipantApprovalServiceApi.ParticipantApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingParticipantApprovalServiceApi.ParticipantApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: ExportRenditionCodeRecord): Promise<void> {
    await call<messagingParticipantApprovalServiceApi.EscalateParticipantRequest, messagingParticipantApprovalServiceApi.EscalateParticipantResponse>(
      (request, done) => this.client.escalateParticipant(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      messagingParticipantApprovalServiceApi.EscalateParticipantRequest.fromPartial({ participant: { participantId: record.status }, details: { approverEmail: record.message }, reason: record.code }));
  }
}

/** Runs the action registered for kind. */
async function actOnExportRenditionCode(kind: string, record: ExportRenditionCodeRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "lineage-node": () => new ExportRenditionCodeLineageNode(runtime).apply(record),
    "participant-approval": () => new ExportRenditionCodeParticipantApproval(runtime).apply(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.media.v1.RenditionApprovalService/ApproveRendition and hands what it keeps to the sink of its
 * kind.
 */
export async function exportRenditionCode(runtime: Runtime): Promise<void> {
  const reader = new mediaRenditionApprovalServiceApi.RenditionApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<mediaRenditionApprovalServiceApi.ApproveRenditionRequest, mediaRenditionApprovalServiceApi.ApproveRenditionResponse>(
    (request, done) => reader.approveRendition(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    mediaRenditionApprovalServiceApi.ApproveRenditionRequest.fromPartial({ reason: "live-export-rendition-code" })));
  const kept: ExportRenditionCodeRecord = {
    code: reply.rendition?.code ?? "",
    renditionId: reply.rendition?.renditionId ?? "",
    status: reply.result?.status ?? "",
    message: reply.outcome?.message ?? "",
  };
  await actOnExportRenditionCode("participant-approval", kept, runtime);
}
