import * as campaignsCampaignBudgetWorkflowServiceApi from "../../../.cache/proto/acme/campaigns/v1/campaign_budget_workflow_service.js";
import * as communityForumQueryServiceApi from "../../../.cache/proto/acme/community/v1/forum_query_service.js";
import * as localizationLocaleApprovalServiceApi from "../../../.cache/proto/acme/localization/v1/locale_approval_service.js";
import * as webbffWidgetLayoutQueryServiceApi from "../../../.cache/proto/acme/webbff/v1/widget_layout_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillWidgetLayoutsMessage keeps of each BrowseWidgetLayouts response. */
interface BackfillWidgetLayoutsMessageRecord {
  message: string;
  correlationId: string;
}

/** Where backfillWidgetLayoutsMessage hands each record. */
interface BackfillWidgetLayoutsMessageDestination {
  forward(record: BackfillWidgetLayoutsMessageRecord): Promise<void>;
}

/** Sends records to acme.localization.v1.LocaleApprovalService. */
class BackfillWidgetLayoutsMessageLocaleApproval implements BackfillWidgetLayoutsMessageDestination {
  private readonly client: localizationLocaleApprovalServiceApi.LocaleApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationLocaleApprovalServiceApi.LocaleApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: BackfillWidgetLayoutsMessageRecord): Promise<void> {
    await call<localizationLocaleApprovalServiceApi.DelegateLocaleApprovalRequest, localizationLocaleApprovalServiceApi.DelegateLocaleApprovalResponse>(
      (request, done) => this.client.delegateLocaleApproval(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      localizationLocaleApprovalServiceApi.DelegateLocaleApprovalRequest.fromPartial({ reason: record.message }));
  }
}

/** Passes records to acme.community.v1.ForumQueryService. */
class BackfillWidgetLayoutsMessageForumQuery implements BackfillWidgetLayoutsMessageDestination {
  private readonly client: communityForumQueryServiceApi.ForumQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityForumQueryServiceApi.ForumQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: BackfillWidgetLayoutsMessageRecord): Promise<void> {
    await call<communityForumQueryServiceApi.PeekForumRequest, communityForumQueryServiceApi.PeekForumResponse>(
      (request, done) => this.client.peekForum(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      communityForumQueryServiceApi.PeekForumRequest.fromPartial({ forumId: record.message }));
  }
}

/** Passes records to acme.campaigns.v1.CampaignBudgetWorkflowService. */
class BackfillWidgetLayoutsMessageCampaignBudgetWorkflow implements BackfillWidgetLayoutsMessageDestination {
  private readonly client: campaignsCampaignBudgetWorkflowServiceApi.CampaignBudgetWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new campaignsCampaignBudgetWorkflowServiceApi.CampaignBudgetWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: BackfillWidgetLayoutsMessageRecord): Promise<void> {
    await call<campaignsCampaignBudgetWorkflowServiceApi.RetryCampaignBudgetWorkflowRequest, campaignsCampaignBudgetWorkflowServiceApi.RetryCampaignBudgetWorkflowResponse>(
      (request, done) => this.client.retryCampaignBudgetWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      campaignsCampaignBudgetWorkflowServiceApi.RetryCampaignBudgetWorkflowRequest.fromPartial({ campaignBudgetId: record.message }));
  }
}

/**
 * Reads acme.webbff.v1.WidgetLayoutQueryService/BrowseWidgetLayouts and hands what it keeps to the sink of
 * its kind.
 */
export async function backfillWidgetLayoutsMessage(runtime: Runtime): Promise<void> {
  const origin = new webbffWidgetLayoutQueryServiceApi.WidgetLayoutQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<webbffWidgetLayoutQueryServiceApi.BrowseWidgetLayoutsRequest, webbffWidgetLayoutQueryServiceApi.BrowseWidgetLayoutsResponse>(
    (request, done) => origin.browseWidgetLayouts(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    webbffWidgetLayoutQueryServiceApi.BrowseWidgetLayoutsRequest.fromPartial({ orderBy: "nightly-backfill-widget-layouts-message" }));
  const record: BackfillWidgetLayoutsMessageRecord = {
    message: response.result?.message ?? "",
    correlationId: response.result?.correlationId ?? "",
  };
  const sinks: BackfillWidgetLayoutsMessageDestination[] = [
    new BackfillWidgetLayoutsMessageLocaleApproval(runtime),
    new BackfillWidgetLayoutsMessageForumQuery(runtime),
    new BackfillWidgetLayoutsMessageCampaignBudgetWorkflow(runtime),
  ];
  for (const sink of sinks) {
    await sink.forward(record);
  }
}
