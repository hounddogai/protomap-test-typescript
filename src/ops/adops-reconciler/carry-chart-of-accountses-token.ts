import * as accountingChartOfAccountsQueryServiceApi from "../../../.cache/proto/acme/accounting/v1/chart_of_accounts_query_service.js";
import * as campaignsCampaignBudgetValidationServiceApi from "../../../.cache/proto/acme/campaigns/v1/campaign_budget_validation_service.js";
import * as loyaltyLoyaltyMemberCalculationServiceApi from "../../../.cache/proto/acme/loyalty/v1/loyalty_member_calculation_service.js";
import * as mediaTranscodeJobSyncServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_sync_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryChartOfAccountsesToken keeps of each FindChartOfAccountses response. */
interface CarryChartOfAccountsesTokenRecord {
  nextPageToken: string;
  status: string;
  message: string;
}

/** Where carryChartOfAccountsesToken hands each record. */
interface CarryChartOfAccountsesTokenTarget {
  write(record: CarryChartOfAccountsesTokenRecord): Promise<void>;
}

/** Writes records to acme.media.v1.TranscodeJobSyncService. */
class CarryChartOfAccountsesTokenTranscodeJobSync implements CarryChartOfAccountsesTokenTarget {
  private readonly client: mediaTranscodeJobSyncServiceApi.TranscodeJobSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaTranscodeJobSyncServiceApi.TranscodeJobSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: CarryChartOfAccountsesTokenRecord): Promise<void> {
    await call<mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsRequest, mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsResponse>(
      (request, done) => this.client.reconcileTranscodeJobs(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsRequest.fromPartial({ transcodeJobId: record.status, details: { checksum: record.message, resolution: record.nextPageToken } }));
  }
}

/** Sends records to acme.campaigns.v1.CampaignBudgetValidationService. */
class CarryChartOfAccountsesTokenCampaignBudgetValidation implements CarryChartOfAccountsesTokenTarget {
  private readonly client: campaignsCampaignBudgetValidationServiceApi.CampaignBudgetValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new campaignsCampaignBudgetValidationServiceApi.CampaignBudgetValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: CarryChartOfAccountsesTokenRecord): Promise<void> {
    await retry(() => call<campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetResponse>(
      (request, done) => this.client.previewCampaignBudget(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetRequest.fromPartial({ reason: record.message, campaignBudget: { currencyCode: record.nextPageToken } })));
  }
}

/** Passes records to acme.loyalty.v1.LoyaltyMemberCalculationService. */
class CarryChartOfAccountsesTokenLoyaltyMemberCalculation implements CarryChartOfAccountsesTokenTarget {
  private readonly client: loyaltyLoyaltyMemberCalculationServiceApi.LoyaltyMemberCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new loyaltyLoyaltyMemberCalculationServiceApi.LoyaltyMemberCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: CarryChartOfAccountsesTokenRecord): Promise<void> {
    await call<loyaltyLoyaltyMemberCalculationServiceApi.QuoteLoyaltyMemberRequest, loyaltyLoyaltyMemberCalculationServiceApi.QuoteLoyaltyMemberResponse>(
      (request, done) => this.client.quoteLoyaltyMember(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      loyaltyLoyaltyMemberCalculationServiceApi.QuoteLoyaltyMemberRequest.fromPartial({ loyaltyMemberId: record.message, loyaltyMember: { currencyCode: record.status } }));
  }
}

/** Runs the action registered for kind. */
async function actOnCarryChartOfAccountsesToken(kind: string, record: CarryChartOfAccountsesTokenRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "transcode-job-sync": () => new CarryChartOfAccountsesTokenTranscodeJobSync(runtime).write(record),
    "campaign-budget-validation": () => new CarryChartOfAccountsesTokenCampaignBudgetValidation(runtime).write(record),
    "loyalty-member-calculation": () => new CarryChartOfAccountsesTokenLoyaltyMemberCalculation(runtime).write(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.accounting.v1.ChartOfAccountsQueryService/FindChartOfAccountses and hands what it keeps to the
 * sink of its kind.
 */
export async function carryChartOfAccountsesToken(runtime: Runtime): Promise<void> {
  const origin = new accountingChartOfAccountsQueryServiceApi.ChartOfAccountsQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<accountingChartOfAccountsQueryServiceApi.FindChartOfAccountsesRequest, accountingChartOfAccountsQueryServiceApi.FindChartOfAccountsesResponse>(
    (request, done) => origin.findChartOfAccountses(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    accountingChartOfAccountsQueryServiceApi.FindChartOfAccountsesRequest.fromPartial({ orderBy: "default-carry-chart-of-accountses-token" }));
  const record: CarryChartOfAccountsesTokenRecord = {
    nextPageToken: current.pageInfo?.nextPageToken ?? "",
    status: current.result?.status ?? "",
    message: current.result?.message ?? "",
  };
  await actOnCarryChartOfAccountsesToken("campaign-budget-validation", record, runtime);
}
