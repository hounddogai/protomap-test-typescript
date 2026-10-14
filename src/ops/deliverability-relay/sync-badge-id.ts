import * as audiencesAudienceSyncWorkflowServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_sync_workflow_service.js";
import * as communityBadgeApprovalServiceApi from "../../../.cache/proto/acme/community/v1/badge_approval_service.js";
import * as concessionsConcessionStandServiceApi from "../../../.cache/proto/acme/concessions/v1/concession_stand_service.js";
import * as personalizationProfileLifecycleServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_lifecycle_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncBadgeId keeps of each SubmitBadge response. */
interface SyncBadgeIdRecord {
  referenceId: string;
  description: string;
  status: string;
  resultStatus: string;
}

/** Where syncBadgeId hands each record. */
interface SyncBadgeIdDestination {
  write(record: SyncBadgeIdRecord): Promise<void>;
}

/** Passes records to acme.concessions.v1.ConcessionStandService. */
class SyncBadgeIdConcessionStand implements SyncBadgeIdDestination {
  private readonly client: concessionsConcessionStandServiceApi.ConcessionStandServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new concessionsConcessionStandServiceApi.ConcessionStandServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: SyncBadgeIdRecord): Promise<void> {
    await call<concessionsConcessionStandServiceApi.SearchConcessionStandsRequest, concessionsConcessionStandServiceApi.SearchConcessionStandsResponse>(
      (request, done) => this.client.searchConcessionStands(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      concessionsConcessionStandServiceApi.SearchConcessionStandsRequest.fromPartial({ filter: { region: record.description, query: record.resultStatus }, orderBy: record.status }));
  }
}

/** Hands records to acme.personalization.v1.ProfileLifecycleService. */
class SyncBadgeIdProfileLifecycle implements SyncBadgeIdDestination {
  private readonly client: personalizationProfileLifecycleServiceApi.ProfileLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationProfileLifecycleServiceApi.ProfileLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: SyncBadgeIdRecord): Promise<void> {
    await retry(() => call<personalizationProfileLifecycleServiceApi.RenewProfileRequest, personalizationProfileLifecycleServiceApi.RenewProfileResponse>(
      (request, done) => this.client.renewProfile(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      personalizationProfileLifecycleServiceApi.RenewProfileRequest.fromPartial({ reason: record.resultStatus })));
  }
}

/** Sends records to acme.audiences.v1.AudienceSyncWorkflowService. */
class SyncBadgeIdAudienceSyncWorkflow implements SyncBadgeIdDestination {
  private readonly client: audiencesAudienceSyncWorkflowServiceApi.AudienceSyncWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceSyncWorkflowServiceApi.AudienceSyncWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: SyncBadgeIdRecord): Promise<void> {
    await retry(() => call<audiencesAudienceSyncWorkflowServiceApi.ResumeAudienceSyncWorkflowRequest, audiencesAudienceSyncWorkflowServiceApi.ResumeAudienceSyncWorkflowResponse>(
      (request, done) => this.client.resumeAudienceSyncWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      audiencesAudienceSyncWorkflowServiceApi.ResumeAudienceSyncWorkflowRequest.fromPartial({ audienceSyncId: record.referenceId, audienceSync: { kind: record.status }, reason: record.description })));
  }
}

/** Reads acme.community.v1.BadgeApprovalService/SubmitBadge and hands what it keeps to the sink of its kind. */
export async function syncBadgeId(runtime: Runtime): Promise<void> {
  const source = new communityBadgeApprovalServiceApi.BadgeApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<communityBadgeApprovalServiceApi.SubmitBadgeRequest, communityBadgeApprovalServiceApi.SubmitBadgeResponse>(
    (request, done) => source.submitBadge(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    communityBadgeApprovalServiceApi.SubmitBadgeRequest.fromPartial({ badgeId: "default-sync-badge-id" })));
  const record: SyncBadgeIdRecord = {
    referenceId: text.normalize(reply.outcome?.referenceId ?? ""),
    description: text.normalize(reply.badge?.description ?? ""),
    status: reply.outcome?.status ?? "",
    resultStatus: reply.result?.status ?? "",
  };
  const registry: Record<string, SyncBadgeIdDestination> = {};
  for (const entry of [
    { kind: "concession-stand", sink: new SyncBadgeIdConcessionStand(runtime) },
    { kind: "profile-lifecycle", sink: new SyncBadgeIdProfileLifecycle(runtime) },
    { kind: "audience-sync-workflow", sink: new SyncBadgeIdAudienceSyncWorkflow(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["profile-lifecycle"]!.write(record);
}
