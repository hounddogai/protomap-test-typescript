/**
 * Runs the long-lived workflow that takes a rendition from start to finish. Remote work stays behind typed client
 * ports.
 */

import * as communityModerationApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/moderation_approval_service.js";
import * as customersCustomerCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/customer_calculation_service.js";
import * as customersPreferenceCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/preference_calculation_service.js";
import * as experimentsVariantSyncServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_sync_service.js";
import * as identityUserQueryServiceApi from "../../../../../.cache/proto/acme/identity/v1/user_query_service.js";
import * as identityUserServiceApi from "../../../../../.cache/proto/acme/identity/v1/user_service.js";
import * as ledgerLedgerAccountQueryServiceApi from "../../../../../.cache/proto/acme/ledger/v1/ledger_account_query_service.js";
import * as mediaMediaAssetApprovalServiceApi from "../../../../../.cache/proto/acme/media/v1/media_asset_approval_service.js";
import * as mediaMediaAssetServiceApi from "../../../../../.cache/proto/acme/media/v1/media_asset_service.js";
import * as mediaMediaAssetSyncServiceApi from "../../../../../.cache/proto/acme/media/v1/media_asset_sync_service.js";
import * as mediaMediaAssetWorkflowServiceApi from "../../../../../.cache/proto/acme/media/v1/media_asset_workflow_service.js";
import * as mediaRenditionValidationServiceApi from "../../../../../.cache/proto/acme/media/v1/rendition_validation_service.js";
import * as mediaRenditionWorkflowServiceApi from "../../../../../.cache/proto/acme/media/v1/rendition_workflow_service.js";
import * as mediaTranscodeJobReportingServiceApi from "../../../../../.cache/proto/acme/media/v1/transcode_job_reporting_service.js";
import * as notificationsNotificationQueryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_query_service.js";
import * as notificationsNotificationTemplateQueryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_query_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import * as personalizationAffinityApprovalServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_approval_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import * as surveysSurveyServiceApi from "../../../../../.cache/proto/acme/surveys/v1/survey_service.js";
import * as workplacesBuildingServiceApi from "../../../../../.cache/proto/acme/workplaces/v1/building_service.js";
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
  promised,
  retry,
  type RequestPort,
  type Unary,
} from "../../../../platform/rpc.js";
import { collect, upload, write } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toRenditionRecord } from "../../data/records.js";
import { MediaRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate rendition operations and persist audit data.
 */
@injectable()
export class RenditionWorkflowWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ModerationApprovalService") private readonly communityModerationApprovalClient: communityModerationApprovalServiceApi.ModerationApprovalServiceClient,
    @inject("grpc:acme.customers.v1.CustomerCalculationService") private readonly customersCustomerCalculationClient: customersCustomerCalculationServiceApi.CustomerCalculationServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceCalculationService") private readonly customersPreferenceCalculationClient: customersPreferenceCalculationServiceApi.PreferenceCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantSyncService") private readonly experimentsVariantSyncClient: experimentsVariantSyncServiceApi.VariantSyncServiceClient,
    @inject("grpc:acme.identity.v1.UserQueryService") private readonly identityUserQueryClient: identityUserQueryServiceApi.UserQueryServiceClient,
    @inject("grpc:acme.identity.v1.UserService") private readonly identityUserClient: identityUserServiceApi.UserServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountQueryService") private readonly ledgerLedgerAccountQueryClient: ledgerLedgerAccountQueryServiceApi.LedgerAccountQueryServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetApprovalService") private readonly mediaMediaAssetApprovalClient: mediaMediaAssetApprovalServiceApi.MediaAssetApprovalServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetService") private readonly mediaMediaAssetClient: mediaMediaAssetServiceApi.MediaAssetServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetSyncService") private readonly mediaMediaAssetSyncClient: mediaMediaAssetSyncServiceApi.MediaAssetSyncServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetWorkflowService") private readonly mediaMediaAssetWorkflowClient: mediaMediaAssetWorkflowServiceApi.MediaAssetWorkflowServiceClient,
    @inject("grpc:acme.media.v1.RenditionValidationService") private readonly mediaRenditionValidationClient: mediaRenditionValidationServiceApi.RenditionValidationServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobReportingService") private readonly mediaTranscodeJobReportingClient: mediaTranscodeJobReportingServiceApi.TranscodeJobReportingServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationQueryService") private readonly notificationsNotificationQueryClient: notificationsNotificationQueryServiceApi.NotificationQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateQueryService") private readonly notificationsNotificationTemplateQueryClient: notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionSyncService") private readonly notificationsSubscriptionSyncClient: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityApprovalService") private readonly personalizationAffinityApprovalClient: personalizationAffinityApprovalServiceApi.AffinityApprovalServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexValidationService") private readonly searchSearchIndexValidationClient: searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyService") private readonly surveysSurveyClient: surveysSurveyServiceApi.SurveyServiceClient,
    @inject("grpc:acme.workplaces.v1.BuildingService") private readonly workplacesBuildingClient: workplacesBuildingServiceApi.BuildingServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a rendition.
   */
  async advanceRenditionWorkflow(req: mediaRenditionWorkflowServiceApi.AdvanceRenditionWorkflowRequest): Promise<mediaRenditionWorkflowServiceApi.AdvanceRenditionWorkflowResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "AdvanceRenditionWorkflow", req);
    this.logger.info("advance_rendition_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.rendition?.locator?.$case) {
      case "address":
        selected1_1 = ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = communityModerationApprovalServiceApi.ListPendingModerationsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.rendition?.audit?.updatedAt,
        ownerId: (req?.rendition?.owner?.userId ?? ""),
        region: (selected1_1 ?? ""),
      },
    });
    const invoke1: Unary<communityModerationApprovalServiceApi.ListPendingModerationsRequest, communityModerationApprovalServiceApi.ListPendingModerationsResponse> =
      (input, done) => this.communityModerationApprovalClient.listPendingModerations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityModerationApprovalServiceApi.ListPendingModerationsRequest, communityModerationApprovalServiceApi.ListPendingModerationsResponse>(invoke1, request1);
    const request2 = surveysSurveyServiceApi.BatchCreateSurveysRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.context?.actor?.userId ?? ""),
        submittedBy: req?.details?.notify,
      } },
    });
    const reply2 = await upload<surveysSurveyServiceApi.BatchCreateSurveysRequest, surveysSurveyServiceApi.BatchCreateSurveysResponse>(
      (done) => this.surveysSurveyClient.batchCreateSurveys(metadataFor(request2.context), { deadline: Date.now() + 15_000 }, done), [request2],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionWorkflowServiceApi.AdvanceRenditionWorkflowResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      mediaRenditionWorkflowServiceApi.AdvanceRenditionWorkflowResponse.fromPartial({
        rendition: {
          renditionId: (req?.renditionId ?? ""),
          specs: (req?.rendition?.specs ?? {}),
        },
      }),
    );
  }

  /**
   * Cancels a rendition.
   */
  async cancelRenditionWorkflow(req: mediaRenditionWorkflowServiceApi.CancelRenditionWorkflowRequest): Promise<mediaRenditionWorkflowServiceApi.CancelRenditionWorkflowResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "CancelRenditionWorkflow", req);
    this.logger.info("cancel_rendition_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersPreferenceCalculationServiceApi.SimulatePreferenceRequest.fromPartial({
      context: req?.context,
      preference: { owner: { email: (req?.rendition?.owner?.email ?? "") } },
    });
    const invoke1: Unary<customersPreferenceCalculationServiceApi.SimulatePreferenceRequest, customersPreferenceCalculationServiceApi.SimulatePreferenceResponse> =
      (input, done) => this.customersPreferenceCalculationClient.simulatePreference(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<customersPreferenceCalculationServiceApi.SimulatePreferenceResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = searchSearchIndexValidationServiceApi.CheckSearchIndexEligibilityRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.notify?.email ?? "") } },
      searchIndex: {
        locator: { $case: "address", address: {
          recipient: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.recipient ?? ""),
        } },
        dimensions: { weight: (req?.rendition?.dimensions?.weight ?? 0) },
      },
    });
    const invoke2: Unary<searchSearchIndexValidationServiceApi.CheckSearchIndexEligibilityRequest, searchSearchIndexValidationServiceApi.CheckSearchIndexEligibilityResponse> =
      (input, done) => this.searchSearchIndexValidationClient.checkSearchIndexEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionWorkflowServiceApi.CancelRenditionWorkflowResponse.fromPartial({
        rendition: { owner: { userId: (reply1?.preference?.owner?.userId ?? "") } },
      }),
      mediaRenditionWorkflowServiceApi.CancelRenditionWorkflowResponse.fromPartial({ rendition: { code: (reply2?.searchIndex?.code ?? "") } }),
      mediaRenditionWorkflowServiceApi.CancelRenditionWorkflowResponse.fromPartial({
        rendition: {
          capacity: (req?.rendition?.capacity ?? 0),
          renditionId: (req?.renditionId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a rendition.
   */
  async inspectRenditionWorkflow(req: mediaRenditionWorkflowServiceApi.InspectRenditionWorkflowRequest): Promise<mediaRenditionWorkflowServiceApi.InspectRenditionWorkflowResponse> {
    validateContext(req.context);
    if (!req.renditionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "rendition_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectRenditionWorkflow", req);
    this.logger.info("inspect_rendition_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationQueryServiceApi.ResolveNotificationsRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<notificationsNotificationQueryServiceApi.ResolveNotificationsRequest, notificationsNotificationQueryServiceApi.ResolveNotificationsResponse> =
      (input, done) => this.notificationsNotificationQueryClient.resolveNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = mediaMediaAssetSyncServiceApi.StreamMediaAssetChangesRequest.fromPartial({
      frame: { $case: "ack", ack: { status: (reply1?.result?.status ?? "") } },
      context: req?.context,
    });
    const stream2 = this.mediaMediaAssetSyncClient.streamMediaAssetChanges(metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const reading2 = collect(stream2);
    const writing2 = (async () => {
      await write(stream2, request2);
      stream2.end();
    })();
    const [messages2] = await Promise.all([reading2, writing2]);
    const reply2 = messages2.at(-1) ?? mediaMediaAssetSyncServiceApi.StreamMediaAssetChangesResponse.fromPartial({});
    return mergeResponses(
      mediaRenditionWorkflowServiceApi.InspectRenditionWorkflowResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      mediaRenditionWorkflowServiceApi.InspectRenditionWorkflowResponse.fromPartial({ rendition: { renditionId: (req?.renditionId ?? "") } }),
    );
  }

  /**
   * Lists renditions a page at a time.
   */
  async listRenditionWorkflows(req: mediaRenditionWorkflowServiceApi.ListRenditionWorkflowsRequest): Promise<mediaRenditionWorkflowServiceApi.ListRenditionWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListRenditionWorkflows", req);
    this.logger.info("list_rendition_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = workplacesBuildingServiceApi.WatchBuildingsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        region: (req?.filter?.region ?? ""),
      },
    });
    const stream1 = this.workplacesBuildingClient.watchBuildings(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? workplacesBuildingServiceApi.WatchBuildingsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mediaRenditionWorkflowServiceApi.ListRenditionWorkflowsResponse.fromPartial({});
  }

  /**
   * Pauses a rendition.
   */
  async pauseRenditionWorkflow(req: mediaRenditionWorkflowServiceApi.PauseRenditionWorkflowRequest): Promise<mediaRenditionWorkflowServiceApi.PauseRenditionWorkflowResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "PauseRenditionWorkflow", req);
    this.logger.info("pause_rendition_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaTranscodeJobReportingServiceApi.ScheduleTranscodeJobReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const method1 = "scheduleTranscodeJobReport" as const;
    const invoke1: Unary<mediaTranscodeJobReportingServiceApi.ScheduleTranscodeJobReportRequest, mediaTranscodeJobReportingServiceApi.ScheduleTranscodeJobReportResponse> =
      (input, done) => this.mediaTranscodeJobReportingClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaTranscodeJobReportingServiceApi.ScheduleTranscodeJobReportRequest, mediaTranscodeJobReportingServiceApi.ScheduleTranscodeJobReportResponse>(invoke1, request1);
    const request2 = mediaMediaAssetServiceApi.UpdateMediaAssetRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        locator: { $case: "address", address: {
          countryCode: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.countryCode ?? ""),
        } },
        audit: { updatedAt: req?.rendition?.audit?.updatedAt },
        dimensions: {
          height: (req?.rendition?.dimensions?.height ?? 0),
          weight: (req?.rendition?.dimensions?.weight ?? 0),
        },
      },
    });
    const proxy2 = forwarding(this.mediaMediaAssetClient);
    const invoke2: Unary<mediaMediaAssetServiceApi.UpdateMediaAssetRequest, mediaMediaAssetServiceApi.UpdateMediaAssetResponse> =
      (input, done) => proxy2.updateMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaMediaAssetServiceApi.UpdateMediaAssetRequest, mediaMediaAssetServiceApi.UpdateMediaAssetResponse>(invoke2, request2);
    const request3 = mediaRenditionValidationServiceApi.ValidateRenditionRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { preferredChannel: (req?.details?.notify?.preferredChannel ?? "") },
      },
    });
    const invoke3: Unary<mediaRenditionValidationServiceApi.ValidateRenditionRequest, mediaRenditionValidationServiceApi.ValidateRenditionResponse> =
      (input, done) => this.mediaRenditionValidationClient.validateRendition(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<mediaRenditionValidationServiceApi.ValidateRenditionRequest, mediaRenditionValidationServiceApi.ValidateRenditionResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.details?.notify?.phone ?? "") });
    return mergeResponses(
      mediaRenditionWorkflowServiceApi.PauseRenditionWorkflowResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      mediaRenditionWorkflowServiceApi.PauseRenditionWorkflowResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      mediaRenditionWorkflowServiceApi.PauseRenditionWorkflowResponse.fromPartial({
        rendition: { audit: { updatedAt: reply3?.rendition?.audit?.updatedAt } },
        result: { status: (reply3?.result?.status ?? "") },
      }),
      mediaRenditionWorkflowServiceApi.PauseRenditionWorkflowResponse.fromPartial({
        rendition: {
          code: (req?.rendition?.code ?? ""),
          renditionId: (req?.renditionId ?? ""),
        },
      }),
    );
  }

  /**
   * Retrys a rendition.
   */
  async retryRenditionWorkflow(req: mediaRenditionWorkflowServiceApi.RetryRenditionWorkflowRequest): Promise<mediaRenditionWorkflowServiceApi.RetryRenditionWorkflowResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "RetryRenditionWorkflow", req);
    this.logger.info("retry_rendition_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityApprovalServiceApi.RecallAffinityRequest.fromPartial({
      affinity: { subject: { displayName: (req?.rendition?.owner?.displayName ?? "") } },
      context: req?.context,
      details: { approver: { email: (req?.details?.notify?.email ?? "") } },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<personalizationAffinityApprovalServiceApi.RecallAffinityRequest, personalizationAffinityApprovalServiceApi.RecallAffinityResponse> =
      (input, done) => this.personalizationAffinityApprovalClient.recallAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationAffinityApprovalServiceApi.RecallAffinityRequest, personalizationAffinityApprovalServiceApi.RecallAffinityResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = notificationsNotificationQueryServiceApi.ResolveNotificationsRequest.fromPartial({ context: input2?.context });
    const invoke2: Unary<notificationsNotificationQueryServiceApi.ResolveNotificationsRequest, notificationsNotificationQueryServiceApi.ResolveNotificationsResponse> =
      (input, done) => this.notificationsNotificationQueryClient.resolveNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationQueryServiceApi.ResolveNotificationsRequest, notificationsNotificationQueryServiceApi.ResolveNotificationsResponse>(invoke2, request2);
    const request3 = identityUserServiceApi.CloneUserRequest.fromPartial({
      context: req?.context,
      user: { contact: { name: req?.details?.notify?.name } },
    });
    const cloned3: identityUserServiceApi.CloneUserRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<identityUserServiceApi.CloneUserRequest, identityUserServiceApi.CloneUserResponse> =
      (input, done) => this.identityUserClient.cloneUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<identityUserServiceApi.CloneUserRequest, identityUserServiceApi.CloneUserResponse>(invoke3, cloned3);
    const request4 = customersCustomerCalculationServiceApi.RecalculateCustomersRequest.fromPartial({
      context: req?.context,
      customer: {
        primaryAddress: { postalCode: (reply3?.user?.primaryAddress?.postalCode ?? "") },
      },
    });
    const decoded4 = customersCustomerCalculationServiceApi.RecalculateCustomersRequest.fromJSON(
      JSON.parse(JSON.stringify(customersCustomerCalculationServiceApi.RecalculateCustomersRequest.toJSON(request4))),
    );
    const invoke4: Unary<customersCustomerCalculationServiceApi.RecalculateCustomersRequest, customersCustomerCalculationServiceApi.RecalculateCustomersResponse> =
      (input, done) => this.customersCustomerCalculationClient.recalculateCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<customersCustomerCalculationServiceApi.RecalculateCustomersRequest, customersCustomerCalculationServiceApi.RecalculateCustomersResponse>(invoke4, decoded4);
    const request5 = notificationsSubscriptionSyncServiceApi.StreamSubscriptionChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        action: { $case: "block", block: { reason: (req?.reason ?? "") } },
        description: (req?.rendition?.components?.["primary"]?.description ?? ""),
        name: (req?.rendition?.name ?? ""),
      } },
      context: req?.context,
    });
    const stream5 = this.notificationsSubscriptionSyncClient.streamSubscriptionChanges(metadataFor(request5.context), { deadline: Date.now() + 15_000 });
    const reading5 = collect(stream5);
    const writing5 = (async () => {
      await write(stream5, request5);
      stream5.end();
    })();
    const [messages5] = await Promise.all([reading5, writing5]);
    const reply5 = messages5.at(-1) ?? notificationsSubscriptionSyncServiceApi.StreamSubscriptionChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.details?.notify?.preferredChannel ?? "") });
    return mergeResponses(
      mediaRenditionWorkflowServiceApi.RetryRenditionWorkflowResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      mediaRenditionWorkflowServiceApi.RetryRenditionWorkflowResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      mediaRenditionWorkflowServiceApi.RetryRenditionWorkflowResponse.fromPartial({
        rendition: {
          owner: {
            email: (reply3?.user?.contact?.email ?? ""),
            userId: (reply3?.user?.userId ?? ""),
          },
        },
      }),
      mediaRenditionWorkflowServiceApi.RetryRenditionWorkflowResponse.fromPartial({ outcome: { status: (reply4?.result?.status ?? "") } }),
      mediaRenditionWorkflowServiceApi.RetryRenditionWorkflowResponse.fromPartial({
        rendition: {
          renditionId: (req?.renditionId ?? ""),
          specs: (req?.rendition?.specs ?? {}),
        },
      }),
    );
  }

  /**
   * Signals a rendition.
   */
  async signalRenditionWorkflow(req: mediaRenditionWorkflowServiceApi.SignalRenditionWorkflowRequest): Promise<mediaRenditionWorkflowServiceApi.SignalRenditionWorkflowResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "SignalRenditionWorkflow", req);
    this.logger.info("signal_rendition_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.rendition?.audit?.updatedAt,
        ownerId: (req?.rendition?.components?.["primary"]?.componentId ?? ""),
        region: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.region ?? ""),
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.notifications.v1.BrowseNotificationTemplatesRequest",
      value: Buffer.from(notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesRequest.encode(request1).finish()),
    });
    const unpacked1 = notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesRequest.decode(envelope1.value);
    const invoke1: Unary<notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateQueryClient.browseNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesResponse>(invoke1, unpacked1);
    const request2 = mediaMediaAssetWorkflowServiceApi.RetryMediaAssetWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          email: (req?.details?.notify?.email ?? ""),
          phone: (req?.details?.notify?.phone ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
      mediaAsset: { audit: { updatedAt: req?.rendition?.audit?.updatedAt } },
    });
    const client2 = this.clients.get<mediaMediaAssetWorkflowServiceApi.MediaAssetWorkflowServiceClient>("acme.media.v1.MediaAssetWorkflowService");
    const invoke2: Unary<mediaMediaAssetWorkflowServiceApi.RetryMediaAssetWorkflowRequest, mediaMediaAssetWorkflowServiceApi.RetryMediaAssetWorkflowResponse> =
      (input, done) => client2.retryMediaAssetWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaMediaAssetWorkflowServiceApi.RetryMediaAssetWorkflowRequest, mediaMediaAssetWorkflowServiceApi.RetryMediaAssetWorkflowResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionWorkflowServiceApi.SignalRenditionWorkflowResponse.fromPartial({
        outcome: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      mediaRenditionWorkflowServiceApi.SignalRenditionWorkflowResponse.fromPartial({
        rendition: {
          dimensions: { height: (reply2?.mediaAsset?.dimensions?.height ?? 0) },
          owner: { displayName: (reply2?.mediaAsset?.owner?.displayName ?? "") },
        },
      }),
      mediaRenditionWorkflowServiceApi.SignalRenditionWorkflowResponse.fromPartial({
        rendition: {
          renditionId: (req?.renditionId ?? ""),
          status: req?.rendition?.status,
        },
      }),
    );
  }

  /**
   * Starts a rendition.
   */
  async startRenditionWorkflow(req: mediaRenditionWorkflowServiceApi.StartRenditionWorkflowRequest): Promise<mediaRenditionWorkflowServiceApi.StartRenditionWorkflowResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "StartRenditionWorkflow", req);
    this.logger.info("start_rendition_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetApprovalServiceApi.DelegateMediaAssetApprovalRequest.fromPartial({
      context: req?.context,
      mediaAsset: { owner: { email: (req?.details?.notify?.email ?? "") } },
    });
    const invoke1: Unary<mediaMediaAssetApprovalServiceApi.DelegateMediaAssetApprovalRequest, mediaMediaAssetApprovalServiceApi.DelegateMediaAssetApprovalResponse> =
      (input, done) => this.mediaMediaAssetApprovalClient.delegateMediaAssetApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<mediaMediaAssetApprovalServiceApi.DelegateMediaAssetApprovalRequest, mediaMediaAssetApprovalServiceApi.DelegateMediaAssetApprovalResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = identityUserQueryServiceApi.SuggestUsersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.rendition?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.rendition?.specs ?? {}))),
        ownerId: (reply1?.mediaAsset?.components?.["primary"]?.componentId ?? ""),
        region: ((reply1?.mediaAsset?.locator?.$case === "address" ? reply1?.mediaAsset?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke2: Unary<identityUserQueryServiceApi.SuggestUsersRequest, identityUserQueryServiceApi.SuggestUsersResponse> =
      (input, done) => this.identityUserQueryClient.suggestUsers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<identityUserQueryServiceApi.SuggestUsersRequest, identityUserQueryServiceApi.SuggestUsersResponse>(invoke2, request2));
    let selected3_1: string | undefined;
    switch (req?.rendition?.locator?.$case) {
      case "address":
        selected3_1 = ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected3_1 = "";
    }
    const request3 = ledgerLedgerAccountQueryServiceApi.FindLedgerAccountsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.rendition?.audit?.createdAt,
        region: (selected3_1 ?? ""),
      },
    });
    const invoke3: Unary<ledgerLedgerAccountQueryServiceApi.FindLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.FindLedgerAccountsResponse> =
      (input, done) => this.ledgerLedgerAccountQueryClient.findLedgerAccounts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<ledgerLedgerAccountQueryServiceApi.FindLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.FindLedgerAccountsResponse>(invoke3, request3);
    const request4 = experimentsVariantSyncServiceApi.StreamVariantChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        action: { $case: "block", block: { reason: (req?.reason ?? "") } },
        description: (req?.rendition?.components?.["primary"]?.description ?? ""),
        name: (req?.rendition?.name ?? ""),
      } },
      context: req?.context,
    });
    const stream4 = this.experimentsVariantSyncClient.streamVariantChanges(metadataFor(request4.context), { deadline: Date.now() + 15_000 });
    const reading4 = collect(stream4);
    const writing4 = (async () => {
      await write(stream4, request4);
      stream4.end();
    })();
    const [messages4] = await Promise.all([reading4, writing4]);
    const reply4 = messages4.at(-1) ?? experimentsVariantSyncServiceApi.StreamVariantChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.details?.notify?.preferredChannel ?? "") });
    return mergeResponses(
      mediaRenditionWorkflowServiceApi.StartRenditionWorkflowResponse.fromPartial({ result: { status: (reply1?.outcome?.status ?? "") } }),
      mediaRenditionWorkflowServiceApi.StartRenditionWorkflowResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          message: (reply2?.result?.message ?? ""),
        },
      }),
      mediaRenditionWorkflowServiceApi.StartRenditionWorkflowResponse.fromPartial({
        outcome: { status: (reply3?.result?.status ?? "") },
        result: { referenceIds: (reply3?.result?.referenceIds ?? []) },
      }),
      mediaRenditionWorkflowServiceApi.StartRenditionWorkflowResponse.fromPartial({
        rendition: {
          renditionId: (req?.renditionId ?? ""),
          status: req?.rendition?.status,
        },
      }),
    );
  }
}
