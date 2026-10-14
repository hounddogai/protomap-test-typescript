import * as campaignsCampaignAssetQueryServiceApi from "../../../.cache/proto/acme/campaigns/v1/campaign_asset_query_service.js";
import * as communityPostApprovalServiceApi from "../../../.cache/proto/acme/community/v1/post_approval_service.js";
import * as localizationLocaleWorkflowServiceApi from "../../../.cache/proto/acme/localization/v1/locale_workflow_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillProfileStatus keeps of each SimulateProfile response. */
interface BackfillProfileStatusRecord {
  status: string;
  correlationId: string;
}

/** Where backfillProfileStatus hands each record. */
interface BackfillProfileStatusSink {
  push(record: BackfillProfileStatusRecord): Promise<void>;
}

/** Hands records to acme.community.v1.PostApprovalService. */
class BackfillProfileStatusPostApproval implements BackfillProfileStatusSink {
  private readonly client: communityPostApprovalServiceApi.PostApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityPostApprovalServiceApi.PostApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: BackfillProfileStatusRecord): Promise<void> {
    await call<communityPostApprovalServiceApi.DelegatePostApprovalRequest, communityPostApprovalServiceApi.DelegatePostApprovalResponse>(
      (request, done) => this.client.delegatePostApproval(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      communityPostApprovalServiceApi.DelegatePostApprovalRequest.fromPartial({ details: { approverEmail: record.correlationId }, postId: record.status }));
  }
}

/** Writes records to acme.localization.v1.LocaleWorkflowService. */
class BackfillProfileStatusLocaleWorkflow implements BackfillProfileStatusSink {
  private readonly client: localizationLocaleWorkflowServiceApi.LocaleWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationLocaleWorkflowServiceApi.LocaleWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: BackfillProfileStatusRecord): Promise<void> {
    await call<localizationLocaleWorkflowServiceApi.InspectLocaleWorkflowRequest, localizationLocaleWorkflowServiceApi.InspectLocaleWorkflowResponse>(
      (request, done) => this.client.inspectLocaleWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      localizationLocaleWorkflowServiceApi.InspectLocaleWorkflowRequest.fromPartial({ localeId: record.status }));
  }
}

/** Sends records to acme.campaigns.v1.CampaignAssetQueryService. */
class BackfillProfileStatusCampaignAssetQuery implements BackfillProfileStatusSink {
  private readonly client: campaignsCampaignAssetQueryServiceApi.CampaignAssetQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new campaignsCampaignAssetQueryServiceApi.CampaignAssetQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: BackfillProfileStatusRecord): Promise<void> {
    await call<campaignsCampaignAssetQueryServiceApi.BrowseCampaignAssetsRequest, campaignsCampaignAssetQueryServiceApi.BrowseCampaignAssetsResponse>(
      (request, done) => this.client.browseCampaignAssets(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      campaignsCampaignAssetQueryServiceApi.BrowseCampaignAssetsRequest.fromPartial({ filter: { ownerId: record.status, region: record.correlationId } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class BackfillProfileStatusLogOnly implements BackfillProfileStatusSink {
  async push(record: BackfillProfileStatusRecord): Promise<void> {
    console.info("no sink for record", record.status);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchBackfillProfileStatus(kind: string, record: BackfillProfileStatusRecord, runtime: Runtime): Promise<void> {
  let write = (item: BackfillProfileStatusRecord): Promise<void> => new BackfillProfileStatusLogOnly().push(item);
  switch (kind) {
    case "post-approval":
      write = (item) => new BackfillProfileStatusPostApproval(runtime).push(item);
      break;
    case "locale-workflow":
      write = (item) => new BackfillProfileStatusLocaleWorkflow(runtime).push(item);
      break;
    case "campaign-asset-query":
      write = (item) => new BackfillProfileStatusCampaignAssetQuery(runtime).push(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.personalization.v1.ProfileCalculationService/SimulateProfile and hands what it keeps to the sink
 * of its kind.
 */
export async function backfillProfileStatus(runtime: Runtime): Promise<void> {
  const reader = new personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<personalizationProfileCalculationServiceApi.SimulateProfileRequest, personalizationProfileCalculationServiceApi.SimulateProfileResponse>(
    (request, done) => reader.simulateProfile(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    personalizationProfileCalculationServiceApi.SimulateProfileRequest.fromPartial({ profileId: "primary-backfill-profile-status" }));
  const kept: BackfillProfileStatusRecord = {
    status: found.result?.status ?? "",
    correlationId: text.normalize(found.result?.correlationId ?? ""),
  };
  await dispatchBackfillProfileStatus("post-approval", kept, runtime);
}
