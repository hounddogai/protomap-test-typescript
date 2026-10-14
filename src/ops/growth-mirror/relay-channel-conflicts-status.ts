import * as appointmentsAppointmentQueryServiceApi from "../../../.cache/proto/acme/appointments/v1/appointment_query_service.js";
import * as communityForumWorkflowServiceApi from "../../../.cache/proto/acme/community/v1/forum_workflow_service.js";
import * as messagingChannelSyncServiceApi from "../../../.cache/proto/acme/messaging/v1/channel_sync_service.js";
import * as modelregistryRegisteredModelCalculationServiceApi from "../../../.cache/proto/acme/modelregistry/v1/registered_model_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relayChannelConflictsStatus keeps of each ListChannelConflicts response. */
interface RelayChannelConflictsStatusRecord {
  status: string;
  message: string;
  correlationId: string;
}

/** Where relayChannelConflictsStatus hands each record. */
interface RelayChannelConflictsStatusDestination {
  push(record: RelayChannelConflictsStatusRecord): Promise<void>;
}

/** Writes records to acme.modelregistry.v1.RegisteredModelCalculationService. */
class RelayChannelConflictsStatusRegisteredModelCalculation implements RelayChannelConflictsStatusDestination {
  private readonly client: modelregistryRegisteredModelCalculationServiceApi.RegisteredModelCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new modelregistryRegisteredModelCalculationServiceApi.RegisteredModelCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RelayChannelConflictsStatusRecord): Promise<void> {
    await call<modelregistryRegisteredModelCalculationServiceApi.ExplainRegisteredModelCalculationRequest, modelregistryRegisteredModelCalculationServiceApi.ExplainRegisteredModelCalculationResponse>(
      (request, done) => this.client.explainRegisteredModelCalculation(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      modelregistryRegisteredModelCalculationServiceApi.ExplainRegisteredModelCalculationRequest.fromPartial({ registeredModelId: record.correlationId, registeredModel: { code: record.message }, reason: record.status }));
  }
}

/** Sends records to acme.community.v1.ForumWorkflowService. */
class RelayChannelConflictsStatusForumWorkflow implements RelayChannelConflictsStatusDestination {
  private readonly client: communityForumWorkflowServiceApi.ForumWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityForumWorkflowServiceApi.ForumWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RelayChannelConflictsStatusRecord): Promise<void> {
    await retry(() => call<communityForumWorkflowServiceApi.CancelForumWorkflowRequest, communityForumWorkflowServiceApi.CancelForumWorkflowResponse>(
      (request, done) => this.client.cancelForumWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      communityForumWorkflowServiceApi.CancelForumWorkflowRequest.fromPartial({ forum: { name: record.status } })));
  }
}

/** Writes records to acme.appointments.v1.AppointmentQueryService. */
class RelayChannelConflictsStatusAppointmentQuery implements RelayChannelConflictsStatusDestination {
  private readonly client: appointmentsAppointmentQueryServiceApi.AppointmentQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new appointmentsAppointmentQueryServiceApi.AppointmentQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RelayChannelConflictsStatusRecord): Promise<void> {
    await call<appointmentsAppointmentQueryServiceApi.PeekAppointmentRequest, appointmentsAppointmentQueryServiceApi.PeekAppointmentResponse>(
      (request, done) => this.client.peekAppointment(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      appointmentsAppointmentQueryServiceApi.PeekAppointmentRequest.fromPartial({ appointmentId: record.correlationId }));
  }
}

/** Only logs, for kinds no service takes yet. */
class RelayChannelConflictsStatusLogOnly implements RelayChannelConflictsStatusDestination {
  async push(record: RelayChannelConflictsStatusRecord): Promise<void> {
    console.info("no sink for record", record.status);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverRelayChannelConflictsStatus(kind: string, record: RelayChannelConflictsStatusRecord, runtime: Runtime): Promise<void> {
  let sink: RelayChannelConflictsStatusDestination = new RelayChannelConflictsStatusLogOnly();
  switch (kind) {
    case "registered-model-calculation":
      sink = new RelayChannelConflictsStatusRegisteredModelCalculation(runtime);
      break;
    case "forum-workflow":
      sink = new RelayChannelConflictsStatusForumWorkflow(runtime);
      break;
    case "appointment-query":
      sink = new RelayChannelConflictsStatusAppointmentQuery(runtime);
      break;
  }
  await sink.push(record);
}

/**
 * Reads acme.messaging.v1.ChannelSyncService/ListChannelConflicts and hands what it keeps to the sink of its
 * kind.
 */
export async function relayChannelConflictsStatus(runtime: Runtime): Promise<void> {
  const upstream = new messagingChannelSyncServiceApi.ChannelSyncServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<messagingChannelSyncServiceApi.ListChannelConflictsRequest, messagingChannelSyncServiceApi.ListChannelConflictsResponse>(
    (request, done) => upstream.listChannelConflicts(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    messagingChannelSyncServiceApi.ListChannelConflictsRequest.fromPartial({ orderBy: "main-relay-channel-conflicts-status" }));
  const record: RelayChannelConflictsStatusRecord = {
    status: text.normalize(reply.result?.status ?? ""),
    message: reply.result?.message ?? "",
    correlationId: text.normalize(reply.result?.correlationId ?? ""),
  };
  await deliverRelayChannelConflictsStatus("registered-model-calculation", record, runtime);
}
