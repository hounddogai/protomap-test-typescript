/**
 * Runs the long-lived workflow that takes a campaign asset from start to finish. Remote work stays behind typed
 * client ports.
 */

import * as auditAuditEventQueryServiceApi from "../../../../../.cache/proto/acme/audit/v1/audit_event_query_service.js";
import * as campaignsCampaignAssetApprovalServiceApi from "../../../../../.cache/proto/acme/campaigns/v1/campaign_asset_approval_service.js";
import * as campaignsCampaignAssetWorkflowServiceApi from "../../../../../.cache/proto/acme/campaigns/v1/campaign_asset_workflow_service.js";
import * as campaignsCampaignBudgetApprovalServiceApi from "../../../../../.cache/proto/acme/campaigns/v1/campaign_budget_approval_service.js";
import * as campaignsCampaignBudgetValidationServiceApi from "../../../../../.cache/proto/acme/campaigns/v1/campaign_budget_validation_service.js";
import * as campaignsMarketingCampaignQueryServiceApi from "../../../../../.cache/proto/acme/campaigns/v1/marketing_campaign_query_service.js";
import * as campaignsMarketingCampaignServiceApi from "../../../../../.cache/proto/acme/campaigns/v1/marketing_campaign_service.js";
import * as campaignsMarketingCampaignWorkflowServiceApi from "../../../../../.cache/proto/acme/campaigns/v1/marketing_campaign_workflow_service.js";
import * as concessionsConcessionStandCalculationServiceApi from "../../../../../.cache/proto/acme/concessions/v1/concession_stand_calculation_service.js";
import * as contentArticleApprovalServiceApi from "../../../../../.cache/proto/acme/content/v1/article_approval_service.js";
import * as contentContentRevisionApprovalServiceApi from "../../../../../.cache/proto/acme/content/v1/content_revision_approval_service.js";
import * as customersConsentRecordCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as customersCustomerCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/customer_calculation_service.js";
import * as customersCustomerSegmentCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/customer_segment_calculation_service.js";
import * as customersCustomerValidationServiceApi from "../../../../../.cache/proto/acme/customers/v1/customer_validation_service.js";
import * as customersHouseholdCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/household_calculation_service.js";
import * as customersHouseholdValidationServiceApi from "../../../../../.cache/proto/acme/customers/v1/household_validation_service.js";
import * as datasetsDatasetServiceApi from "../../../../../.cache/proto/acme/datasets/v1/dataset_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  operation,
  promised,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../../platform/rpc.js";
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toCampaignAssetRecord } from "../../data/records.js";
import { CampaignsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate campaign asset operations and persist audit data.
 */
@injectable()
export class CampaignAssetWorkflowWorkflow {
  constructor(
    @inject(CampaignsRepository) private readonly repository: CampaignsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventQueryService") private readonly auditAuditEventQueryClient: auditAuditEventQueryServiceApi.AuditEventQueryServiceClient,
    @inject("grpc:acme.campaigns.v1.CampaignAssetApprovalService") private readonly campaignsCampaignAssetApprovalClient: campaignsCampaignAssetApprovalServiceApi.CampaignAssetApprovalServiceClient,
    @inject("grpc:acme.campaigns.v1.CampaignBudgetApprovalService") private readonly campaignsCampaignBudgetApprovalClient: campaignsCampaignBudgetApprovalServiceApi.CampaignBudgetApprovalServiceClient,
    @inject("grpc:acme.campaigns.v1.CampaignBudgetValidationService") private readonly campaignsCampaignBudgetValidationClient: campaignsCampaignBudgetValidationServiceApi.CampaignBudgetValidationServiceClient,
    @inject("grpc:acme.campaigns.v1.MarketingCampaignQueryService") private readonly campaignsMarketingCampaignQueryClient: campaignsMarketingCampaignQueryServiceApi.MarketingCampaignQueryServiceClient,
    @inject("grpc:acme.campaigns.v1.MarketingCampaignService") private readonly campaignsMarketingCampaignClient: campaignsMarketingCampaignServiceApi.MarketingCampaignServiceClient,
    @inject("grpc:acme.campaigns.v1.MarketingCampaignWorkflowService") private readonly campaignsMarketingCampaignWorkflowClient: campaignsMarketingCampaignWorkflowServiceApi.MarketingCampaignWorkflowServiceClient,
    @inject("grpc:acme.concessions.v1.ConcessionStandCalculationService") private readonly concessionsConcessionStandCalculationClient: concessionsConcessionStandCalculationServiceApi.ConcessionStandCalculationServiceClient,
    @inject("grpc:acme.content.v1.ArticleApprovalService") private readonly contentArticleApprovalClient: contentArticleApprovalServiceApi.ArticleApprovalServiceClient,
    @inject("grpc:acme.content.v1.ContentRevisionApprovalService") private readonly contentContentRevisionApprovalClient: contentContentRevisionApprovalServiceApi.ContentRevisionApprovalServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordCalculationService") private readonly customersConsentRecordCalculationClient: customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerCalculationService") private readonly customersCustomerCalculationClient: customersCustomerCalculationServiceApi.CustomerCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentCalculationService") private readonly customersCustomerSegmentCalculationClient: customersCustomerSegmentCalculationServiceApi.CustomerSegmentCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerValidationService") private readonly customersCustomerValidationClient: customersCustomerValidationServiceApi.CustomerValidationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdCalculationService") private readonly customersHouseholdCalculationClient: customersHouseholdCalculationServiceApi.HouseholdCalculationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdValidationService") private readonly customersHouseholdValidationClient: customersHouseholdValidationServiceApi.HouseholdValidationServiceClient,
    @inject("grpc:acme.datasets.v1.DatasetService") private readonly datasetsDatasetClient: datasetsDatasetServiceApi.DatasetServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagQueryService") private readonly featureflagsFeatureFlagQueryClient: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexValidationService") private readonly searchSearchIndexValidationClient: searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a campaign asset.
   */
  async advanceCampaignAssetWorkflow(req: campaignsCampaignAssetWorkflowServiceApi.AdvanceCampaignAssetWorkflowRequest): Promise<campaignsCampaignAssetWorkflowServiceApi.AdvanceCampaignAssetWorkflowResponse> {
    validateContext(req.context);
    if (req.campaignAsset) {
      await this.repository.save(toCampaignAssetRecord(req.context.tenantId, req.campaignAsset));
    }
    await this.repository.record(req.context.tenantId, "AdvanceCampaignAssetWorkflow", req);
    this.logger.info("advance_campaign_asset_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_2: string | undefined;
    switch (req?.campaignAsset?.locator?.$case) {
      case "address":
        selected1_2 = ((req?.campaignAsset?.locator?.$case === "address" ? req?.campaignAsset?.locator.address : undefined)?.recipient ?? "");
        break;
      default:
        selected1_2 = "";
    }
    const request1 = searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest.fromPartial({
      context: req?.context,
      searchIndex: {
        locator: { $case: "address", address: { recipient: (selected1_2 ?? "") } },
        components: { primary: {
          componentId: (req?.campaignAsset?.components?.["primary"]?.componentId ?? ""),
        } },
        owner: {
          displayName: (req?.campaignAsset?.owner?.displayName ?? ""),
          userId: (req?.campaignAsset?.owner?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest, searchSearchIndexValidationServiceApi.NormalizeSearchIndexResponse> =
      (input, done) => this.searchSearchIndexValidationClient.normalizeSearchIndex(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest, searchSearchIndexValidationServiceApi.NormalizeSearchIndexResponse>(invoke1, request1);
    const request2 = campaignsMarketingCampaignQueryServiceApi.ExportMarketingCampaignsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.campaignAsset?.audit?.updatedAt,
        region: ((req?.campaignAsset?.locator?.$case === "address" ? req?.campaignAsset?.locator.address : undefined)?.region ?? ""),
      },
    });
    const stream2 = this.campaignsMarketingCampaignQueryClient.exportMarketingCampaigns(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? campaignsMarketingCampaignQueryServiceApi.ExportMarketingCampaignsResponse.fromPartial({});
    const request3 = customersHouseholdValidationServiceApi.NormalizeHouseholdRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{
          children: [{
            audit: { createdBy: (req?.campaignAsset?.audit?.createdBy ?? "") },
            location: {
              lines: ((reply1?.searchIndex?.locator?.$case === "address" ? reply1?.searchIndex?.locator.address : undefined)?.lines ?? []).map((value) => value),
            },
          }],
        }],
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<customersHouseholdValidationServiceApi.NormalizeHouseholdRequest, customersHouseholdValidationServiceApi.NormalizeHouseholdResponse> =
      (input, done) => this.customersHouseholdValidationClient.normalizeHousehold(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<customersHouseholdValidationServiceApi.NormalizeHouseholdRequest, customersHouseholdValidationServiceApi.NormalizeHouseholdResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignAssetWorkflowServiceApi.AdvanceCampaignAssetWorkflowResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      campaignsCampaignAssetWorkflowServiceApi.AdvanceCampaignAssetWorkflowResponse.fromPartial({
        campaignAsset: { audit: { updatedBy: (reply3?.household?.audit?.updatedBy ?? "") } },
        outcome: { referenceId: (reply3?.outcome?.referenceId ?? "") },
      }),
      campaignsCampaignAssetWorkflowServiceApi.AdvanceCampaignAssetWorkflowResponse.fromPartial({
        campaignAsset: {
          campaignAssetId: (req?.campaignAssetId ?? ""),
          status: req?.campaignAsset?.status,
        },
      }),
    );
  }

  /**
   * Cancels a campaign asset.
   */
  async cancelCampaignAssetWorkflow(req: campaignsCampaignAssetWorkflowServiceApi.CancelCampaignAssetWorkflowRequest): Promise<campaignsCampaignAssetWorkflowServiceApi.CancelCampaignAssetWorkflowResponse> {
    validateContext(req.context);
    if (req.campaignAsset) {
      await this.repository.save(toCampaignAssetRecord(req.context.tenantId, req.campaignAsset));
    }
    await this.repository.record(req.context.tenantId, "CancelCampaignAssetWorkflow", req);
    this.logger.info("cancel_campaign_asset_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationRequest.fromPartial({
      context: input1?.context,
      customerSegment: { audit: { createdAt: input1?.campaignAsset?.audit?.createdAt } },
      details: {
        contact: { preferredChannel: (input1?.details?.notify?.preferredChannel ?? "") },
      },
    });
    const invoke1: Unary<customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationRequest, customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationResponse> =
      (input, done) => this.customersCustomerSegmentCalculationClient.explainCustomerSegmentCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationRequest, customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationResponse>(invoke1, request1);
    const request2 = customersHouseholdCalculationServiceApi.EstimateHouseholdRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{
          children: [{
            audit: {
              etag: (req?.campaignAsset?.audit?.etag ?? ""),
              updatedBy: (reply1?.customerSegment?.audit?.updatedBy ?? ""),
            },
          }],
        }],
      },
    });
    const cloned2: customersHouseholdCalculationServiceApi.EstimateHouseholdRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<customersHouseholdCalculationServiceApi.EstimateHouseholdRequest, customersHouseholdCalculationServiceApi.EstimateHouseholdResponse> =
      (input, done) => this.customersHouseholdCalculationClient.estimateHousehold(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersHouseholdCalculationServiceApi.EstimateHouseholdRequest, customersHouseholdCalculationServiceApi.EstimateHouseholdResponse>(invoke2, cloned2);
    const request3 = campaignsCampaignAssetApprovalServiceApi.DelegateCampaignAssetApprovalRequest.fromPartial({
      campaignAsset: {
        locator: { $case: "address", address: {
          recipient: ((req?.campaignAsset?.locator?.$case === "address" ? req?.campaignAsset?.locator.address : undefined)?.recipient ?? ""),
        } },
      },
      context: req?.context,
    });
    const decoded3 = campaignsCampaignAssetApprovalServiceApi.DelegateCampaignAssetApprovalRequest.fromJSON(
      JSON.parse(JSON.stringify(campaignsCampaignAssetApprovalServiceApi.DelegateCampaignAssetApprovalRequest.toJSON(request3))),
    );
    const invoke3: Unary<campaignsCampaignAssetApprovalServiceApi.DelegateCampaignAssetApprovalRequest, campaignsCampaignAssetApprovalServiceApi.DelegateCampaignAssetApprovalResponse> =
      (input, done) => this.campaignsCampaignAssetApprovalClient.delegateCampaignAssetApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<campaignsCampaignAssetApprovalServiceApi.DelegateCampaignAssetApprovalRequest, campaignsCampaignAssetApprovalServiceApi.DelegateCampaignAssetApprovalResponse>(invoke3, decoded3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignAssetWorkflowServiceApi.CancelCampaignAssetWorkflowResponse.fromPartial({ result: { status: (reply1?.outcome?.status ?? "") } }),
      campaignsCampaignAssetWorkflowServiceApi.CancelCampaignAssetWorkflowResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      campaignsCampaignAssetWorkflowServiceApi.CancelCampaignAssetWorkflowResponse.fromPartial({
        campaignAsset: { owner: { userId: (reply3?.campaignAsset?.owner?.userId ?? "") } },
      }),
      campaignsCampaignAssetWorkflowServiceApi.CancelCampaignAssetWorkflowResponse.fromPartial({
        campaignAsset: {
          campaignAssetId: (req?.campaignAssetId ?? ""),
          status: req?.campaignAsset?.status,
        },
      }),
    );
  }

  /**
   * Returns a campaign asset.
   */
  async inspectCampaignAssetWorkflow(req: campaignsCampaignAssetWorkflowServiceApi.InspectCampaignAssetWorkflowRequest): Promise<campaignsCampaignAssetWorkflowServiceApi.InspectCampaignAssetWorkflowResponse> {
    validateContext(req.context);
    if (!req.campaignAssetId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "campaign_asset_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectCampaignAssetWorkflow", req);
    this.logger.info("inspect_campaign_asset_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsMarketingCampaignServiceApi.CreateMarketingCampaignRequest.fromPartial({
      context: req?.context,
      marketingCampaign: { organizer: { email: (req?.context?.actor?.email ?? "") } },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.campaigns.v1.CreateMarketingCampaignRequest",
      value: Buffer.from(campaignsMarketingCampaignServiceApi.CreateMarketingCampaignRequest.encode(request1).finish()),
    });
    const unpacked1 = campaignsMarketingCampaignServiceApi.CreateMarketingCampaignRequest.decode(envelope1.value);
    const invoke1: Unary<campaignsMarketingCampaignServiceApi.CreateMarketingCampaignRequest, campaignsMarketingCampaignServiceApi.CreateMarketingCampaignResponse> =
      (input, done) => this.campaignsMarketingCampaignClient.createMarketingCampaign(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<campaignsMarketingCampaignServiceApi.CreateMarketingCampaignRequest, campaignsMarketingCampaignServiceApi.CreateMarketingCampaignResponse>(invoke1, unpacked1);
    const request2 = featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.marketingCampaign?.audit?.updatedAt,
        ownerId: (reply1?.marketingCampaign?.organizer?.userId ?? ""),
        region: (reply1?.marketingCampaign?.location?.region ?? ""),
      },
    });
    const client2 = this.clients.get<featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient>("acme.featureflags.v1.FeatureFlagQueryService");
    const invoke2: Unary<featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsResponse> =
      (input, done) => client2.countFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsResponse>(invoke2, request2);
    return mergeResponses(
      campaignsCampaignAssetWorkflowServiceApi.InspectCampaignAssetWorkflowResponse.fromPartial({
        campaignAsset: { audit: { etag: (reply1?.marketingCampaign?.audit?.etag ?? "") } },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      campaignsCampaignAssetWorkflowServiceApi.InspectCampaignAssetWorkflowResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      campaignsCampaignAssetWorkflowServiceApi.InspectCampaignAssetWorkflowResponse.fromPartial({ campaignAsset: { campaignAssetId: (req?.campaignAssetId ?? "") } }),
    );
  }

  /**
   * Lists campaign assets a page at a time.
   */
  async listCampaignAssetWorkflows(req: campaignsCampaignAssetWorkflowServiceApi.ListCampaignAssetWorkflowsRequest): Promise<campaignsCampaignAssetWorkflowServiceApi.ListCampaignAssetWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListCampaignAssetWorkflows", req);
    this.logger.info("list_campaign_asset_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
    });
    const invoke1: Unary<featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagQueryClient.browseFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = campaignsCampaignBudgetApprovalServiceApi.DelegateCampaignBudgetApprovalRequest.fromPartial({
      campaignBudget: {
        audit: { createdAt: req?.filter?.createdAfter },
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
      context: req?.context,
      details: {
        approver: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke2: Unary<campaignsCampaignBudgetApprovalServiceApi.DelegateCampaignBudgetApprovalRequest, campaignsCampaignBudgetApprovalServiceApi.DelegateCampaignBudgetApprovalResponse> =
      (input, done) => this.campaignsCampaignBudgetApprovalClient.delegateCampaignBudgetApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<campaignsCampaignBudgetApprovalServiceApi.DelegateCampaignBudgetApprovalRequest, campaignsCampaignBudgetApprovalServiceApi.DelegateCampaignBudgetApprovalResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      campaignsCampaignAssetWorkflowServiceApi.ListCampaignAssetWorkflowsResponse.fromPartial({ pageInfo: { totalSize: (reply1?.pageInfo?.totalSize ?? 0) } }),
      campaignsCampaignAssetWorkflowServiceApi.ListCampaignAssetWorkflowsResponse.fromPartial({
        campaignAssets: [{ owner: { email: (reply2?.campaignBudget?.contact?.email ?? "") } }],
      }),
    );
  }

  /**
   * Pauses a campaign asset.
   */
  async pauseCampaignAssetWorkflow(req: campaignsCampaignAssetWorkflowServiceApi.PauseCampaignAssetWorkflowRequest): Promise<campaignsCampaignAssetWorkflowServiceApi.PauseCampaignAssetWorkflowResponse> {
    validateContext(req.context);
    if (req.campaignAsset) {
      await this.repository.save(toCampaignAssetRecord(req.context.tenantId, req.campaignAsset));
    }
    await this.repository.record(req.context.tenantId, "PauseCampaignAssetWorkflow", req);
    this.logger.info("pause_campaign_asset_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsMarketingCampaignServiceApi.CloneMarketingCampaignRequest.fromPartial({
      context: req?.context,
      marketingCampaign: {
        audit: { updatedAt: req?.campaignAsset?.audit?.updatedAt },
        organizer: { email: (req?.campaignAsset?.owner?.email ?? "") },
        participants: [{
          contact: {
            phone: (req?.details?.notify?.phone ?? ""),
            preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
          },
        }],
      },
    });
    const invoke1: Unary<campaignsMarketingCampaignServiceApi.CloneMarketingCampaignRequest, campaignsMarketingCampaignServiceApi.CloneMarketingCampaignResponse> =
      (input, done) => this.campaignsMarketingCampaignClient.cloneMarketingCampaign(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("PauseCampaignAssetWorkflow.CloneMarketingCampaign", () => call<campaignsMarketingCampaignServiceApi.CloneMarketingCampaignRequest, campaignsMarketingCampaignServiceApi.CloneMarketingCampaignResponse>(invoke1, request1));
    const request2 = auditAuditEventQueryServiceApi.CountAuditEventsRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply1?.marketingCampaign?.location?.region ?? "") },
    });
    const invoke2: Unary<auditAuditEventQueryServiceApi.CountAuditEventsRequest, auditAuditEventQueryServiceApi.CountAuditEventsResponse> =
      (input, done) => this.auditAuditEventQueryClient.countAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignAssetWorkflowServiceApi.PauseCampaignAssetWorkflowResponse.fromPartial({
        campaignAsset: {
          audit: { updatedBy: (reply1?.marketingCampaign?.audit?.updatedBy ?? "") },
        },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      campaignsCampaignAssetWorkflowServiceApi.PauseCampaignAssetWorkflowResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      campaignsCampaignAssetWorkflowServiceApi.PauseCampaignAssetWorkflowResponse.fromPartial({
        campaignAsset: {
          campaignAssetId: (req?.campaignAssetId ?? ""),
          code: (req?.campaignAsset?.code ?? ""),
        },
      }),
    );
  }

  /**
   * Resumes a campaign asset.
   */
  async resumeCampaignAssetWorkflow(req: campaignsCampaignAssetWorkflowServiceApi.ResumeCampaignAssetWorkflowRequest): Promise<campaignsCampaignAssetWorkflowServiceApi.ResumeCampaignAssetWorkflowResponse> {
    validateContext(req.context);
    if (req.campaignAsset) {
      await this.repository.save(toCampaignAssetRecord(req.context.tenantId, req.campaignAsset));
    }
    await this.repository.record(req.context.tenantId, "ResumeCampaignAssetWorkflow", req);
    this.logger.info("resume_campaign_asset_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersConsentRecordCalculationServiceApi.EstimateConsentRecordRequest.fromPartial({
      consentRecord: {
        measurements: [{ unit: (req?.campaignAsset?.dimensions?.unit ?? "") }],
      },
      context: req?.context,
      details: {
        destination: {
          countryCode: ((req?.campaignAsset?.locator?.$case === "address" ? req?.campaignAsset?.locator.address : undefined)?.countryCode ?? ""),
          region: ((req?.campaignAsset?.locator?.$case === "address" ? req?.campaignAsset?.locator.address : undefined)?.region ?? ""),
        },
      },
    });
    const reply1 = await this.workQueue.enqueue<customersConsentRecordCalculationServiceApi.EstimateConsentRecordRequest, customersConsentRecordCalculationServiceApi.EstimateConsentRecordResponse>(
      "acme.campaigns.v1.CampaignAssetWorkflowService/ResumeCampaignAssetWorkflow:0", request1,
    );
    let selected2_1: string | undefined;
    switch (req?.campaignAsset?.locator?.$case) {
      case "address":
        selected2_1 = ((req?.campaignAsset?.locator?.$case === "address" ? req?.campaignAsset?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.consentRecord?.occurredAt,
        region: (selected2_1 ?? ""),
      },
    });
    const invoke2: Unary<campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsRequest, campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsResponse> =
      (input, done) => this.campaignsMarketingCampaignClient.searchMarketingCampaigns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsRequest, campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsResponse>(invoke2, request2);
    const request3 = datasetsDatasetServiceApi.BatchGetDatasetsRequest.fromPartial({ context: req?.context });
    const invoke3: Unary<datasetsDatasetServiceApi.BatchGetDatasetsRequest, datasetsDatasetServiceApi.BatchGetDatasetsResponse> =
      (input, done) => this.datasetsDatasetClient.batchGetDatasets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<datasetsDatasetServiceApi.BatchGetDatasetsResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request4 = customersCustomerCalculationServiceApi.EstimateCustomerRequest.fromPartial({
      context: req?.context,
      customer: {
        relationshipManager: { email: (req?.campaignAsset?.owner?.email ?? "") },
      },
      details: {
        destination: {
          postalCode: ((req?.campaignAsset?.locator?.$case === "address" ? req?.campaignAsset?.locator.address : undefined)?.postalCode ?? ""),
        },
      },
    });
    const invoke4: Unary<customersCustomerCalculationServiceApi.EstimateCustomerRequest, customersCustomerCalculationServiceApi.EstimateCustomerResponse> =
      (input, done) => this.customersCustomerCalculationClient.estimateCustomer(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send4 = promised(invoke4);
    const reply4 = await send4(request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignAssetWorkflowServiceApi.ResumeCampaignAssetWorkflowResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      campaignsCampaignAssetWorkflowServiceApi.ResumeCampaignAssetWorkflowResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      campaignsCampaignAssetWorkflowServiceApi.ResumeCampaignAssetWorkflowResponse.fromPartial({
        outcome: { message: (reply3?.result?.message ?? "") },
        result: { status: (reply3?.result?.status ?? "") },
      }),
      campaignsCampaignAssetWorkflowServiceApi.ResumeCampaignAssetWorkflowResponse.fromPartial({
        result: {
          referenceIds: (reply4?.result?.referenceIds ?? []),
          status: (reply4?.result?.status ?? ""),
        },
      }),
      campaignsCampaignAssetWorkflowServiceApi.ResumeCampaignAssetWorkflowResponse.fromPartial({
        campaignAsset: {
          campaignAssetId: (req?.campaignAssetId ?? ""),
          status: req?.campaignAsset?.status,
        },
      }),
    );
  }

  /**
   * Retrys a campaign asset.
   */
  async retryCampaignAssetWorkflow(req: campaignsCampaignAssetWorkflowServiceApi.RetryCampaignAssetWorkflowRequest): Promise<campaignsCampaignAssetWorkflowServiceApi.RetryCampaignAssetWorkflowResponse> {
    validateContext(req.context);
    if (req.campaignAsset) {
      await this.repository.save(toCampaignAssetRecord(req.context.tenantId, req.campaignAsset));
    }
    await this.repository.record(req.context.tenantId, "RetryCampaignAssetWorkflow", req);
    this.logger.info("retry_campaign_asset_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_2: string | undefined;
    switch (req?.campaignAsset?.locator?.$case) {
      case "address":
        selected1_2 = ((req?.campaignAsset?.locator?.$case === "address" ? req?.campaignAsset?.locator.address : undefined)?.countryCode ?? "");
        break;
      default:
        selected1_2 = "";
    }
    const request1 = customersCustomerValidationServiceApi.ExplainCustomerDecisionRequest.fromPartial({
      context: req?.context,
      customer: { primaryAddress: { countryCode: (selected1_2 ?? "") } },
      details: {
        contact: {
          phone: (req?.details?.notify?.phone ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<customersCustomerValidationServiceApi.ExplainCustomerDecisionRequest, customersCustomerValidationServiceApi.ExplainCustomerDecisionResponse> =
      (input, done) => this.customersCustomerValidationClient.explainCustomerDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerValidationServiceApi.ExplainCustomerDecisionRequest, customersCustomerValidationServiceApi.ExplainCustomerDecisionResponse>(invoke1, request1);
    const request2 = campaignsMarketingCampaignWorkflowServiceApi.AdvanceMarketingCampaignWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { name: req?.details?.notify?.name } },
      marketingCampaign: {
        participants: [{
          contact: {
            email: (reply1?.customer?.contact?.email ?? ""),
            phone: (reply1?.customer?.contact?.phone ?? ""),
          },
        }],
      },
    });
    const method2 = "advanceMarketingCampaignWorkflow" as const;
    const invoke2: Unary<campaignsMarketingCampaignWorkflowServiceApi.AdvanceMarketingCampaignWorkflowRequest, campaignsMarketingCampaignWorkflowServiceApi.AdvanceMarketingCampaignWorkflowResponse> =
      (input, done) => this.campaignsMarketingCampaignWorkflowClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<campaignsMarketingCampaignWorkflowServiceApi.AdvanceMarketingCampaignWorkflowRequest, campaignsMarketingCampaignWorkflowServiceApi.AdvanceMarketingCampaignWorkflowResponse>(invoke2, request2);
    const request3 = contentContentRevisionApprovalServiceApi.EscalateContentRevisionRequest.fromPartial({
      contentRevision: { subject: { email: (req?.details?.notify?.email ?? "") } },
      context: req?.context,
      details: {
        approver: {
          displayName: (req?.campaignAsset?.owner?.displayName ?? ""),
          email: (reply1?.customer?.contact?.email ?? ""),
        },
      },
    });
    const proxy3 = forwarding(this.contentContentRevisionApprovalClient);
    const invoke3: Unary<contentContentRevisionApprovalServiceApi.EscalateContentRevisionRequest, contentContentRevisionApprovalServiceApi.EscalateContentRevisionResponse> =
      (input, done) => proxy3.escalateContentRevision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<contentContentRevisionApprovalServiceApi.EscalateContentRevisionRequest, contentContentRevisionApprovalServiceApi.EscalateContentRevisionResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignAssetWorkflowServiceApi.RetryCampaignAssetWorkflowResponse.fromPartial({ outcome: { status: (reply1?.outcome?.status ?? "") } }),
      campaignsCampaignAssetWorkflowServiceApi.RetryCampaignAssetWorkflowResponse.fromPartial({
        outcome: {
          effectiveAt: reply2?.outcome?.effectiveAt,
          message: (reply2?.outcome?.message ?? ""),
        },
      }),
      campaignsCampaignAssetWorkflowServiceApi.RetryCampaignAssetWorkflowResponse.fromPartial({ result: { status: (reply3?.outcome?.status ?? "") } }),
      campaignsCampaignAssetWorkflowServiceApi.RetryCampaignAssetWorkflowResponse.fromPartial({
        campaignAsset: {
          campaignAssetId: (req?.campaignAssetId ?? ""),
          capacity: (req?.campaignAsset?.capacity ?? 0),
        },
      }),
    );
  }

  /**
   * Signals a campaign asset.
   */
  async signalCampaignAssetWorkflow(req: campaignsCampaignAssetWorkflowServiceApi.SignalCampaignAssetWorkflowRequest): Promise<campaignsCampaignAssetWorkflowServiceApi.SignalCampaignAssetWorkflowResponse> {
    validateContext(req.context);
    if (req.campaignAsset) {
      await this.repository.save(toCampaignAssetRecord(req.context.tenantId, req.campaignAsset));
    }
    await this.repository.record(req.context.tenantId, "SignalCampaignAssetWorkflow", req);
    this.logger.info("signal_campaign_asset_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.campaignAsset?.locator?.$case) {
      case "address":
        selected1_1 = ((req?.campaignAsset?.locator?.$case === "address" ? req?.campaignAsset?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = auditAuditEventQueryServiceApi.SuggestAuditEventsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.campaignAsset?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.campaignAsset?.components?.["primary"]?.componentId ?? ""),
        region: (selected1_1 ?? ""),
      },
    });
    const invoke1: Unary<auditAuditEventQueryServiceApi.SuggestAuditEventsRequest, auditAuditEventQueryServiceApi.SuggestAuditEventsResponse> =
      (input, done) => this.auditAuditEventQueryClient.suggestAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<auditAuditEventQueryServiceApi.SuggestAuditEventsRequest, auditAuditEventQueryServiceApi.SuggestAuditEventsResponse>(invoke1, request1);
    const request2 = campaignsMarketingCampaignWorkflowServiceApi.ListMarketingCampaignWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: {
        region: ((req?.campaignAsset?.locator?.$case === "address" ? req?.campaignAsset?.locator.address : undefined)?.region ?? ""),
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<campaignsMarketingCampaignWorkflowServiceApi.ListMarketingCampaignWorkflowsRequest, campaignsMarketingCampaignWorkflowServiceApi.ListMarketingCampaignWorkflowsResponse> =
      (input, done) => this.campaignsMarketingCampaignWorkflowClient.listMarketingCampaignWorkflows(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<campaignsMarketingCampaignWorkflowServiceApi.ListMarketingCampaignWorkflowsRequest, campaignsMarketingCampaignWorkflowServiceApi.ListMarketingCampaignWorkflowsResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = campaignsCampaignBudgetValidationServiceApi.ExplainCampaignBudgetDecisionRequest.fromPartial({
      campaignBudget: {
        audit: { updatedBy: (input3?.campaignAsset?.audit?.updatedBy ?? "") },
        holder: { displayName: (input3?.campaignAsset?.owner?.displayName ?? "") },
      },
      context: input3?.context,
      details: { contact: { email: (input3?.campaignAsset?.owner?.email ?? "") } },
    });
    const invoke3: Unary<campaignsCampaignBudgetValidationServiceApi.ExplainCampaignBudgetDecisionRequest, campaignsCampaignBudgetValidationServiceApi.ExplainCampaignBudgetDecisionResponse> =
      (input, done) => this.campaignsCampaignBudgetValidationClient.explainCampaignBudgetDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<campaignsCampaignBudgetValidationServiceApi.ExplainCampaignBudgetDecisionRequest, campaignsCampaignBudgetValidationServiceApi.ExplainCampaignBudgetDecisionResponse>(invoke3, request3);
    let selected4_1: string | undefined;
    switch (req?.campaignAsset?.locator?.$case) {
      case "address":
        selected4_1 = ((req?.campaignAsset?.locator?.$case === "address" ? req?.campaignAsset?.locator.address : undefined)?.recipient ?? "");
        break;
      default:
        selected4_1 = "";
    }
    const request4 = contentArticleApprovalServiceApi.DelegateArticleApprovalRequest.fromPartial({
      article: { billingAddress: { recipient: (selected4_1 ?? "") } },
      context: req?.context,
    });
    const invoke4: Unary<contentArticleApprovalServiceApi.DelegateArticleApprovalRequest, contentArticleApprovalServiceApi.DelegateArticleApprovalResponse> =
      (input, done) => this.contentArticleApprovalClient.delegateArticleApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<contentArticleApprovalServiceApi.DelegateArticleApprovalRequest, contentArticleApprovalServiceApi.DelegateArticleApprovalResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignAssetWorkflowServiceApi.SignalCampaignAssetWorkflowResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      campaignsCampaignAssetWorkflowServiceApi.SignalCampaignAssetWorkflowResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      campaignsCampaignAssetWorkflowServiceApi.SignalCampaignAssetWorkflowResponse.fromPartial({
        outcome: { referenceId: (reply3?.outcome?.referenceId ?? "") },
        result: { status: (reply3?.result?.status ?? "") },
      }),
      campaignsCampaignAssetWorkflowServiceApi.SignalCampaignAssetWorkflowResponse.fromPartial({ result: { referenceIds: (reply4?.result?.referenceIds ?? []) } }),
      campaignsCampaignAssetWorkflowServiceApi.SignalCampaignAssetWorkflowResponse.fromPartial({
        campaignAsset: {
          campaignAssetId: (req?.campaignAssetId ?? ""),
          status: req?.campaignAsset?.status,
        },
      }),
    );
  }

  /**
   * Starts a campaign asset.
   */
  async startCampaignAssetWorkflow(req: campaignsCampaignAssetWorkflowServiceApi.StartCampaignAssetWorkflowRequest): Promise<campaignsCampaignAssetWorkflowServiceApi.StartCampaignAssetWorkflowResponse> {
    validateContext(req.context);
    if (req.campaignAsset) {
      await this.repository.save(toCampaignAssetRecord(req.context.tenantId, req.campaignAsset));
    }
    await this.repository.record(req.context.tenantId, "StartCampaignAssetWorkflow", req);
    this.logger.info("start_campaign_asset_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsMarketingCampaignServiceApi.CreateMarketingCampaignRequest.fromPartial({
      context: req?.context,
      marketingCampaign: {
        organizer: { email: (req?.campaignAsset?.owner?.email ?? "") },
        participants: [{ contact: { email: (req?.details?.notify?.email ?? "") } }],
      },
    });
    const decoded1 = campaignsMarketingCampaignServiceApi.CreateMarketingCampaignRequest.fromJSON(
      JSON.parse(JSON.stringify(campaignsMarketingCampaignServiceApi.CreateMarketingCampaignRequest.toJSON(request1))),
    );
    const invoke1: Unary<campaignsMarketingCampaignServiceApi.CreateMarketingCampaignRequest, campaignsMarketingCampaignServiceApi.CreateMarketingCampaignResponse> =
      (input, done) => this.campaignsMarketingCampaignClient.createMarketingCampaign(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<campaignsMarketingCampaignServiceApi.CreateMarketingCampaignRequest, campaignsMarketingCampaignServiceApi.CreateMarketingCampaignResponse>(invoke1, decoded1);
    const request2 = concessionsConcessionStandCalculationServiceApi.CompareConcessionStandOptionsRequest.fromPartial({
      concessionStand: {
        locator: { $case: "address", address: {
          lines: ((req?.campaignAsset?.locator?.$case === "address" ? req?.campaignAsset?.locator.address : undefined)?.lines ?? []).map((value) => value),
          region: (reply1?.marketingCampaign?.location?.region ?? ""),
        } },
        components: { primary: {
          quantity: (req?.campaignAsset?.components?.["primary"]?.quantity ?? 0),
        } },
        owner: { userId: (req?.campaignAsset?.owner?.userId ?? "") },
      },
      context: req?.context,
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.concessions.v1.CompareConcessionStandOptionsRequest",
      value: Buffer.from(concessionsConcessionStandCalculationServiceApi.CompareConcessionStandOptionsRequest.encode(request2).finish()),
    });
    const unpacked2 = concessionsConcessionStandCalculationServiceApi.CompareConcessionStandOptionsRequest.decode(envelope2.value);
    const invoke2: Unary<concessionsConcessionStandCalculationServiceApi.CompareConcessionStandOptionsRequest, concessionsConcessionStandCalculationServiceApi.CompareConcessionStandOptionsResponse> =
      (input, done) => this.concessionsConcessionStandCalculationClient.compareConcessionStandOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<concessionsConcessionStandCalculationServiceApi.CompareConcessionStandOptionsRequest, concessionsConcessionStandCalculationServiceApi.CompareConcessionStandOptionsResponse>(invoke2, unpacked2);
    const request3 = campaignsMarketingCampaignQueryServiceApi.ResolveMarketingCampaignsRequest.fromPartial({ context: req?.context });
    const client3 = this.clients.get<campaignsMarketingCampaignQueryServiceApi.MarketingCampaignQueryServiceClient>("acme.campaigns.v1.MarketingCampaignQueryService");
    const invoke3: Unary<campaignsMarketingCampaignQueryServiceApi.ResolveMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.ResolveMarketingCampaignsResponse> =
      (input, done) => client3.resolveMarketingCampaigns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<campaignsMarketingCampaignQueryServiceApi.ResolveMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.ResolveMarketingCampaignsResponse>(invoke3, request3);
    const request4 = customersCustomerSegmentCalculationServiceApi.SimulateCustomerSegmentRequest.fromPartial({
      context: req?.context,
      customerSegment: { owner: { email: (reply1?.marketingCampaign?.organizer?.email ?? "") } },
      details: {
        destination: {
          lines: (reply1?.marketingCampaign?.location?.lines ?? []).map((value) => value),
        },
      },
    });
    const invoke4: Unary<customersCustomerSegmentCalculationServiceApi.SimulateCustomerSegmentRequest, customersCustomerSegmentCalculationServiceApi.SimulateCustomerSegmentResponse> =
      (input, done) => this.customersCustomerSegmentCalculationClient.simulateCustomerSegment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port4: RequestPort<customersCustomerSegmentCalculationServiceApi.SimulateCustomerSegmentRequest, customersCustomerSegmentCalculationServiceApi.SimulateCustomerSegmentResponse> = new GrpcAdapter(invoke4);
    const reply4 = await port4.execute(request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignAssetWorkflowServiceApi.StartCampaignAssetWorkflowResponse.fromPartial({
        campaignAsset: { audit: { createdAt: reply1?.marketingCampaign?.audit?.createdAt } },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      campaignsCampaignAssetWorkflowServiceApi.StartCampaignAssetWorkflowResponse.fromPartial({
        campaignAsset: {
          audit: { createdBy: (reply2?.concessionStand?.audit?.createdBy ?? "") },
        },
      }),
      campaignsCampaignAssetWorkflowServiceApi.StartCampaignAssetWorkflowResponse.fromPartial({
        result: {
          message: (reply3?.result?.message ?? ""),
          referenceIds: (reply3?.result?.referenceIds ?? []),
        },
      }),
      campaignsCampaignAssetWorkflowServiceApi.StartCampaignAssetWorkflowResponse.fromPartial({
        campaignAsset: { owner: { userId: (reply4?.customerSegment?.owner?.userId ?? "") } },
        result: { correlationId: (reply4?.result?.correlationId ?? "") },
      }),
      campaignsCampaignAssetWorkflowServiceApi.StartCampaignAssetWorkflowResponse.fromPartial({
        campaignAsset: {
          campaignAssetId: (req?.campaignAssetId ?? ""),
          code: (req?.campaignAsset?.code ?? ""),
        },
      }),
    );
  }
}
