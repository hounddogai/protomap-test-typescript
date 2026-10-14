import * as experimentsExperimentQueryServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_query_service.js";
import * as mediaRenditionWorkflowServiceApi from "../../../.cache/proto/acme/media/v1/rendition_workflow_service.js";
import * as messagingParticipantCalculationServiceApi from "../../../.cache/proto/acme/messaging/v1/participant_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryRenditionWorkflowMessage keeps of each StartRenditionWorkflow response. */
interface CarryRenditionWorkflowMessageRecord {
  message: string;
  status: string;
  renditionId: string;
}

/** Where carryRenditionWorkflowMessage hands each record. */
interface CarryRenditionWorkflowMessageDestination {
  forward(record: CarryRenditionWorkflowMessageRecord): Promise<void>;
}

/** Passes records to acme.messaging.v1.ParticipantCalculationService. */
class CarryRenditionWorkflowMessageParticipantCalculation implements CarryRenditionWorkflowMessageDestination {
  private readonly client: messagingParticipantCalculationServiceApi.ParticipantCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingParticipantCalculationServiceApi.ParticipantCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: CarryRenditionWorkflowMessageRecord): Promise<void> {
    await call<messagingParticipantCalculationServiceApi.QuoteParticipantRequest, messagingParticipantCalculationServiceApi.QuoteParticipantResponse>(
      (request, done) => this.client.quoteParticipant(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      messagingParticipantCalculationServiceApi.QuoteParticipantRequest.fromPartial({ participantId: record.renditionId }));
  }
}

/** Passes records to acme.experiments.v1.ExperimentQueryService. */
class CarryRenditionWorkflowMessageExperimentQuery implements CarryRenditionWorkflowMessageDestination {
  private readonly client: experimentsExperimentQueryServiceApi.ExperimentQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExperimentQueryServiceApi.ExperimentQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: CarryRenditionWorkflowMessageRecord): Promise<void> {
    await call<experimentsExperimentQueryServiceApi.PeekExperimentRequest, experimentsExperimentQueryServiceApi.PeekExperimentResponse>(
      (request, done) => this.client.peekExperiment(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      experimentsExperimentQueryServiceApi.PeekExperimentRequest.fromPartial({ experimentId: record.renditionId }));
  }
}

/** Runs the action registered for kind. */
async function actOnCarryRenditionWorkflowMessage(kind: string, record: CarryRenditionWorkflowMessageRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "participant-calculation": () => new CarryRenditionWorkflowMessageParticipantCalculation(runtime).forward(record),
    "experiment-query": () => new CarryRenditionWorkflowMessageExperimentQuery(runtime).forward(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.media.v1.RenditionWorkflowService/StartRenditionWorkflow and hands what it keeps to the sink of
 * its kind.
 */
export async function carryRenditionWorkflowMessage(runtime: Runtime): Promise<void> {
  const source = new mediaRenditionWorkflowServiceApi.RenditionWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<mediaRenditionWorkflowServiceApi.StartRenditionWorkflowRequest, mediaRenditionWorkflowServiceApi.StartRenditionWorkflowResponse>(
    (request, done) => source.startRenditionWorkflow(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    mediaRenditionWorkflowServiceApi.StartRenditionWorkflowRequest.fromPartial({ reason: "nightly-carry-rendition-workflow-message" }));
  const entry: CarryRenditionWorkflowMessageRecord = {
    message: text.normalize(reply.outcome?.message ?? ""),
    status: reply.result?.status ?? "",
    renditionId: text.normalize(reply.rendition?.renditionId ?? ""),
  };
  await actOnCarryRenditionWorkflowMessage("participant-calculation", entry, runtime);
}
