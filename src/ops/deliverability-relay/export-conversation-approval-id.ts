import * as fulfillmentFulfillmentServiceApi from "../../../.cache/proto/acme/fulfillment/v1/fulfillment_service.js";
import * as messagingConversationApprovalServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_approval_service.js";
import * as messagingParticipantApprovalServiceApi from "../../../.cache/proto/acme/messaging/v1/participant_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportConversationApprovalId keeps of each DelegateConversationApproval response. */
interface ExportConversationApprovalIdRecord {
  referenceId: string;
  correlationId: string;
  status: string;
  message: string;
}

/** Where exportConversationApprovalId hands each record. */
interface ExportConversationApprovalIdWriter {
  push(record: ExportConversationApprovalIdRecord): Promise<void>;
}

/** Writes records to acme.fulfillment.v1.FulfillmentService. */
class ExportConversationApprovalIdFulfillment implements ExportConversationApprovalIdWriter {
  private readonly client: fulfillmentFulfillmentServiceApi.FulfillmentServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new fulfillmentFulfillmentServiceApi.FulfillmentServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ExportConversationApprovalIdRecord): Promise<void> {
    await call<fulfillmentFulfillmentServiceApi.CreateFulfillmentRequest, fulfillmentFulfillmentServiceApi.CreateFulfillmentResponse>(
      (request, done) => this.client.createFulfillment(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      fulfillmentFulfillmentServiceApi.CreateFulfillmentRequest.fromPartial({ fulfillment: { fulfillmentId: record.message } }));
  }
}

/** Sends records to acme.messaging.v1.ParticipantApprovalService. */
class ExportConversationApprovalIdParticipantApproval implements ExportConversationApprovalIdWriter {
  private readonly client: messagingParticipantApprovalServiceApi.ParticipantApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingParticipantApprovalServiceApi.ParticipantApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ExportConversationApprovalIdRecord): Promise<void> {
    await call<messagingParticipantApprovalServiceApi.DelegateParticipantApprovalRequest, messagingParticipantApprovalServiceApi.DelegateParticipantApprovalResponse>(
      (request, done) => this.client.delegateParticipantApproval(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      messagingParticipantApprovalServiceApi.DelegateParticipantApprovalRequest.fromPartial({ participant: { participantId: record.correlationId }, details: { approverEmail: record.status } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class ExportConversationApprovalIdLogOnly implements ExportConversationApprovalIdWriter {
  async push(record: ExportConversationApprovalIdRecord): Promise<void> {
    console.info("no sink for record", record.referenceId);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchExportConversationApprovalId(kind: string, record: ExportConversationApprovalIdRecord, runtime: Runtime): Promise<void> {
  let write = (item: ExportConversationApprovalIdRecord): Promise<void> => new ExportConversationApprovalIdLogOnly().push(item);
  switch (kind) {
    case "fulfillment":
      write = (item) => new ExportConversationApprovalIdFulfillment(runtime).push(item);
      break;
    case "participant-approval":
      write = (item) => new ExportConversationApprovalIdParticipantApproval(runtime).push(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.messaging.v1.ConversationApprovalService/DelegateConversationApproval and hands what it keeps to
 * the sink of its kind.
 */
export async function exportConversationApprovalId(runtime: Runtime): Promise<void> {
  const upstream = new messagingConversationApprovalServiceApi.ConversationApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<messagingConversationApprovalServiceApi.DelegateConversationApprovalRequest, messagingConversationApprovalServiceApi.DelegateConversationApprovalResponse>(
    (request, done) => upstream.delegateConversationApproval(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    messagingConversationApprovalServiceApi.DelegateConversationApprovalRequest.fromPartial({ reason: "primary-export-conversation-approval-id" }));
  const entry: ExportConversationApprovalIdRecord = {
    referenceId: current.outcome?.referenceId ?? "",
    correlationId: current.result?.correlationId ?? "",
    status: current.outcome?.status ?? "",
    message: current.outcome?.message ?? "",
  };
  await dispatchExportConversationApprovalId("fulfillment", entry, runtime);
}
