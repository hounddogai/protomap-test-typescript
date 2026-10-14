/**
 * Routes campaign assets through approval, with escalation and delegation. Remote work stays behind typed client
 * ports.
 */

import * as audiencesAudienceSyncApprovalServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_sync_approval_service.js";
import * as campaignsCampaignAssetApprovalServiceApi from "../../../../.cache/proto/acme/campaigns/v1/campaign_asset_approval_service.js";
import * as campaignsMarketingCampaignQueryServiceApi from "../../../../.cache/proto/acme/campaigns/v1/marketing_campaign_query_service.js";
import * as campaignsMarketingCampaignServiceApi from "../../../../.cache/proto/acme/campaigns/v1/marketing_campaign_service.js";
import * as customersHouseholdQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/household_query_service.js";
import * as customersHouseholdValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/household_validation_service.js";
import * as customersPreferenceValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/preference_validation_service.js";
import * as ledgerLedgerAccountQueryServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_query_service.js";
import * as ledgerLedgerAccountServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_service.js";
import * as notificationsDeliveryAttemptExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_export_service.js";
import * as personalizationAffinityReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_reporting_service.js";
import * as telematicsTelemetryReadingServiceApi from "../../../../.cache/proto/acme/telematics/v1/telemetry_reading_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  operation,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toCampaignAssetRecord } from "../data/records.js";
import { CampaignsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate campaign asset operations and persist audit data.
 */
@injectable()
export class CampaignAssetApprovalWorkflow {
  constructor(
    @inject(CampaignsRepository) private readonly repository: CampaignsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceSyncApprovalService") private readonly audiencesAudienceSyncApprovalClient: audiencesAudienceSyncApprovalServiceApi.AudienceSyncApprovalServiceClient,
    @inject("grpc:acme.campaigns.v1.MarketingCampaignQueryService") private readonly campaignsMarketingCampaignQueryClient: campaignsMarketingCampaignQueryServiceApi.MarketingCampaignQueryServiceClient,
    @inject("grpc:acme.campaigns.v1.MarketingCampaignService") private readonly campaignsMarketingCampaignClient: campaignsMarketingCampaignServiceApi.MarketingCampaignServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdQueryService") private readonly customersHouseholdQueryClient: customersHouseholdQueryServiceApi.HouseholdQueryServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdValidationService") private readonly customersHouseholdValidationClient: customersHouseholdValidationServiceApi.HouseholdValidationServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceValidationService") private readonly customersPreferenceValidationClient: customersPreferenceValidationServiceApi.PreferenceValidationServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountQueryService") private readonly ledgerLedgerAccountQueryClient: ledgerLedgerAccountQueryServiceApi.LedgerAccountQueryServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountService") private readonly ledgerLedgerAccountClient: ledgerLedgerAccountServiceApi.LedgerAccountServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptExportService") private readonly notificationsDeliveryAttemptExportClient: notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityReportingService") private readonly personalizationAffinityReportingClient: personalizationAffinityReportingServiceApi.AffinityReportingServiceClient,
    @inject("grpc:acme.telematics.v1.TelemetryReadingService") private readonly telematicsTelemetryReadingClient: telematicsTelemetryReadingServiceApi.TelemetryReadingServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a campaign asset.
   */
  async approveCampaignAsset(req: campaignsCampaignAssetApprovalServiceApi.ApproveCampaignAssetRequest): Promise<campaignsCampaignAssetApprovalServiceApi.ApproveCampaignAssetResponse> {
    validateContext(req.context);
    if (req.campaignAsset) {
      await this.repository.save(toCampaignAssetRecord(req.context.tenantId, req.campaignAsset));
    }
    await this.repository.record(req.context.tenantId, "ApproveCampaignAsset", req);
    this.logger.info("approve_campaign_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersHouseholdValidationServiceApi.ValidateHouseholdRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{
          children: [{
            location: {
              postalCode: ((req?.campaignAsset?.locator?.$case === "address" ? req?.campaignAsset?.locator.address : undefined)?.postalCode ?? ""),
            },
            manager: { displayName: (req?.campaignAsset?.owner?.displayName ?? "") },
          }],
        }],
      },
    });
    const method1 = "validateHousehold" as const;
    const invoke1: Unary<customersHouseholdValidationServiceApi.ValidateHouseholdRequest, customersHouseholdValidationServiceApi.ValidateHouseholdResponse> =
      (input, done) => this.customersHouseholdValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersHouseholdValidationServiceApi.ValidateHouseholdRequest, customersHouseholdValidationServiceApi.ValidateHouseholdResponse>(invoke1, request1);
    const request2 = audiencesAudienceSyncApprovalServiceApi.EscalateAudienceSyncRequest.fromPartial({
      audienceSync: {
        subject: {
          displayName: (reply1?.household?.manager?.displayName ?? ""),
          email: (req?.details?.approver?.email ?? ""),
        },
      },
      context: req?.context,
      details: {
        approver: {
          displayName: (req?.campaignAsset?.owner?.displayName ?? ""),
          email: (req?.campaignAsset?.owner?.email ?? ""),
        },
      },
    });
    const proxy2 = forwarding(this.audiencesAudienceSyncApprovalClient);
    const invoke2: Unary<audiencesAudienceSyncApprovalServiceApi.EscalateAudienceSyncRequest, audiencesAudienceSyncApprovalServiceApi.EscalateAudienceSyncResponse> =
      (input, done) => proxy2.escalateAudienceSync(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceSyncApprovalServiceApi.EscalateAudienceSyncRequest, audiencesAudienceSyncApprovalServiceApi.EscalateAudienceSyncResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignAssetApprovalServiceApi.ApproveCampaignAssetResponse.fromPartial({
        campaignAsset: { owner: { userId: (reply1?.household?.manager?.userId ?? "") } },
      }),
      campaignsCampaignAssetApprovalServiceApi.ApproveCampaignAssetResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          message: (reply2?.result?.message ?? ""),
        },
      }),
      campaignsCampaignAssetApprovalServiceApi.ApproveCampaignAssetResponse.fromPartial({
        campaignAsset: {
          campaignAssetId: (req?.campaignAssetId ?? ""),
          name: (req?.campaignAsset?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Comments a campaign asset.
   */
  async commentCampaignAssetApproval(req: campaignsCampaignAssetApprovalServiceApi.CommentCampaignAssetApprovalRequest): Promise<campaignsCampaignAssetApprovalServiceApi.CommentCampaignAssetApprovalResponse> {
    validateContext(req.context);
    if (req.campaignAsset) {
      await this.repository.save(toCampaignAssetRecord(req.context.tenantId, req.campaignAsset));
    }
    await this.repository.record(req.context.tenantId, "CommentCampaignAssetApproval", req);
    this.logger.info("comment_campaign_asset_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsMarketingCampaignServiceApi.WatchMarketingCampaignsRequest.fromPartial({
      context: req?.context,
      subscriber: { email: (req?.campaignAsset?.owner?.email ?? "") },
    });
    const stream1 = this.campaignsMarketingCampaignClient.watchMarketingCampaigns(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? campaignsMarketingCampaignServiceApi.WatchMarketingCampaignsResponse.fromPartial({});
    const request2 = customersPreferenceValidationServiceApi.PreviewPreferenceRequest.fromPartial({
      context: req?.context,
      preference: {
        audit: { etag: (req?.campaignAsset?.audit?.etag ?? "") },
        owner: {
          displayName: (req?.details?.approver?.displayName ?? ""),
          email: (req?.details?.approver?.email ?? ""),
          userId: (req?.campaignAsset?.owner?.userId ?? ""),
        },
      },
    });
    const invoke2: Unary<customersPreferenceValidationServiceApi.PreviewPreferenceRequest, customersPreferenceValidationServiceApi.PreviewPreferenceResponse> =
      (input, done) => this.customersPreferenceValidationClient.previewPreference(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersPreferenceValidationServiceApi.PreviewPreferenceRequest, customersPreferenceValidationServiceApi.PreviewPreferenceResponse>(invoke2, request2);
    const request3 = campaignsMarketingCampaignQueryServiceApi.ExportMarketingCampaignsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.preference?.audit?.createdAt,
        region: ((req?.campaignAsset?.locator?.$case === "address" ? req?.campaignAsset?.locator.address : undefined)?.region ?? ""),
      },
    });
    const stream3 = this.campaignsMarketingCampaignQueryClient.exportMarketingCampaigns(request3, metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const messages3 = await collect(stream3);
    const reply3 = messages3.at(-1) ?? campaignsMarketingCampaignQueryServiceApi.ExportMarketingCampaignsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignAssetApprovalServiceApi.CommentCampaignAssetApprovalResponse.fromPartial({
        campaignAsset: {
          audit: { etag: (reply2?.preference?.audit?.etag ?? "") },
          components: { primary: { description: (reply2?.preference?.description ?? "") } },
        },
      }),
      campaignsCampaignAssetApprovalServiceApi.CommentCampaignAssetApprovalResponse.fromPartial({
        campaignAsset: {
          campaignAssetId: (req?.campaignAssetId ?? ""),
          owner: req?.campaignAsset?.owner,
        },
      }),
    );
  }

  /**
   * Delegates a campaign asset.
   */
  async delegateCampaignAssetApproval(req: campaignsCampaignAssetApprovalServiceApi.DelegateCampaignAssetApprovalRequest): Promise<campaignsCampaignAssetApprovalServiceApi.DelegateCampaignAssetApprovalResponse> {
    validateContext(req.context);
    if (req.campaignAsset) {
      await this.repository.save(toCampaignAssetRecord(req.context.tenantId, req.campaignAsset));
    }
    await this.repository.record(req.context.tenantId, "DelegateCampaignAssetApproval", req);
    this.logger.info("delegate_campaign_asset_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.campaignAsset?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.details?.approver?.userId ?? ""),
        region: ((req?.campaignAsset?.locator?.$case === "address" ? req?.campaignAsset?.locator.address : undefined)?.region ?? ""),
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsRequest, campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsResponse> =
      (input, done) => this.campaignsMarketingCampaignClient.searchMarketingCampaigns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsRequest, campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = ledgerLedgerAccountQueryServiceApi.BrowseLedgerAccountsRequest.fromPartial({
      context: input2?.context,
      filter: {
        createdAfter: input2?.campaignAsset?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (input2?.campaignAsset?.owner?.userId ?? ""),
        region: ((input2?.campaignAsset?.locator?.$case === "address" ? input2?.campaignAsset?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke2: Unary<ledgerLedgerAccountQueryServiceApi.BrowseLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.BrowseLedgerAccountsResponse> =
      (input, done) => this.ledgerLedgerAccountQueryClient.browseLedgerAccounts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<ledgerLedgerAccountQueryServiceApi.BrowseLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.BrowseLedgerAccountsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignAssetApprovalServiceApi.DelegateCampaignAssetApprovalResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      campaignsCampaignAssetApprovalServiceApi.DelegateCampaignAssetApprovalResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      campaignsCampaignAssetApprovalServiceApi.DelegateCampaignAssetApprovalResponse.fromPartial({
        campaignAsset: {
          campaignAssetId: (req?.campaignAssetId ?? ""),
          name: (req?.campaignAsset?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Escalates a campaign asset.
   */
  async escalateCampaignAsset(req: campaignsCampaignAssetApprovalServiceApi.EscalateCampaignAssetRequest): Promise<campaignsCampaignAssetApprovalServiceApi.EscalateCampaignAssetResponse> {
    validateContext(req.context);
    if (req.campaignAsset) {
      await this.repository.save(toCampaignAssetRecord(req.context.tenantId, req.campaignAsset));
    }
    await this.repository.record(req.context.tenantId, "EscalateCampaignAsset", req);
    this.logger.info("escalate_campaign_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = telematicsTelemetryReadingServiceApi.WatchTelemetryReadingsRequest.fromPartial({
      context: req?.context,
      subscriber: { email: (req?.campaignAsset?.owner?.email ?? "") },
    });
    const stream1 = this.telematicsTelemetryReadingClient.watchTelemetryReadings(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? telematicsTelemetryReadingServiceApi.WatchTelemetryReadingsResponse.fromPartial({});
    let selected2_1: string | undefined;
    switch (req?.campaignAsset?.locator?.$case) {
      case "address":
        selected2_1 = ((req?.campaignAsset?.locator?.$case === "address" ? req?.campaignAsset?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = personalizationAffinityReportingServiceApi.CountAffinityTotalsRequest.fromPartial({
      context: req?.context,
      filter: { region: (selected2_1 ?? "") },
    });
    const invoke2: Unary<personalizationAffinityReportingServiceApi.CountAffinityTotalsRequest, personalizationAffinityReportingServiceApi.CountAffinityTotalsResponse> =
      (input, done) => this.personalizationAffinityReportingClient.countAffinityTotals(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationAffinityReportingServiceApi.CountAffinityTotalsRequest, personalizationAffinityReportingServiceApi.CountAffinityTotalsResponse>(invoke2, request2);
    const request3 = notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { recipient: { email: (req?.campaignAsset?.owner?.email ?? "") } },
      reason: (req?.reason ?? ""),
    });
    const decoded3 = notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportRequest.fromJSON(
      JSON.parse(JSON.stringify(notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportRequest.toJSON(request3))),
    );
    const invoke3: Unary<notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportResponse> =
      (input, done) => this.notificationsDeliveryAttemptExportClient.shareDeliveryAttemptExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportResponse>(invoke3, decoded3);
    const request4 = customersHouseholdValidationServiceApi.NormalizeHouseholdRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{
          audit: { etag: (req?.campaignAsset?.audit?.etag ?? "") },
          children: [{ manager: { email: (req?.details?.approver?.email ?? "") } }],
        }],
      },
    });
    const envelope4 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.customers.v1.NormalizeHouseholdRequest",
      value: Buffer.from(customersHouseholdValidationServiceApi.NormalizeHouseholdRequest.encode(request4).finish()),
    });
    const unpacked4 = customersHouseholdValidationServiceApi.NormalizeHouseholdRequest.decode(envelope4.value);
    const invoke4: Unary<customersHouseholdValidationServiceApi.NormalizeHouseholdRequest, customersHouseholdValidationServiceApi.NormalizeHouseholdResponse> =
      (input, done) => this.customersHouseholdValidationClient.normalizeHousehold(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<customersHouseholdValidationServiceApi.NormalizeHouseholdRequest, customersHouseholdValidationServiceApi.NormalizeHouseholdResponse>(invoke4, unpacked4);
    this.logger.info("local_audit", { value: (req?.details?.approver?.displayName ?? "") });
    return mergeResponses(
      campaignsCampaignAssetApprovalServiceApi.EscalateCampaignAssetResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      campaignsCampaignAssetApprovalServiceApi.EscalateCampaignAssetResponse.fromPartial({ outcome: { effectiveAt: reply3?.outcome?.effectiveAt } }),
      campaignsCampaignAssetApprovalServiceApi.EscalateCampaignAssetResponse.fromPartial({
        campaignAsset: { audit: { updatedAt: reply4?.household?.audit?.updatedAt } },
        outcome: { effectiveAt: reply4?.outcome?.effectiveAt },
      }),
      campaignsCampaignAssetApprovalServiceApi.EscalateCampaignAssetResponse.fromPartial({
        campaignAsset: {
          campaignAssetId: (req?.campaignAssetId ?? ""),
          name: (req?.campaignAsset?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Lists campaign assets a page at a time.
   */
  async listPendingCampaignAssets(req: campaignsCampaignAssetApprovalServiceApi.ListPendingCampaignAssetsRequest): Promise<campaignsCampaignAssetApprovalServiceApi.ListPendingCampaignAssetsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingCampaignAssets", req);
    this.logger.info("list_pending_campaign_assets", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return campaignsCampaignAssetApprovalServiceApi.ListPendingCampaignAssetsResponse.fromPartial({});
  }

  /**
   * Recalls a campaign asset.
   */
  async recallCampaignAsset(req: campaignsCampaignAssetApprovalServiceApi.RecallCampaignAssetRequest): Promise<campaignsCampaignAssetApprovalServiceApi.RecallCampaignAssetResponse> {
    validateContext(req.context);
    if (req.campaignAsset) {
      await this.repository.save(toCampaignAssetRecord(req.context.tenantId, req.campaignAsset));
    }
    await this.repository.record(req.context.tenantId, "RecallCampaignAsset", req);
    this.logger.info("recall_campaign_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.campaignAsset?.locator?.$case) {
      case "address":
        selected1_1 = ((req?.campaignAsset?.locator?.$case === "address" ? req?.campaignAsset?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.campaignAsset?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.campaignAsset?.owner?.userId ?? ""),
        region: (selected1_1 ?? ""),
      },
    });
    const invoke1: Unary<campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsRequest, campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsResponse> =
      (input, done) => this.campaignsMarketingCampaignClient.searchMarketingCampaigns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsRequest, campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignAssetApprovalServiceApi.RecallCampaignAssetResponse.fromPartial({
        outcome: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      campaignsCampaignAssetApprovalServiceApi.RecallCampaignAssetResponse.fromPartial({
        campaignAsset: {
          campaignAssetId: (req?.campaignAssetId ?? ""),
          status: req?.campaignAsset?.status,
        },
      }),
    );
  }

  /**
   * Rejects a campaign asset.
   */
  async rejectCampaignAsset(req: campaignsCampaignAssetApprovalServiceApi.RejectCampaignAssetRequest): Promise<campaignsCampaignAssetApprovalServiceApi.RejectCampaignAssetResponse> {
    validateContext(req.context);
    if (req.campaignAsset) {
      await this.repository.save(toCampaignAssetRecord(req.context.tenantId, req.campaignAsset));
    }
    await this.repository.record(req.context.tenantId, "RejectCampaignAsset", req);
    this.logger.info("reject_campaign_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersHouseholdQueryServiceApi.BrowseHouseholdsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.campaignAsset?.audit?.createdAt,
        ownerId: (req?.campaignAsset?.owner?.userId ?? ""),
        region: ((req?.campaignAsset?.locator?.$case === "address" ? req?.campaignAsset?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke1: Unary<customersHouseholdQueryServiceApi.BrowseHouseholdsRequest, customersHouseholdQueryServiceApi.BrowseHouseholdsResponse> =
      (input, done) => this.customersHouseholdQueryClient.browseHouseholds(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<customersHouseholdQueryServiceApi.BrowseHouseholdsRequest, customersHouseholdQueryServiceApi.BrowseHouseholdsResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = ledgerLedgerAccountServiceApi.SearchLedgerAccountsRequest.fromPartial({
      context: req?.context,
      filter: {
        region: ((req?.campaignAsset?.locator?.$case === "address" ? req?.campaignAsset?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke2: Unary<ledgerLedgerAccountServiceApi.SearchLedgerAccountsRequest, ledgerLedgerAccountServiceApi.SearchLedgerAccountsResponse> =
      (input, done) => this.ledgerLedgerAccountClient.searchLedgerAccounts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<ledgerLedgerAccountServiceApi.SearchLedgerAccountsRequest, ledgerLedgerAccountServiceApi.SearchLedgerAccountsResponse>(invoke2, request2));
    const request3 = campaignsMarketingCampaignQueryServiceApi.ResolveMarketingCampaignsRequest.fromPartial({ context: req?.context });
    const invoke3: Unary<campaignsMarketingCampaignQueryServiceApi.ResolveMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.ResolveMarketingCampaignsResponse> =
      (input, done) => this.campaignsMarketingCampaignQueryClient.resolveMarketingCampaigns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await workflow("RejectCampaignAsset.ResolveMarketingCampaigns", () => call<campaignsMarketingCampaignQueryServiceApi.ResolveMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.ResolveMarketingCampaignsResponse>(invoke3, request3));
    const request4 = customersHouseholdQueryServiceApi.FindHouseholdsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.campaignAsset?.audit?.updatedAt,
        region: ((req?.campaignAsset?.locator?.$case === "address" ? req?.campaignAsset?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke4: Unary<customersHouseholdQueryServiceApi.FindHouseholdsRequest, customersHouseholdQueryServiceApi.FindHouseholdsResponse> =
      (input, done) => this.customersHouseholdQueryClient.findHouseholds(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task4 = operation(invoke4)(request4);
    const reply4 = await task4();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignAssetApprovalServiceApi.RejectCampaignAssetResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      campaignsCampaignAssetApprovalServiceApi.RejectCampaignAssetResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      campaignsCampaignAssetApprovalServiceApi.RejectCampaignAssetResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      campaignsCampaignAssetApprovalServiceApi.RejectCampaignAssetResponse.fromPartial({
        result: {
          message: (reply4?.result?.message ?? ""),
          status: (reply4?.result?.status ?? ""),
        },
      }),
      campaignsCampaignAssetApprovalServiceApi.RejectCampaignAssetResponse.fromPartial({
        campaignAsset: {
          campaignAssetId: (req?.campaignAssetId ?? ""),
          name: (req?.campaignAsset?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Submits a campaign asset.
   */
  async submitCampaignAsset(req: campaignsCampaignAssetApprovalServiceApi.SubmitCampaignAssetRequest): Promise<campaignsCampaignAssetApprovalServiceApi.SubmitCampaignAssetResponse> {
    validateContext(req.context);
    if (req.campaignAsset) {
      await this.repository.save(toCampaignAssetRecord(req.context.tenantId, req.campaignAsset));
    }
    await this.repository.record(req.context.tenantId, "SubmitCampaignAsset", req);
    this.logger.info("submit_campaign_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsMarketingCampaignQueryServiceApi.FindMarketingCampaignsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.campaignAsset?.audit?.updatedAt,
        ownerId: (req?.details?.approver?.userId ?? ""),
        region: ((req?.campaignAsset?.locator?.$case === "address" ? req?.campaignAsset?.locator.address : undefined)?.region ?? ""),
      },
    });
    const reply1 = await this.workQueue.enqueue<campaignsMarketingCampaignQueryServiceApi.FindMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.FindMarketingCampaignsResponse>(
      "acme.campaigns.v1.CampaignAssetApprovalService/SubmitCampaignAsset:0", request1,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignAssetApprovalServiceApi.SubmitCampaignAssetResponse.fromPartial({ outcome: { status: (reply1?.result?.status ?? "") } }),
      campaignsCampaignAssetApprovalServiceApi.SubmitCampaignAssetResponse.fromPartial({
        campaignAsset: { campaignAssetId: (req?.campaignAssetId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }
}
