/**
 * Answers read-only questions about campaign assets, for screens and reports. Remote work stays behind typed client
 * ports.
 */

import * as campaignsCampaignAssetQueryServiceApi from "../../../../.cache/proto/acme/campaigns/v1/campaign_asset_query_service.js";
import * as campaignsMarketingCampaignQueryServiceApi from "../../../../.cache/proto/acme/campaigns/v1/marketing_campaign_query_service.js";
import * as localizationLocaleCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_calculation_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, promised, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { CampaignsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate campaign asset operations and persist audit data.
 */
@injectable()
export class CampaignAssetQueryWorkflow {
  constructor(
    @inject(CampaignsRepository) private readonly repository: CampaignsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.campaigns.v1.MarketingCampaignQueryService") private readonly campaignsMarketingCampaignQueryClient: campaignsMarketingCampaignQueryServiceApi.MarketingCampaignQueryServiceClient,
    @inject("grpc:acme.localization.v1.LocaleCalculationService") private readonly localizationLocaleCalculationClient: localizationLocaleCalculationServiceApi.LocaleCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists campaign assets a page at a time.
   */
  async browseCampaignAssets(req: campaignsCampaignAssetQueryServiceApi.BrowseCampaignAssetsRequest): Promise<campaignsCampaignAssetQueryServiceApi.BrowseCampaignAssetsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseCampaignAssets", req);
    this.logger.info("browse_campaign_assets", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationLocaleCalculationServiceApi.CompareLocaleOptionsRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
      locale: { owner: { userId: (req?.context?.actor?.userId ?? "") } },
    });
    const invoke1: Unary<localizationLocaleCalculationServiceApi.CompareLocaleOptionsRequest, localizationLocaleCalculationServiceApi.CompareLocaleOptionsResponse> =
      (input, done) => this.localizationLocaleCalculationClient.compareLocaleOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<localizationLocaleCalculationServiceApi.CompareLocaleOptionsRequest, localizationLocaleCalculationServiceApi.CompareLocaleOptionsResponse>(invoke1, request1));
    const request2 = campaignsMarketingCampaignQueryServiceApi.FindMarketingCampaignsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        ownerId: (req?.filter?.ownerId ?? ""),
      },
      orderBy: (req?.orderBy ?? ""),
    });
    const invoke2: Unary<campaignsMarketingCampaignQueryServiceApi.FindMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.FindMarketingCampaignsResponse> =
      (input, done) => this.campaignsMarketingCampaignQueryClient.findMarketingCampaigns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<campaignsMarketingCampaignQueryServiceApi.FindMarketingCampaignsResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.filter?.query ?? "") });
    return mergeResponses(
      campaignsCampaignAssetQueryServiceApi.BrowseCampaignAssetsResponse.fromPartial({
        campaignAssets: [{ owner: { email: (reply1?.locale?.owner?.email ?? "") } }],
      }),
      campaignsCampaignAssetQueryServiceApi.BrowseCampaignAssetsResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          message: (reply2?.result?.message ?? ""),
        },
      }),
    );
  }

  /**
   * Counts campaign assets by status.
   */
  async countCampaignAssets(req: campaignsCampaignAssetQueryServiceApi.CountCampaignAssetsRequest): Promise<campaignsCampaignAssetQueryServiceApi.CountCampaignAssetsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountCampaignAssets", req);
    this.logger.info("count_campaign_assets", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsMarketingCampaignQueryServiceApi.CountMarketingCampaignsRequest.fromPartial({
      context: req?.context,
      filter: {
        query: (req?.filter?.query ?? ""),
        region: (req?.filter?.region ?? ""),
      },
      page: { pageSize: (req?.page?.pageSize ?? 0) },
    });
    const invoke1: Unary<campaignsMarketingCampaignQueryServiceApi.CountMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.CountMarketingCampaignsResponse> =
      (input, done) => this.campaignsMarketingCampaignQueryClient.countMarketingCampaigns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return campaignsCampaignAssetQueryServiceApi.CountCampaignAssetsResponse.fromPartial({
      count: (reply1?.count ?? 0),
      result: { status: (reply1?.result?.status ?? "") },
    });
  }

  /**
   * Returns a campaign asset.
   */
  async lookupCampaignAsset(req: campaignsCampaignAssetQueryServiceApi.LookupCampaignAssetRequest): Promise<campaignsCampaignAssetQueryServiceApi.LookupCampaignAssetResponse> {
    validateContext(req.context);
    if (!req.campaignAssetId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "campaign_asset_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupCampaignAsset", req);
    this.logger.info("lookup_campaign_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    return campaignsCampaignAssetQueryServiceApi.LookupCampaignAssetResponse.fromPartial({ campaignAsset: { campaignAssetId: (req?.campaignAssetId ?? "") } });
  }

  /**
   * Returns a campaign asset.
   */
  async peekCampaignAsset(req: campaignsCampaignAssetQueryServiceApi.PeekCampaignAssetRequest): Promise<campaignsCampaignAssetQueryServiceApi.PeekCampaignAssetResponse> {
    validateContext(req.context);
    if (!req.campaignAssetId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "campaign_asset_id is required");
    }
    await this.repository.record(req.context.tenantId, "PeekCampaignAsset", req);
    this.logger.info("peek_campaign_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    return campaignsCampaignAssetQueryServiceApi.PeekCampaignAssetResponse.fromPartial({ campaignAsset: { campaignAssetId: (req?.campaignAssetId ?? "") } });
  }

  /**
   * Returns several campaign assets at once.
   */
  async resolveCampaignAssets(req: campaignsCampaignAssetQueryServiceApi.ResolveCampaignAssetsRequest): Promise<campaignsCampaignAssetQueryServiceApi.ResolveCampaignAssetsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveCampaignAssets", req);
    this.logger.info("resolve_campaign_assets", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsMarketingCampaignQueryServiceApi.SummarizeMarketingCampaignsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      context: req?.context,
    });
    const invoke1: Unary<campaignsMarketingCampaignQueryServiceApi.SummarizeMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.SummarizeMarketingCampaignsResponse> =
      (input, done) => this.campaignsMarketingCampaignQueryClient.summarizeMarketingCampaigns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    return campaignsCampaignAssetQueryServiceApi.ResolveCampaignAssetsResponse.fromPartial({
      result: {
        details: (reply1?.result?.details ?? {}),
        status: (reply1?.result?.status ?? ""),
      },
    });
  }

  /**
   * Lists campaign assets a page at a time.
   */
  async suggestCampaignAssets(req: campaignsCampaignAssetQueryServiceApi.SuggestCampaignAssetsRequest): Promise<campaignsCampaignAssetQueryServiceApi.SuggestCampaignAssetsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SuggestCampaignAssets", req);
    this.logger.info("suggest_campaign_assets", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsMarketingCampaignQueryServiceApi.SummarizeMarketingCampaignsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      },
    });
    const method1 = "summarizeMarketingCampaigns" as const;
    const invoke1: Unary<campaignsMarketingCampaignQueryServiceApi.SummarizeMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.SummarizeMarketingCampaignsResponse> =
      (input, done) => this.campaignsMarketingCampaignQueryClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<campaignsMarketingCampaignQueryServiceApi.SummarizeMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.SummarizeMarketingCampaignsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return campaignsCampaignAssetQueryServiceApi.SuggestCampaignAssetsResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } });
  }

  /**
   * Summarizes a campaign asset.
   */
  async summarizeCampaignAssets(req: campaignsCampaignAssetQueryServiceApi.SummarizeCampaignAssetsRequest): Promise<campaignsCampaignAssetQueryServiceApi.SummarizeCampaignAssetsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeCampaignAssets", req);
    this.logger.info("summarize_campaign_assets", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.details?.filters ?? {}))),
        ownerId: (req?.context?.actor?.userId ?? ""),
      },
    });
    const proxy1 = forwarding(this.campaignsMarketingCampaignQueryClient);
    const invoke1: Unary<campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsResponse> =
      (input, done) => proxy1.suggestMarketingCampaigns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignAssetQueryServiceApi.SummarizeCampaignAssetsResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      campaignsCampaignAssetQueryServiceApi.SummarizeCampaignAssetsResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}

