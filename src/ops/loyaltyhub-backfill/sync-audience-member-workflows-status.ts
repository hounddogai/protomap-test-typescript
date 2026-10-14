import * as audiencesAudienceMemberWorkflowServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_member_workflow_service.js";
import * as sponsorshipsSponsorQueryServiceApi from "../../../.cache/proto/acme/sponsorships/v1/sponsor_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncAudienceMemberWorkflowsStatus keeps of each ListAudienceMemberWorkflows response. */
interface SyncAudienceMemberWorkflowsStatusRecord {
  status: string;
  nextPageToken: string;
}

/** Where syncAudienceMemberWorkflowsStatus hands each record. */
interface SyncAudienceMemberWorkflowsStatusTarget {
  send(record: SyncAudienceMemberWorkflowsStatusRecord): Promise<void>;
}

/** Sends records to acme.sponsorships.v1.SponsorQueryService. */
class SyncAudienceMemberWorkflowsStatusSponsorQuery implements SyncAudienceMemberWorkflowsStatusTarget {
  private readonly client: sponsorshipsSponsorQueryServiceApi.SponsorQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new sponsorshipsSponsorQueryServiceApi.SponsorQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: SyncAudienceMemberWorkflowsStatusRecord): Promise<void> {
    await call<sponsorshipsSponsorQueryServiceApi.FindSponsorsRequest, sponsorshipsSponsorQueryServiceApi.FindSponsorsResponse>(
      (request, done) => this.client.findSponsors(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      sponsorshipsSponsorQueryServiceApi.FindSponsorsRequest.fromPartial({ filter: { query: record.nextPageToken, ownerId: record.status } }));
  }
}

/**
 * Reads acme.audiences.v1.AudienceMemberWorkflowService/ListAudienceMemberWorkflows and hands what it keeps
 * to acme.sponsorships.v1.SponsorQueryService.
 */
export async function syncAudienceMemberWorkflowsStatus(runtime: Runtime): Promise<void> {
  const upstream = new audiencesAudienceMemberWorkflowServiceApi.AudienceMemberWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<audiencesAudienceMemberWorkflowServiceApi.ListAudienceMemberWorkflowsRequest, audiencesAudienceMemberWorkflowServiceApi.ListAudienceMemberWorkflowsResponse>(
    (request, done) => upstream.listAudienceMemberWorkflows(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    audiencesAudienceMemberWorkflowServiceApi.ListAudienceMemberWorkflowsRequest.fromPartial({ orderBy: "nightly-sync-audience-member-workflows-status" }));
  const record: SyncAudienceMemberWorkflowsStatusRecord = {
    status: response.result?.status ?? "",
    nextPageToken: response.pageInfo?.nextPageToken ?? "",
  };
  await new SyncAudienceMemberWorkflowsStatusSponsorQuery(runtime).send(record);
}
