import * as audiencesAudienceMemberWorkflowServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_member_workflow_service.js";
import * as experimentsExperimentCalculationServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_calculation_service.js";
import * as formsFormSubmissionLifecycleServiceApi from "../../../.cache/proto/acme/forms/v1/form_submission_lifecycle_service.js";
import * as messagingParticipantSyncServiceApi from "../../../.cache/proto/acme/messaging/v1/participant_sync_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillParticipantsId keeps of each SyncParticipants response. */
interface BackfillParticipantsIdRecord {
  referenceId: string;
  status: string;
  participantId: string;
}

/** Where backfillParticipantsId hands each record. */
interface BackfillParticipantsIdSink {
  deliver(record: BackfillParticipantsIdRecord): Promise<void>;
}

/** Writes records to acme.experiments.v1.ExperimentCalculationService. */
class BackfillParticipantsIdExperimentCalculation implements BackfillParticipantsIdSink {
  private readonly client: experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: BackfillParticipantsIdRecord): Promise<void> {
    await call<experimentsExperimentCalculationServiceApi.CalculateExperimentRequest, experimentsExperimentCalculationServiceApi.CalculateExperimentResponse>(
      (request, done) => this.client.calculateExperiment(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      experimentsExperimentCalculationServiceApi.CalculateExperimentRequest.fromPartial({ experiment: { title: record.status } }));
  }
}

/** Writes records to acme.forms.v1.FormSubmissionLifecycleService. */
class BackfillParticipantsIdFormSubmissionLifecycle implements BackfillParticipantsIdSink {
  private readonly client: formsFormSubmissionLifecycleServiceApi.FormSubmissionLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormSubmissionLifecycleServiceApi.FormSubmissionLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: BackfillParticipantsIdRecord): Promise<void> {
    await call<formsFormSubmissionLifecycleServiceApi.ActivateFormSubmissionRequest, formsFormSubmissionLifecycleServiceApi.ActivateFormSubmissionResponse>(
      (request, done) => this.client.activateFormSubmission(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      formsFormSubmissionLifecycleServiceApi.ActivateFormSubmissionRequest.fromPartial({ reason: record.participantId, details: { reasonCode: record.status } }));
  }
}

/** Passes records to acme.audiences.v1.AudienceMemberWorkflowService. */
class BackfillParticipantsIdAudienceMemberWorkflow implements BackfillParticipantsIdSink {
  private readonly client: audiencesAudienceMemberWorkflowServiceApi.AudienceMemberWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceMemberWorkflowServiceApi.AudienceMemberWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: BackfillParticipantsIdRecord): Promise<void> {
    await call<audiencesAudienceMemberWorkflowServiceApi.ResumeAudienceMemberWorkflowRequest, audiencesAudienceMemberWorkflowServiceApi.ResumeAudienceMemberWorkflowResponse>(
      (request, done) => this.client.resumeAudienceMemberWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      audiencesAudienceMemberWorkflowServiceApi.ResumeAudienceMemberWorkflowRequest.fromPartial({ reason: record.status }));
  }
}

/**
 * Reads acme.messaging.v1.ParticipantSyncService/SyncParticipants and hands what it keeps to the sink of its
 * kind.
 */
export async function backfillParticipantsId(runtime: Runtime): Promise<void> {
  const source = new messagingParticipantSyncServiceApi.ParticipantSyncServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<messagingParticipantSyncServiceApi.SyncParticipantsRequest, messagingParticipantSyncServiceApi.SyncParticipantsResponse>(
    (request, done) => source.syncParticipants(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    messagingParticipantSyncServiceApi.SyncParticipantsRequest.fromPartial({ reason: "nightly-backfill-participants-id" })));
  const record: BackfillParticipantsIdRecord = {
    referenceId: reply.outcome?.referenceId ?? "",
    status: reply.outcome?.status ?? "",
    participantId: reply.participant?.participantId ?? "",
  };
  const entries: Array<{ kind: string; sink: BackfillParticipantsIdSink }> = [
    { kind: "experiment-calculation", sink: new BackfillParticipantsIdExperimentCalculation(runtime) },
    { kind: "form-submission-lifecycle", sink: new BackfillParticipantsIdFormSubmissionLifecycle(runtime) },
    { kind: "audience-member-workflow", sink: new BackfillParticipantsIdAudienceMemberWorkflow(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "audience-member-workflow") continue;
    await entry.sink.deliver(record);
  }
}
