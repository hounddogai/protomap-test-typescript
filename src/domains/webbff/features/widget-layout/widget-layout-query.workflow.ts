/**
 * Answers read-only questions about widget layouts, for screens and reports. Remote work stays behind typed client
 * ports.
 */

import * as campaignsCampaignAssetWorkflowServiceApi from "../../../../../.cache/proto/acme/campaigns/v1/campaign_asset_workflow_service.js";
import * as edgegatewayRouteBindingQueryServiceApi from "../../../../../.cache/proto/acme/edgegateway/v1/route_binding_query_service.js";
import * as edgegatewayRouteBindingServiceApi from "../../../../../.cache/proto/acme/edgegateway/v1/route_binding_service.js";
import * as experimentsExperimentWorkflowServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_workflow_service.js";
import * as featureflagsFeatureFlagValidationServiceApi from "../../../../../.cache/proto/acme/featureflags/v1/feature_flag_validation_service.js";
import * as identityUserQueryServiceApi from "../../../../../.cache/proto/acme/identity/v1/user_query_service.js";
import * as personalizationProfileApprovalServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_approval_service.js";
import * as webbffPageCompositionNotificationServiceApi from "../../../../../.cache/proto/acme/webbff/v1/page_composition_notification_service.js";
import * as webbffWidgetLayoutIntegrationServiceApi from "../../../../../.cache/proto/acme/webbff/v1/widget_layout_integration_service.js";
import * as webbffWidgetLayoutQueryServiceApi from "../../../../../.cache/proto/acme/webbff/v1/widget_layout_query_service.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, forwarding, metadataFor, operation, promised, type Unary } from "../../../../platform/rpc.js";
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { WebbffRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate widget layout operations and persist audit data.
 */
@injectable()
export class WidgetLayoutQueryWorkflow {
  constructor(
    @inject(WebbffRepository) private readonly repository: WebbffRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.campaigns.v1.CampaignAssetWorkflowService") private readonly campaignsCampaignAssetWorkflowClient: campaignsCampaignAssetWorkflowServiceApi.CampaignAssetWorkflowServiceClient,
    @inject("grpc:acme.edgegateway.v1.RouteBindingQueryService") private readonly edgegatewayRouteBindingQueryClient: edgegatewayRouteBindingQueryServiceApi.RouteBindingQueryServiceClient,
    @inject("grpc:acme.edgegateway.v1.RouteBindingService") private readonly edgegatewayRouteBindingClient: edgegatewayRouteBindingServiceApi.RouteBindingServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentWorkflowService") private readonly experimentsExperimentWorkflowClient: experimentsExperimentWorkflowServiceApi.ExperimentWorkflowServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagValidationService") private readonly featureflagsFeatureFlagValidationClient: featureflagsFeatureFlagValidationServiceApi.FeatureFlagValidationServiceClient,
    @inject("grpc:acme.identity.v1.UserQueryService") private readonly identityUserQueryClient: identityUserQueryServiceApi.UserQueryServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileApprovalService") private readonly personalizationProfileApprovalClient: personalizationProfileApprovalServiceApi.ProfileApprovalServiceClient,
    @inject("grpc:acme.webbff.v1.PageCompositionNotificationService") private readonly webbffPageCompositionNotificationClient: webbffPageCompositionNotificationServiceApi.PageCompositionNotificationServiceClient,
    @inject("grpc:acme.webbff.v1.WidgetLayoutIntegrationService") private readonly webbffWidgetLayoutIntegrationClient: webbffWidgetLayoutIntegrationServiceApi.WidgetLayoutIntegrationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists widget layouts a page at a time.
   */
  async browseWidgetLayouts(req: webbffWidgetLayoutQueryServiceApi.BrowseWidgetLayoutsRequest): Promise<webbffWidgetLayoutQueryServiceApi.BrowseWidgetLayoutsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseWidgetLayouts", req);
    this.logger.info("browse_widget_layouts", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webbffWidgetLayoutQueryServiceApi.BrowseWidgetLayoutsResponse.fromPartial({});
  }

  /**
   * Counts widget layouts by status.
   */
  async countWidgetLayouts(req: webbffWidgetLayoutQueryServiceApi.CountWidgetLayoutsRequest): Promise<webbffWidgetLayoutQueryServiceApi.CountWidgetLayoutsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountWidgetLayouts", req);
    this.logger.info("count_widget_layouts", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webbffWidgetLayoutQueryServiceApi.CountWidgetLayoutsResponse.fromPartial({});
  }

  /**
   * Streams every matching widget layout.
   */
  async exportWidgetLayouts(req: webbffWidgetLayoutQueryServiceApi.ExportWidgetLayoutsRequest): Promise<webbffWidgetLayoutQueryServiceApi.ExportWidgetLayoutsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportWidgetLayouts", req);
    this.logger.info("export_widget_layouts", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = edgegatewayRouteBindingServiceApi.WatchRouteBindingsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        region: (req?.filter?.region ?? ""),
      },
    });
    const stream1 = this.edgegatewayRouteBindingClient.watchRouteBindings(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? edgegatewayRouteBindingServiceApi.WatchRouteBindingsResponse.fromPartial({});
    const request2 = featureflagsFeatureFlagValidationServiceApi.ValidateFeatureFlagRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
      featureFlag: {
        audit: { updatedAt: req?.filter?.createdAfter },
        owner: { userId: (req?.context?.actor?.userId ?? "") },
      },
    });
    const invoke2: Unary<featureflagsFeatureFlagValidationServiceApi.ValidateFeatureFlagRequest, featureflagsFeatureFlagValidationServiceApi.ValidateFeatureFlagResponse> =
      (input, done) => this.featureflagsFeatureFlagValidationClient.validateFeatureFlag(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesRequest.fromPartial({
      context: req?.context,
      details: { recipient: { email: (reply2?.featureFlag?.owner?.email ?? "") } },
    });
    const reply3 = await this.workQueue.enqueue<webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesRequest, webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesResponse>(
      "acme.webbff.v1.WidgetLayoutQueryService/ExportWidgetLayouts:2", request3,
    );
    const request4 = edgegatewayRouteBindingQueryServiceApi.ResolveRouteBindingsRequest.fromPartial({ context: req?.context });
    const invoke4: Unary<edgegatewayRouteBindingQueryServiceApi.ResolveRouteBindingsRequest, edgegatewayRouteBindingQueryServiceApi.ResolveRouteBindingsResponse> =
      (input, done) => this.edgegatewayRouteBindingQueryClient.resolveRouteBindings(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await inRequest(req.context!, () => call<edgegatewayRouteBindingQueryServiceApi.ResolveRouteBindingsRequest, edgegatewayRouteBindingQueryServiceApi.ResolveRouteBindingsResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return mergeResponses(
      webbffWidgetLayoutQueryServiceApi.ExportWidgetLayoutsResponse.fromPartial({
        widgetLayout: {
          children: [{ manager: { email: (reply2?.featureFlag?.owner?.email ?? "") } }],
          manager: { displayName: (reply2?.featureFlag?.owner?.displayName ?? "") },
        },
      }),
      webbffWidgetLayoutQueryServiceApi.ExportWidgetLayoutsResponse.fromPartial({
        widgetLayout: {
          children: [{
            children: [{
              manager: {
                displayName: (reply3?.pageComposition?.counterparty?.displayName ?? ""),
              },
            }],
          }],
          location: { locality: (reply3?.pageComposition?.billingAddress?.locality ?? "") },
        },
      }),
      webbffWidgetLayoutQueryServiceApi.ExportWidgetLayoutsResponse.fromPartial({ result: { message: (reply4?.result?.message ?? "") } }),
      webbffWidgetLayoutQueryServiceApi.ExportWidgetLayoutsResponse.fromPartial({ widgetLayout: { location: { region: (req?.filter?.region ?? "") } } }),
    );
  }

  /**
   * Lists widget layouts a page at a time.
   */
  async findWidgetLayouts(req: webbffWidgetLayoutQueryServiceApi.FindWidgetLayoutsRequest): Promise<webbffWidgetLayoutQueryServiceApi.FindWidgetLayoutsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindWidgetLayouts", req);
    this.logger.info("find_widget_layouts", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      context: req?.context,
      details: { messageId: (req?.filter?.ownerId ?? "") },
    });
    const invoke1: Unary<webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceRequest, webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceResponse> =
      (input, done) => this.webbffWidgetLayoutIntegrationClient.disconnectWidgetLayoutSource(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webbffWidgetLayoutQueryServiceApi.FindWidgetLayoutsResponse.fromPartial({
      widgetLayouts: [{
        children: [{
          children: [{
            children: [{
              location: reply1?.widgetLayout?.location,
              parentId: (reply1?.widgetLayout?.parentId ?? ""),
            }],
          }],
        }],
      }],
    });
  }

  /**
   * Returns a widget layout.
   */
  async lookupWidgetLayout(req: webbffWidgetLayoutQueryServiceApi.LookupWidgetLayoutRequest): Promise<webbffWidgetLayoutQueryServiceApi.LookupWidgetLayoutResponse> {
    validateContext(req.context);
    if (!req.widgetLayoutId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "widget_layout_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupWidgetLayout", req);
    this.logger.info("lookup_widget_layout", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsCampaignAssetWorkflowServiceApi.AdvanceCampaignAssetWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (req?.context?.actor?.email ?? "") } },
    });
    const invoke1: Unary<campaignsCampaignAssetWorkflowServiceApi.AdvanceCampaignAssetWorkflowRequest, campaignsCampaignAssetWorkflowServiceApi.AdvanceCampaignAssetWorkflowResponse> =
      (input, done) => this.campaignsCampaignAssetWorkflowClient.advanceCampaignAssetWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    return mergeResponses(
      webbffWidgetLayoutQueryServiceApi.LookupWidgetLayoutResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      webbffWidgetLayoutQueryServiceApi.LookupWidgetLayoutResponse.fromPartial({ widgetLayout: { widgetLayoutId: (req?.widgetLayoutId ?? "") } }),
    );
  }

  /**
   * Returns a widget layout.
   */
  async peekWidgetLayout(req: webbffWidgetLayoutQueryServiceApi.PeekWidgetLayoutRequest): Promise<webbffWidgetLayoutQueryServiceApi.PeekWidgetLayoutResponse> {
    validateContext(req.context);
    if (!req.widgetLayoutId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "widget_layout_id is required");
    }
    await this.repository.record(req.context.tenantId, "PeekWidgetLayout", req);
    this.logger.info("peek_widget_layout", { tenant: req.context.tenantId, trace: req.context.traceId });
    return webbffWidgetLayoutQueryServiceApi.PeekWidgetLayoutResponse.fromPartial({ widgetLayout: { widgetLayoutId: (req?.widgetLayoutId ?? "") } });
  }

  /**
   * Lists widget layouts a page at a time.
   */
  async suggestWidgetLayouts(req: webbffWidgetLayoutQueryServiceApi.SuggestWidgetLayoutsRequest): Promise<webbffWidgetLayoutQueryServiceApi.SuggestWidgetLayoutsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SuggestWidgetLayouts", req);
    this.logger.info("suggest_widget_layouts", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest.fromPartial({
      context: req?.context,
      details: {
        messageId: (req?.filter?.ownerId ?? ""),
        receivedAt: req?.filter?.createdAfter,
      },
    });
    const invoke1: Unary<webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest, webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventResponse> =
      (input, done) => this.webbffWidgetLayoutIntegrationClient.acknowledgeWidgetLayoutEvent(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webbffWidgetLayoutQueryServiceApi.SuggestWidgetLayoutsResponse.fromPartial({
      widgetLayouts: [{
        children: [{ location: { lines: (reply1?.widgetLayout?.location?.lines ?? []) } }],
      }],
    });
  }

  /**
   * Summarizes a widget layout.
   */
  async summarizeWidgetLayouts(req: webbffWidgetLayoutQueryServiceApi.SummarizeWidgetLayoutsRequest): Promise<webbffWidgetLayoutQueryServiceApi.SummarizeWidgetLayoutsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeWidgetLayouts", req);
    this.logger.info("summarize_widget_layouts", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileApprovalServiceApi.ApproveProfileRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      profile: { relationshipManager: { email: (req?.context?.actor?.email ?? "") } },
    });
    const method1 = "approveProfile" as const;
    const invoke1: Unary<personalizationProfileApprovalServiceApi.ApproveProfileRequest, personalizationProfileApprovalServiceApi.ApproveProfileResponse> =
      (input, done) => this.personalizationProfileApprovalClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileApprovalServiceApi.ApproveProfileRequest, personalizationProfileApprovalServiceApi.ApproveProfileResponse>(invoke1, request1);
    const request2 = campaignsCampaignAssetWorkflowServiceApi.StartCampaignAssetWorkflowRequest.fromPartial({
      campaignAsset: {
        locator: { $case: "address", address: { postalCode: (reply1?.profile?.primaryAddress?.postalCode ?? "") } },
        owner: {
          email: (reply1?.profile?.contact?.email ?? ""),
          userId: (reply1?.profile?.relationshipManager?.userId ?? ""),
        },
      },
      context: req?.context,
    });
    const proxy2 = forwarding(this.campaignsCampaignAssetWorkflowClient);
    const invoke2: Unary<campaignsCampaignAssetWorkflowServiceApi.StartCampaignAssetWorkflowRequest, campaignsCampaignAssetWorkflowServiceApi.StartCampaignAssetWorkflowResponse> =
      (input, done) => proxy2.startCampaignAssetWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<campaignsCampaignAssetWorkflowServiceApi.StartCampaignAssetWorkflowRequest, campaignsCampaignAssetWorkflowServiceApi.StartCampaignAssetWorkflowResponse>(invoke2, request2);
    let selected3_3: string | undefined;
    switch (reply2?.campaignAsset?.locator?.$case) {
      case "address":
        selected3_3 = ((reply2?.campaignAsset?.locator?.$case === "address" ? reply2?.campaignAsset?.locator.address : undefined)?.postalCode ?? "");
        break;
      default:
        selected3_3 = "";
    }
    const request3 = experimentsExperimentWorkflowServiceApi.ResumeExperimentWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (reply1?.profile?.contact?.email ?? "") } },
      experiment: {
        audit: { updatedAt: reply2?.campaignAsset?.audit?.updatedAt },
        location: { postalCode: (selected3_3 ?? "") },
        participants: [{
          contact: { email: (reply1?.profile?.relationshipManager?.email ?? "") },
        }],
      },
    });
    const invoke3: Unary<experimentsExperimentWorkflowServiceApi.ResumeExperimentWorkflowRequest, experimentsExperimentWorkflowServiceApi.ResumeExperimentWorkflowResponse> =
      (input, done) => this.experimentsExperimentWorkflowClient.resumeExperimentWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<experimentsExperimentWorkflowServiceApi.ResumeExperimentWorkflowRequest, experimentsExperimentWorkflowServiceApi.ResumeExperimentWorkflowResponse>(invoke3, request3);
    const request4 = identityUserQueryServiceApi.ExportUsersRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply3?.experiment?.location?.region ?? "") },
      format: (req?.details?.format ?? ""),
    });
    const stream4 = this.identityUserQueryClient.exportUsers(request4, metadataFor(request4.context), { deadline: Date.now() + 15_000 });
    const messages4 = await collect(stream4);
    const reply4 = messages4.at(-1) ?? identityUserQueryServiceApi.ExportUsersResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webbffWidgetLayoutQueryServiceApi.SummarizeWidgetLayoutsResponse.fromPartial({ result: { message: (reply1?.outcome?.message ?? "") } }),
      webbffWidgetLayoutQueryServiceApi.SummarizeWidgetLayoutsResponse.fromPartial({
        result: {
          referenceIds: (reply2?.result?.referenceIds ?? []),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      webbffWidgetLayoutQueryServiceApi.SummarizeWidgetLayoutsResponse.fromPartial({
        result: {
          details: (reply3?.result?.details ?? {}),
          message: (reply3?.outcome?.message ?? ""),
        },
      }),
      webbffWidgetLayoutQueryServiceApi.SummarizeWidgetLayoutsResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}
