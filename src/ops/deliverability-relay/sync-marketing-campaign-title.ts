import * as campaignsMarketingCampaignApprovalServiceApi from "../../../.cache/proto/acme/campaigns/v1/marketing_campaign_approval_service.js";
import * as contentContentRevisionApprovalServiceApi from "../../../.cache/proto/acme/content/v1/content_revision_approval_service.js";
import * as itsmIncidentCalculationServiceApi from "../../../.cache/proto/acme/itsm/v1/incident_calculation_service.js";
import * as ledgerLedgerAccountValidationServiceApi from "../../../.cache/proto/acme/ledger/v1/ledger_account_validation_service.js";
import * as localizationTranslationJobReportingServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_reporting_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncMarketingCampaignTitle keeps of each ApproveMarketingCampaign response. */
interface SyncMarketingCampaignTitleRecord {
  title: string;
  marketingCampaignId: string;
}

/** Where syncMarketingCampaignTitle hands each record. */
interface SyncMarketingCampaignTitleSink {
  forward(record: SyncMarketingCampaignTitleRecord): Promise<void>;
}

/** Writes records to acme.itsm.v1.IncidentCalculationService. */
class SyncMarketingCampaignTitleIncidentCalculation implements SyncMarketingCampaignTitleSink {
  private readonly client: itsmIncidentCalculationServiceApi.IncidentCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new itsmIncidentCalculationServiceApi.IncidentCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SyncMarketingCampaignTitleRecord): Promise<void> {
    await call<itsmIncidentCalculationServiceApi.GetIncidentRatesRequest, itsmIncidentCalculationServiceApi.GetIncidentRatesResponse>(
      (request, done) => this.client.getIncidentRates(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      itsmIncidentCalculationServiceApi.GetIncidentRatesRequest.fromPartial({ incidentId: record.marketingCampaignId }));
  }
}

/** Hands records to acme.ledger.v1.LedgerAccountValidationService. */
class SyncMarketingCampaignTitleLedgerAccountValidation implements SyncMarketingCampaignTitleSink {
  private readonly client: ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SyncMarketingCampaignTitleRecord): Promise<void> {
    await call<ledgerLedgerAccountValidationServiceApi.GetLedgerAccountRulesRequest, ledgerLedgerAccountValidationServiceApi.GetLedgerAccountRulesResponse>(
      (request, done) => this.client.getLedgerAccountRules(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      ledgerLedgerAccountValidationServiceApi.GetLedgerAccountRulesRequest.fromPartial({ ledgerAccountId: record.title }));
  }
}

/** Passes records to acme.content.v1.ContentRevisionApprovalService. */
class SyncMarketingCampaignTitleContentRevisionApproval implements SyncMarketingCampaignTitleSink {
  private readonly client: contentContentRevisionApprovalServiceApi.ContentRevisionApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentContentRevisionApprovalServiceApi.ContentRevisionApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SyncMarketingCampaignTitleRecord): Promise<void> {
    await call<contentContentRevisionApprovalServiceApi.DelegateContentRevisionApprovalRequest, contentContentRevisionApprovalServiceApi.DelegateContentRevisionApprovalResponse>(
      (request, done) => this.client.delegateContentRevisionApproval(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      contentContentRevisionApprovalServiceApi.DelegateContentRevisionApprovalRequest.fromPartial({ contentRevision: { kind: record.marketingCampaignId, correlationId: record.title } }));
  }
}

/** Sends records to acme.localization.v1.TranslationJobReportingService. */
class SyncMarketingCampaignTitleTranslationJobReporting implements SyncMarketingCampaignTitleSink {
  private readonly client: localizationTranslationJobReportingServiceApi.TranslationJobReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationTranslationJobReportingServiceApi.TranslationJobReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SyncMarketingCampaignTitleRecord): Promise<void> {
    await call<localizationTranslationJobReportingServiceApi.GenerateTranslationJobReportRequest, localizationTranslationJobReportingServiceApi.GenerateTranslationJobReportResponse>(
      (request, done) => this.client.generateTranslationJobReport(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      localizationTranslationJobReportingServiceApi.GenerateTranslationJobReportRequest.fromPartial({ reason: record.title, translationJobId: record.marketingCampaignId }));
  }
}

/**
 * Reads acme.campaigns.v1.MarketingCampaignApprovalService/ApproveMarketingCampaign and hands what it keeps
 * to the sink of its kind.
 */
export async function syncMarketingCampaignTitle(runtime: Runtime): Promise<void> {
  const origin = new campaignsMarketingCampaignApprovalServiceApi.MarketingCampaignApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<campaignsMarketingCampaignApprovalServiceApi.ApproveMarketingCampaignRequest, campaignsMarketingCampaignApprovalServiceApi.ApproveMarketingCampaignResponse>(
    (request, done) => origin.approveMarketingCampaign(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    campaignsMarketingCampaignApprovalServiceApi.ApproveMarketingCampaignRequest.fromPartial({ marketingCampaignId: "main-sync-marketing-campaign-title" })));
  const kept: SyncMarketingCampaignTitleRecord = {
    title: text.normalize(found.marketingCampaign?.title ?? ""),
    marketingCampaignId: found.marketingCampaign?.marketingCampaignId ?? "",
  };
  const registry: Record<string, SyncMarketingCampaignTitleSink> = {};
  for (const entry of [
    { kind: "incident-calculation", sink: new SyncMarketingCampaignTitleIncidentCalculation(runtime) },
    { kind: "ledger-account-validation", sink: new SyncMarketingCampaignTitleLedgerAccountValidation(runtime) },
    { kind: "content-revision-approval", sink: new SyncMarketingCampaignTitleContentRevisionApproval(runtime) },
    { kind: "translation-job-reporting", sink: new SyncMarketingCampaignTitleTranslationJobReporting(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["content-revision-approval"]!.forward(kept);
}
