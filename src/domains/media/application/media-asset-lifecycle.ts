/**
 * Moves a media asset between the states of its lifecycle. Remote work stays behind typed client ports.
 */

import * as communityForumWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/forum_workflow_service.js";
import * as customersCustomerSegmentCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_segment_calculation_service.js";
import * as customersHouseholdValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/household_validation_service.js";
import * as customersPreferenceValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/preference_validation_service.js";
import * as experimentsExposureApprovalServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_approval_service.js";
import * as mediaMediaAssetLifecycleServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_lifecycle_service.js";
import * as mediaRenditionCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_calculation_service.js";
import * as mediaRenditionSyncServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_sync_service.js";
import * as mediaTranscodeJobCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_calculation_service.js";
import * as mediaTranscodeJobImportServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_import_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import * as webhooksWebhookSecretWorkflowServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_secret_workflow_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  metadataFor,
  operation,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toMediaAssetRecord } from "../data/records.js";
import { MediaRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate media asset operations and persist audit data.
 */
@injectable()
export class MediaAssetLifecycleWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ForumWorkflowService") private readonly communityForumWorkflowClient: communityForumWorkflowServiceApi.ForumWorkflowServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentCalculationService") private readonly customersCustomerSegmentCalculationClient: customersCustomerSegmentCalculationServiceApi.CustomerSegmentCalculationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdValidationService") private readonly customersHouseholdValidationClient: customersHouseholdValidationServiceApi.HouseholdValidationServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceValidationService") private readonly customersPreferenceValidationClient: customersPreferenceValidationServiceApi.PreferenceValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureApprovalService") private readonly experimentsExposureApprovalClient: experimentsExposureApprovalServiceApi.ExposureApprovalServiceClient,
    @inject("grpc:acme.media.v1.RenditionCalculationService") private readonly mediaRenditionCalculationClient: mediaRenditionCalculationServiceApi.RenditionCalculationServiceClient,
    @inject("grpc:acme.media.v1.RenditionSyncService") private readonly mediaRenditionSyncClient: mediaRenditionSyncServiceApi.RenditionSyncServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobCalculationService") private readonly mediaTranscodeJobCalculationClient: mediaTranscodeJobCalculationServiceApi.TranscodeJobCalculationServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobImportService") private readonly mediaTranscodeJobImportClient: mediaTranscodeJobImportServiceApi.TranscodeJobImportServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptSyncService") private readonly notificationsDeliveryAttemptSyncClient: notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionSyncService") private readonly notificationsSubscriptionSyncClient: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretWorkflowService") private readonly webhooksWebhookSecretWorkflowClient: webhooksWebhookSecretWorkflowServiceApi.WebhookSecretWorkflowServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Activates a media asset.
   */
  async activateMediaAsset(req: mediaMediaAssetLifecycleServiceApi.ActivateMediaAssetRequest): Promise<mediaMediaAssetLifecycleServiceApi.ActivateMediaAssetResponse> {
    validateContext(req.context);
    if (!req.mediaAssetId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "media_asset_id is required");
    }
    await this.repository.record(req.context.tenantId, "ActivateMediaAsset", req);
    this.logger.info("activate_media_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookSecretWorkflowServiceApi.ResumeWebhookSecretWorkflowRequest.fromPartial({
      context: req?.context,
      webhookSecret: {
        contact: {
          email: (req?.details?.newOwner?.email ?? ""),
          name: req?.details?.notifyContact?.name,
        },
      },
    });
    const invoke1: Unary<webhooksWebhookSecretWorkflowServiceApi.ResumeWebhookSecretWorkflowRequest, webhooksWebhookSecretWorkflowServiceApi.ResumeWebhookSecretWorkflowResponse> =
      (input, done) => this.webhooksWebhookSecretWorkflowClient.resumeWebhookSecretWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookSecretWorkflowServiceApi.ResumeWebhookSecretWorkflowRequest, webhooksWebhookSecretWorkflowServiceApi.ResumeWebhookSecretWorkflowResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetLifecycleServiceApi.ActivateMediaAssetResponse.fromPartial({
        mediaAsset: { audit: { updatedAt: reply1?.webhookSecret?.audit?.updatedAt } },
      }),
      mediaMediaAssetLifecycleServiceApi.ActivateMediaAssetResponse.fromPartial({
        mediaAsset: { mediaAssetId: (req?.mediaAssetId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Reinstates a media asset.
   */
  async reinstateMediaAsset(req: mediaMediaAssetLifecycleServiceApi.ReinstateMediaAssetRequest): Promise<mediaMediaAssetLifecycleServiceApi.ReinstateMediaAssetResponse> {
    validateContext(req.context);
    if (!req.mediaAssetId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "media_asset_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReinstateMediaAsset", req);
    this.logger.info("reinstate_media_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureApprovalServiceApi.RejectExposureRequest.fromPartial({
      context: req?.context,
      details: { approver: { email: (req?.details?.newOwner?.email ?? "") } },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<experimentsExposureApprovalServiceApi.RejectExposureRequest, experimentsExposureApprovalServiceApi.RejectExposureResponse> =
      (input, done) => this.experimentsExposureApprovalClient.rejectExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExposureApprovalServiceApi.RejectExposureRequest, experimentsExposureApprovalServiceApi.RejectExposureResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = customersPreferenceValidationServiceApi.NormalizePreferenceRequest.fromPartial({
      context: input2?.context,
      details: {
        contact: {
          preferredChannel: (input2?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke2: Unary<customersPreferenceValidationServiceApi.NormalizePreferenceRequest, customersPreferenceValidationServiceApi.NormalizePreferenceResponse> =
      (input, done) => this.customersPreferenceValidationClient.normalizePreference(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersPreferenceValidationServiceApi.NormalizePreferenceRequest, customersPreferenceValidationServiceApi.NormalizePreferenceResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetLifecycleServiceApi.ReinstateMediaAssetResponse.fromPartial({ outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) } }),
      mediaMediaAssetLifecycleServiceApi.ReinstateMediaAssetResponse.fromPartial({ mediaAsset: { name: (reply2?.preference?.name ?? "") } }),
      mediaMediaAssetLifecycleServiceApi.ReinstateMediaAssetResponse.fromPartial({
        mediaAsset: { mediaAssetId: (req?.mediaAssetId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Renews a media asset.
   */
  async renewMediaAsset(req: mediaMediaAssetLifecycleServiceApi.RenewMediaAssetRequest): Promise<mediaMediaAssetLifecycleServiceApi.RenewMediaAssetResponse> {
    validateContext(req.context);
    if (!req.mediaAssetId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "media_asset_id is required");
    }
    await this.repository.record(req.context.tenantId, "RenewMediaAsset", req);
    this.logger.info("renew_media_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionSyncServiceApi.SyncSubscriptionsRequest.fromPartial({
      context: req?.context,
      subscription: {
        owner: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.newOwner?.email ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
    });
    const cloned1: notificationsSubscriptionSyncServiceApi.SyncSubscriptionsRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<notificationsSubscriptionSyncServiceApi.SyncSubscriptionsRequest, notificationsSubscriptionSyncServiceApi.SyncSubscriptionsResponse> =
      (input, done) => this.notificationsSubscriptionSyncClient.syncSubscriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionSyncServiceApi.SyncSubscriptionsRequest, notificationsSubscriptionSyncServiceApi.SyncSubscriptionsResponse>(invoke1, cloned1);
    const request2 = notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.subscription?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (reply1?.subscription?.owner?.userId ?? ""),
      },
    });
    const decoded2 = notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest.fromJSON(
      JSON.parse(JSON.stringify(notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest.toJSON(request2))),
    );
    const invoke2: Unary<notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest, notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsResponse> =
      (input, done) => this.notificationsDeliveryAttemptSyncClient.listDeliveryAttemptConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest, notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetLifecycleServiceApi.RenewMediaAssetResponse.fromPartial({
        outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) },
        result: { message: (reply1?.outcome?.message ?? "") },
      }),
      mediaMediaAssetLifecycleServiceApi.RenewMediaAssetResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      mediaMediaAssetLifecycleServiceApi.RenewMediaAssetResponse.fromPartial({
        mediaAsset: { mediaAssetId: (req?.mediaAssetId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Schedules a media asset.
   */
  async scheduleMediaAssetExpiry(req: mediaMediaAssetLifecycleServiceApi.ScheduleMediaAssetExpiryRequest): Promise<mediaMediaAssetLifecycleServiceApi.ScheduleMediaAssetExpiryResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "ScheduleMediaAssetExpiry", req);
    this.logger.info("schedule_media_asset_expiry", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaTranscodeJobImportServiceApi.RetryTranscodeJobImportRequest.fromPartial({
      context: req?.context,
      details: { notify: { name: req?.details?.notify?.name } },
      transcodeJob: { assignee: { userId: (req?.mediaAsset?.owner?.userId ?? "") } },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.media.v1.RetryTranscodeJobImportRequest",
      value: Buffer.from(mediaTranscodeJobImportServiceApi.RetryTranscodeJobImportRequest.encode(request1).finish()),
    });
    const unpacked1 = mediaTranscodeJobImportServiceApi.RetryTranscodeJobImportRequest.decode(envelope1.value);
    const invoke1: Unary<mediaTranscodeJobImportServiceApi.RetryTranscodeJobImportRequest, mediaTranscodeJobImportServiceApi.RetryTranscodeJobImportResponse> =
      (input, done) => this.mediaTranscodeJobImportClient.retryTranscodeJobImport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaTranscodeJobImportServiceApi.RetryTranscodeJobImportRequest, mediaTranscodeJobImportServiceApi.RetryTranscodeJobImportResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetLifecycleServiceApi.ScheduleMediaAssetExpiryResponse.fromPartial({ outcome: { status: (reply1?.result?.status ?? "") } }),
      mediaMediaAssetLifecycleServiceApi.ScheduleMediaAssetExpiryResponse.fromPartial({
        mediaAsset: {
          mediaAssetId: (req?.mediaAssetId ?? ""),
          status: req?.mediaAsset?.status,
        },
      }),
    );
  }

  /**
   * Suspends a media asset.
   */
  async suspendMediaAsset(req: mediaMediaAssetLifecycleServiceApi.SuspendMediaAssetRequest): Promise<mediaMediaAssetLifecycleServiceApi.SuspendMediaAssetResponse> {
    validateContext(req.context);
    if (!req.mediaAssetId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "media_asset_id is required");
    }
    await this.repository.record(req.context.tenantId, "SuspendMediaAsset", req);
    this.logger.info("suspend_media_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionSyncServiceApi.ListRenditionConflictsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        ownerId: (req?.details?.newOwner?.userId ?? ""),
      },
    });
    const client1 = this.clients.get<mediaRenditionSyncServiceApi.RenditionSyncServiceClient>("acme.media.v1.RenditionSyncService");
    const invoke1: Unary<mediaRenditionSyncServiceApi.ListRenditionConflictsRequest, mediaRenditionSyncServiceApi.ListRenditionConflictsResponse> =
      (input, done) => client1.listRenditionConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaRenditionSyncServiceApi.ListRenditionConflictsRequest, mediaRenditionSyncServiceApi.ListRenditionConflictsResponse>(invoke1, request1);
    const request2 = mediaTranscodeJobCalculationServiceApi.EstimateTranscodeJobRequest.fromPartial({
      context: req?.context,
      transcodeJob: {
        assignee: { displayName: (req?.details?.newOwner?.displayName ?? "") },
      },
    });
    const invoke2: Unary<mediaTranscodeJobCalculationServiceApi.EstimateTranscodeJobRequest, mediaTranscodeJobCalculationServiceApi.EstimateTranscodeJobResponse> =
      (input, done) => this.mediaTranscodeJobCalculationClient.estimateTranscodeJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<mediaTranscodeJobCalculationServiceApi.EstimateTranscodeJobRequest, mediaTranscodeJobCalculationServiceApi.EstimateTranscodeJobResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = customersHouseholdValidationServiceApi.CheckHouseholdEligibilityRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{
          children: [{
            audit: { etag: (reply2?.transcodeJob?.audit?.etag ?? "") },
            manager: { userId: (req?.details?.newOwner?.userId ?? "") },
          }],
          manager: {
            displayName: (reply2?.transcodeJob?.assignee?.displayName ?? ""),
            email: (req?.details?.notifyContact?.email ?? ""),
          },
        }],
      },
    });
    const invoke3: Unary<customersHouseholdValidationServiceApi.CheckHouseholdEligibilityRequest, customersHouseholdValidationServiceApi.CheckHouseholdEligibilityResponse> =
      (input, done) => this.customersHouseholdValidationClient.checkHouseholdEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<customersHouseholdValidationServiceApi.CheckHouseholdEligibilityRequest, customersHouseholdValidationServiceApi.CheckHouseholdEligibilityResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetLifecycleServiceApi.SuspendMediaAssetResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      mediaMediaAssetLifecycleServiceApi.SuspendMediaAssetResponse.fromPartial({
        mediaAsset: { audit: { updatedAt: reply2?.transcodeJob?.audit?.updatedAt } },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      mediaMediaAssetLifecycleServiceApi.SuspendMediaAssetResponse.fromPartial({ result: { message: (reply3?.result?.message ?? "") } }),
      mediaMediaAssetLifecycleServiceApi.SuspendMediaAssetResponse.fromPartial({
        mediaAsset: { mediaAssetId: (req?.mediaAssetId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Terminates a media asset.
   */
  async terminateMediaAsset(req: mediaMediaAssetLifecycleServiceApi.TerminateMediaAssetRequest): Promise<mediaMediaAssetLifecycleServiceApi.TerminateMediaAssetResponse> {
    validateContext(req.context);
    if (!req.mediaAssetId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "media_asset_id is required");
    }
    await this.repository.record(req.context.tenantId, "TerminateMediaAsset", req);
    this.logger.info("terminate_media_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumWorkflowServiceApi.CancelForumWorkflowRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{ manager: { email: (req?.details?.notifyContact?.email ?? "") } }],
        }],
      },
    });
    const invoke1: Unary<communityForumWorkflowServiceApi.CancelForumWorkflowRequest, communityForumWorkflowServiceApi.CancelForumWorkflowResponse> =
      (input, done) => this.communityForumWorkflowClient.cancelForumWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("TerminateMediaAsset.CancelForumWorkflow", () => call<communityForumWorkflowServiceApi.CancelForumWorkflowRequest, communityForumWorkflowServiceApi.CancelForumWorkflowResponse>(invoke1, request1));
    const request2 = customersCustomerSegmentCalculationServiceApi.SimulateCustomerSegmentRequest.fromPartial({
      context: req?.context,
      customerSegment: {
        audit: {
          etag: (reply1?.forum?.audit?.etag ?? ""),
          updatedBy: (reply1?.forum?.audit?.updatedBy ?? ""),
        },
        owner: { email: (req?.details?.notifyContact?.email ?? "") },
      },
    });
    const invoke2: Unary<customersCustomerSegmentCalculationServiceApi.SimulateCustomerSegmentRequest, customersCustomerSegmentCalculationServiceApi.SimulateCustomerSegmentResponse> =
      (input, done) => this.customersCustomerSegmentCalculationClient.simulateCustomerSegment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest.fromPartial({
      context: req?.context,
      rendition: {
        locator: { $case: "address", address: { lines: (reply1?.forum?.location?.lines ?? []).map((value) => value) } },
        audit: { updatedAt: reply2?.customerSegment?.audit?.updatedAt },
      },
    });
    const reply3 = await this.workQueue.enqueue<mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest, mediaRenditionCalculationServiceApi.RecalculateRenditionsResponse>(
      "acme.media.v1.MediaAssetLifecycleService/TerminateMediaAsset:2", request3,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetLifecycleServiceApi.TerminateMediaAssetResponse.fromPartial({
        mediaAsset: { audit: { updatedBy: (reply1?.forum?.audit?.updatedBy ?? "") } },
      }),
      mediaMediaAssetLifecycleServiceApi.TerminateMediaAssetResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      mediaMediaAssetLifecycleServiceApi.TerminateMediaAssetResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
      mediaMediaAssetLifecycleServiceApi.TerminateMediaAssetResponse.fromPartial({
        mediaAsset: { mediaAssetId: (req?.mediaAssetId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }
}