/**
 * The gRPC boundary for CampaignAssetQueryService; workflows own validation and database transactions.
 */
@injectable()
export class CampaignAssetQueryHandler {
  constructor(@inject(CampaignAssetQueryWorkflow) private readonly workflow: CampaignAssetQueryWorkflow) {}

  /**
   * Lists campaign assets a page at a time.
   */
  browseCampaignAssets = unary<campaignsCampaignAssetQueryServiceApi.BrowseCampaignAssetsRequest, campaignsCampaignAssetQueryServiceApi.BrowseCampaignAssetsResponse>(
    (request) => this.workflow.browseCampaignAssets(request),
  );

  /**
   * Counts campaign assets by status.
   */
  countCampaignAssets = unary<campaignsCampaignAssetQueryServiceApi.CountCampaignAssetsRequest, campaignsCampaignAssetQueryServiceApi.CountCampaignAssetsResponse>(
    (request) => this.workflow.countCampaignAssets(request),
  );

  /**
   * Returns a campaign asset.
   */
  lookupCampaignAsset = (call: ServerUnaryCall<campaignsCampaignAssetQueryServiceApi.LookupCampaignAssetRequest, campaignsCampaignAssetQueryServiceApi.LookupCampaignAssetResponse>, done: sendUnaryData<campaignsCampaignAssetQueryServiceApi.LookupCampaignAssetResponse>): void => {
    void this.workflow.lookupCampaignAsset(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a campaign asset.
   */
  peekCampaignAsset = unary<campaignsCampaignAssetQueryServiceApi.PeekCampaignAssetRequest, campaignsCampaignAssetQueryServiceApi.PeekCampaignAssetResponse>(
    (request) => this.workflow.peekCampaignAsset(request),
  );

  /**
   * Returns several campaign assets at once.
   */
  resolveCampaignAssets = unary<campaignsCampaignAssetQueryServiceApi.ResolveCampaignAssetsRequest, campaignsCampaignAssetQueryServiceApi.ResolveCampaignAssetsResponse>(
    (request) => this.workflow.resolveCampaignAssets(request),
  );

  /**
   * Lists campaign assets a page at a time.
   */
  suggestCampaignAssets = (call: ServerUnaryCall<campaignsCampaignAssetQueryServiceApi.SuggestCampaignAssetsRequest, campaignsCampaignAssetQueryServiceApi.SuggestCampaignAssetsResponse>, done: sendUnaryData<campaignsCampaignAssetQueryServiceApi.SuggestCampaignAssetsResponse>): void => {
    void this.workflow.suggestCampaignAssets(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Summarizes a campaign asset.
   */
  summarizeCampaignAssets = unary<campaignsCampaignAssetQueryServiceApi.SummarizeCampaignAssetsRequest, campaignsCampaignAssetQueryServiceApi.SummarizeCampaignAssetsResponse>(
    (request) => this.workflow.summarizeCampaignAssets(request),
  );
}

export function implementation(handler: CampaignAssetQueryHandler): campaignsCampaignAssetQueryServiceApi.CampaignAssetQueryServiceServer {
  return {
    browseCampaignAssets: handler.browseCampaignAssets,
    countCampaignAssets: handler.countCampaignAssets,
    lookupCampaignAsset: handler.lookupCampaignAsset,
    peekCampaignAsset: handler.peekCampaignAsset,
    resolveCampaignAssets: handler.resolveCampaignAssets,
    suggestCampaignAssets: handler.suggestCampaignAssets,
    summarizeCampaignAssets: handler.summarizeCampaignAssets,
  };
}
