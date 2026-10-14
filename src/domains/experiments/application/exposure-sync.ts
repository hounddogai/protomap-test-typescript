/**
 * Keeps exposures in step with the systems of record in other regions. Remote work stays behind typed client ports.
 */

import * as communityBadgeApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/badge_approval_service.js";
import * as experimentsExperimentReportingServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_reporting_service.js";
import * as experimentsExposureImportServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_import_service.js";
import * as experimentsExposureSyncServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_sync_service.js";
import * as experimentsVariantCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_calculation_service.js";
import * as experimentsVariantSyncServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_sync_service.js";
import * as experimentsVariantValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_validation_service.js";
import * as localizationTranslationKeyServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_service.js";
import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as notificationsNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_service.js";
import * as personalizationProfileReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_reporting_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { GrpcAdapter, call, metadataFor, retry, type RequestPort, type Unary } from "../../../platform/rpc.js";
import { upload } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toExposureRecord } from "../data/records.js";
import { ExperimentsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate exposure operations and persist audit data.
 */
@injectable()
export class ExposureSyncWorkflow {
  constructor(
    @inject(ExperimentsRepository) private readonly repository: ExperimentsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.BadgeApprovalService") private readonly communityBadgeApprovalClient: communityBadgeApprovalServiceApi.BadgeApprovalServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentReportingService") private readonly experimentsExperimentReportingClient: experimentsExperimentReportingServiceApi.ExperimentReportingServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureImportService") private readonly experimentsExposureImportClient: experimentsExposureImportServiceApi.ExposureImportServiceClient,
    @inject("grpc:acme.experiments.v1.VariantCalculationService") private readonly experimentsVariantCalculationClient: experimentsVariantCalculationServiceApi.VariantCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantSyncService") private readonly experimentsVariantSyncClient: experimentsVariantSyncServiceApi.VariantSyncServiceClient,
    @inject("grpc:acme.experiments.v1.VariantValidationService") private readonly experimentsVariantValidationClient: experimentsVariantValidationServiceApi.VariantValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyService") private readonly localizationTranslationKeyClient: localizationTranslationKeyServiceApi.TranslationKeyServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptWorkflowService") private readonly notificationsDeliveryAttemptWorkflowClient: notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationService") private readonly notificationsNotificationClient: notificationsNotificationServiceApi.NotificationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileReportingService") private readonly personalizationProfileReportingClient: personalizationProfileReportingServiceApi.ProfileReportingServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Returns an exposure.
   */
  async getExposureSyncState(req: experimentsExposureSyncServiceApi.GetExposureSyncStateRequest): Promise<experimentsExposureSyncServiceApi.GetExposureSyncStateResponse> {
    validateContext(req.context);
    if (!req.exposureId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "exposure_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetExposureSyncState", req);
    this.logger.info("get_exposure_sync_state", { tenant: req.context.tenantId, trace: req.context.traceId });
    return experimentsExposureSyncServiceApi.GetExposureSyncStateResponse.fromPartial({ exposure: { exposureId: (req?.exposureId ?? "") } });
  }

  /**
   * Pulls an exposure.
   */
  async pullExposures(req: experimentsExposureSyncServiceApi.PullExposuresRequest): Promise<experimentsExposureSyncServiceApi.PullExposuresResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "PullExposures", req);
    this.logger.info("pull_exposures", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileReportingServiceApi.ShareProfileReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        recipient: { email: (req?.context?.actor?.email ?? "") },
        variables: Object.fromEntries(Object.entries((req?.exposure?.attributes ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<personalizationProfileReportingServiceApi.ShareProfileReportRequest, personalizationProfileReportingServiceApi.ShareProfileReportResponse> =
      (input, done) => this.personalizationProfileReportingClient.shareProfileReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileReportingServiceApi.ShareProfileReportRequest, personalizationProfileReportingServiceApi.ShareProfileReportResponse>(invoke1, request1);
    const request2 = experimentsExperimentReportingServiceApi.GenerateExperimentReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { period: reply1?.profile?.preferences?.quietHours },
      experimentId: (req?.exposure?.subject?.experimentId ?? ""),
      reason: (req?.reason ?? ""),
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<experimentsExperimentReportingServiceApi.GenerateExperimentReportRequest, experimentsExperimentReportingServiceApi.GenerateExperimentReportResponse> =
      (input, done) => this.experimentsExperimentReportingClient.generateExperimentReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExperimentReportingServiceApi.GenerateExperimentReportRequest, experimentsExperimentReportingServiceApi.GenerateExperimentReportResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = personalizationProfileReportingServiceApi.CountProfileTotalsRequest.fromPartial({
      context: input3?.context,
      filter: {
        createdAfter: reply1?.profile?.audit?.updatedAt,
        ownerId: (input3?.exposure?.subject?.experimentId ?? ""),
        region: (reply1?.profile?.primaryAddress?.region ?? ""),
      },
    });
    const invoke3: Unary<personalizationProfileReportingServiceApi.CountProfileTotalsRequest, personalizationProfileReportingServiceApi.CountProfileTotalsResponse> =
      (input, done) => this.personalizationProfileReportingClient.countProfileTotals(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<personalizationProfileReportingServiceApi.CountProfileTotalsRequest, personalizationProfileReportingServiceApi.CountProfileTotalsResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.details?.checksum ?? "") });
    return mergeResponses(
      experimentsExposureSyncServiceApi.PullExposuresResponse.fromPartial({ exposure: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      experimentsExposureSyncServiceApi.PullExposuresResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      experimentsExposureSyncServiceApi.PullExposuresResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          details: (reply3?.result?.details ?? {}),
        },
      }),
      experimentsExposureSyncServiceApi.PullExposuresResponse.fromPartial({
        exposure: {
          attributes: (req?.exposure?.attributes ?? {}),
          exposureId: (req?.exposureId ?? ""),
        },
      }),
    );
  }

  /**
   * Pushs an exposure.
   */
  async pushExposure(req: experimentsExposureSyncServiceApi.PushExposureRequest): Promise<experimentsExposureSyncServiceApi.PushExposureResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "PushExposure", req);
    this.logger.info("push_exposure", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.exposure?.measurements ?? []).map(async (item) => {
      const request1 = experimentsVariantCalculationServiceApi.CalculateVariantRequest.fromPartial({
        context: req?.context,
        variant: {
          audit: { createdAt: item?.observedAt },
          owner: { displayName: (req?.exposure?.subject?.displayName ?? "") },
        },
      });
      const invoke1: Unary<experimentsVariantCalculationServiceApi.CalculateVariantRequest, experimentsVariantCalculationServiceApi.CalculateVariantResponse> =
        (input, done) => this.experimentsVariantCalculationClient.calculateVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<experimentsVariantCalculationServiceApi.CalculateVariantRequest, experimentsVariantCalculationServiceApi.CalculateVariantResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: experimentsVariantCalculationServiceApi.CalculateVariantResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? experimentsVariantCalculationServiceApi.CalculateVariantResponse.fromPartial({});
    const request2 = experimentsExposureImportServiceApi.ValidateExposureImportRequest.fromPartial({
      context: req?.context,
      exposure: {
        subject: {
          displayName: (reply1?.variant?.owner?.displayName ?? ""),
          experimentId: (req?.exposure?.subject?.experimentId ?? ""),
        },
      },
    });
    const cloned2: experimentsExposureImportServiceApi.ValidateExposureImportRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<experimentsExposureImportServiceApi.ValidateExposureImportRequest, experimentsExposureImportServiceApi.ValidateExposureImportResponse> =
      (input, done) => this.experimentsExposureImportClient.validateExposureImport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExposureImportServiceApi.ValidateExposureImportRequest, experimentsExposureImportServiceApi.ValidateExposureImportResponse>(invoke2, cloned2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureSyncServiceApi.PushExposureResponse.fromPartial({
        exposure: {
          subject: { displayName: (reply2?.exposure?.subject?.displayName ?? "") },
        },
      }),
      experimentsExposureSyncServiceApi.PushExposureResponse.fromPartial({
        exposure: {
          exposureId: (req?.exposureId ?? ""),
          occurredAt: req?.exposure?.occurredAt,
        },
      }),
    );
  }

  /**
   * Reconciles an exposure.
   */
  async reconcileExposures(req: experimentsExposureSyncServiceApi.ReconcileExposuresRequest): Promise<experimentsExposureSyncServiceApi.ReconcileExposuresResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "ReconcileExposures", req);
    this.logger.info("reconcile_exposures", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<experimentsVariantSyncServiceApi.PushVariantResponse>> = [];
    for (const item of (req?.exposure?.measurements ?? [])) {
      tasks1.push(async () => {
        const request1 = experimentsVariantSyncServiceApi.PushVariantRequest.fromPartial({
          context: req?.context,
          details: { resolution: (req?.details?.resolution ?? "") },
          variant: {
            audit: { updatedAt: item?.observedAt },
            action: { $case: "block", block: { reason: (req?.reason ?? "") } },
            owner: { displayName: (req?.exposure?.subject?.displayName ?? "") },
          },
        });
        const invoke1: Unary<experimentsVariantSyncServiceApi.PushVariantRequest, experimentsVariantSyncServiceApi.PushVariantResponse> =
          (input, done) => this.experimentsVariantSyncClient.pushVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<experimentsVariantSyncServiceApi.PushVariantRequest, experimentsVariantSyncServiceApi.PushVariantResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? experimentsVariantSyncServiceApi.PushVariantResponse.fromPartial({});
    const results2 = await Promise.all((req?.exposure?.measurements ?? []).map(async (item) => {
      const request2 = notificationsNotificationServiceApi.SearchNotificationsRequest.fromPartial({
        context: req?.context,
        filter: {
          createdAfter: item?.observedAt,
          labels: Object.fromEntries(Object.entries((req?.exposure?.attributes ?? {}))),
        },
      });
      const invoke2: Unary<notificationsNotificationServiceApi.SearchNotificationsRequest, notificationsNotificationServiceApi.SearchNotificationsResponse> =
        (input, done) => this.notificationsNotificationClient.searchNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<notificationsNotificationServiceApi.SearchNotificationsRequest, notificationsNotificationServiceApi.SearchNotificationsResponse>(invoke2, request2);
      return reply2;
    }));
    const reply2 = results2.at(-1) ?? notificationsNotificationServiceApi.SearchNotificationsResponse.fromPartial({});
    const request3 = experimentsVariantValidationServiceApi.CheckVariantEligibilityRequest.fromPartial({
      context: req?.context,
      variant: {
        action: { $case: "discount", discount: {
          percent: ((reply1?.variant?.action?.$case === "discount" ? reply1?.variant?.action.discount : undefined)?.percent ?? 0),
        } },
      },
    });
    const decoded3 = experimentsVariantValidationServiceApi.CheckVariantEligibilityRequest.fromJSON(
      JSON.parse(JSON.stringify(experimentsVariantValidationServiceApi.CheckVariantEligibilityRequest.toJSON(request3))),
    );
    const invoke3: Unary<experimentsVariantValidationServiceApi.CheckVariantEligibilityRequest, experimentsVariantValidationServiceApi.CheckVariantEligibilityResponse> =
      (input, done) => this.experimentsVariantValidationClient.checkVariantEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<experimentsVariantValidationServiceApi.CheckVariantEligibilityRequest, experimentsVariantValidationServiceApi.CheckVariantEligibilityResponse>(invoke3, decoded3);
    const request4 = experimentsExposureImportServiceApi.ValidateExposureImportRequest.fromPartial({
      context: req?.context,
      exposure: {
        correlationId: (reply2?.result?.correlationId ?? ""),
        subject: {
          displayName: (req?.exposure?.subject?.displayName ?? ""),
          startsAt: req?.exposure?.subject?.startsAt,
        },
      },
      reason: ((reply3?.variant?.action?.$case === "block" ? reply3?.variant?.action.block : undefined)?.reason ?? ""),
    });
    const envelope4 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.experiments.v1.ValidateExposureImportRequest",
      value: Buffer.from(experimentsExposureImportServiceApi.ValidateExposureImportRequest.encode(request4).finish()),
    });
    const unpacked4 = experimentsExposureImportServiceApi.ValidateExposureImportRequest.decode(envelope4.value);
    const invoke4: Unary<experimentsExposureImportServiceApi.ValidateExposureImportRequest, experimentsExposureImportServiceApi.ValidateExposureImportResponse> =
      (input, done) => this.experimentsExposureImportClient.validateExposureImport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<experimentsExposureImportServiceApi.ValidateExposureImportRequest, experimentsExposureImportServiceApi.ValidateExposureImportResponse>(invoke4, unpacked4);
    this.logger.info("local_audit", { value: (req?.details?.checksum ?? "") });
    return mergeResponses(
      experimentsExposureSyncServiceApi.ReconcileExposuresResponse.fromPartial({ result: { message: (reply3?.result?.message ?? "") } }),
      experimentsExposureSyncServiceApi.ReconcileExposuresResponse.fromPartial({
        exposure: { kind: (reply4?.exposure?.kind ?? "") },
        result: { message: (reply4?.result?.message ?? "") },
      }),
      experimentsExposureSyncServiceApi.ReconcileExposuresResponse.fromPartial({
        exposure: {
          correlationId: (req?.exposure?.correlationId ?? ""),
          exposureId: (req?.exposureId ?? ""),
        },
      }),
    );
  }

  /**
   * Resolves an exposure.
   */
  async resolveExposureConflict(req: experimentsExposureSyncServiceApi.ResolveExposureConflictRequest): Promise<experimentsExposureSyncServiceApi.ResolveExposureConflictResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "ResolveExposureConflict", req);
    this.logger.info("resolve_exposure_conflict", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.exposure?.measurements ?? []).map(async (item) => {
      const request1 = notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowRequest.fromPartial({
        context: req?.context,
        deliveryAttempt: {
          measurements: [{
            metric: (item?.metric ?? ""),
            observedAt: item?.observedAt,
            unit: (item?.unit ?? ""),
            value: (item?.value ?? 0),
          }],
        },
      });
      const invoke1: Unary<notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowResponse> =
        (input, done) => this.notificationsDeliveryAttemptWorkflowClient.retryDeliveryAttemptWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowResponse.fromPartial({});
    const request2 = experimentsVariantSyncServiceApi.PushVariantRequest.fromPartial({
      context: req?.context,
      variant: {
        owner: { displayName: (reply1?.deliveryAttempt?.subject?.displayName ?? "") },
      },
    });
    const client2 = this.clients.get<experimentsVariantSyncServiceApi.VariantSyncServiceClient>("acme.experiments.v1.VariantSyncService");
    const invoke2: Unary<experimentsVariantSyncServiceApi.PushVariantRequest, experimentsVariantSyncServiceApi.PushVariantResponse> =
      (input, done) => client2.pushVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsVariantSyncServiceApi.PushVariantRequest, experimentsVariantSyncServiceApi.PushVariantResponse>(invoke2, request2);
    const request3 = localizationTranslationKeyServiceApi.BatchCreateTranslationKeysRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.exposure?.source ?? ""),
        submittedBy: { email: (req?.context?.actor?.email ?? "") },
      } },
      sequence: (req?.exposure?.sequence ?? 0),
    });
    const reply3 = await upload<localizationTranslationKeyServiceApi.BatchCreateTranslationKeysRequest, localizationTranslationKeyServiceApi.BatchCreateTranslationKeysResponse>(
      (done) => this.localizationTranslationKeyClient.batchCreateTranslationKeys(metadataFor(request3.context), { deadline: Date.now() + 15_000 }, done), [request3],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureSyncServiceApi.ResolveExposureConflictResponse.fromPartial({ outcome: { nextSteps: (reply2?.outcome?.nextSteps ?? []) } }),
      experimentsExposureSyncServiceApi.ResolveExposureConflictResponse.fromPartial({
        exposure: {
          exposureId: (req?.exposureId ?? ""),
          subject: req?.exposure?.subject,
        },
      }),
    );
  }

  /**
   * Syncs an exposure.
   */
  async syncExposures(req: experimentsExposureSyncServiceApi.SyncExposuresRequest): Promise<experimentsExposureSyncServiceApi.SyncExposuresResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "SyncExposures", req);
    this.logger.info("sync_exposures", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentReportingServiceApi.GenerateExperimentReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      experimentId: (req?.exposure?.subject?.experimentId ?? ""),
    });
    const invoke1: Unary<experimentsExperimentReportingServiceApi.GenerateExperimentReportRequest, experimentsExperimentReportingServiceApi.GenerateExperimentReportResponse> =
      (input, done) => this.experimentsExperimentReportingClient.generateExperimentReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<experimentsExperimentReportingServiceApi.GenerateExperimentReportRequest, experimentsExperimentReportingServiceApi.GenerateExperimentReportResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = experimentsExperimentReportingServiceApi.DeleteExperimentReportRequest.fromPartial({
      context: req?.context,
      experimentId: (req?.exposure?.subject?.experimentId ?? ""),
      reason: (req?.reason ?? ""),
    });
    const invoke2: Unary<experimentsExperimentReportingServiceApi.DeleteExperimentReportRequest, experimentsExperimentReportingServiceApi.DeleteExperimentReportResponse> =
      (input, done) => this.experimentsExperimentReportingClient.deleteExperimentReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<experimentsExperimentReportingServiceApi.DeleteExperimentReportRequest, experimentsExperimentReportingServiceApi.DeleteExperimentReportResponse>(invoke2, request2));
    const tasks3: Array<() => Promise<communityBadgeApprovalServiceApi.SubmitBadgeResponse>> = [];
    for (const item of (req?.exposure?.measurements ?? [])) {
      tasks3.push(async () => {
        const request3 = communityBadgeApprovalServiceApi.SubmitBadgeRequest.fromPartial({
          badge: {
            audit: { createdAt: item?.observedAt },
            action: { $case: "block", block: { reason: (req?.reason ?? "") } },
            owner: { displayName: (req?.exposure?.subject?.displayName ?? "") },
          },
          context: req?.context,
          details: { approver: { userId: (req?.context?.actor?.userId ?? "") } },
        });
        const invoke3: Unary<communityBadgeApprovalServiceApi.SubmitBadgeRequest, communityBadgeApprovalServiceApi.SubmitBadgeResponse> =
          (input, done) => this.communityBadgeApprovalClient.submitBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply3 = await call<communityBadgeApprovalServiceApi.SubmitBadgeRequest, communityBadgeApprovalServiceApi.SubmitBadgeResponse>(invoke3, request3);
        return reply3;
      });
    }
    const results3 = await Promise.all(tasks3.map((task) => task()));
    const reply3 = results3.at(-1) ?? communityBadgeApprovalServiceApi.SubmitBadgeResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.details?.checksum ?? "") });
    return mergeResponses(
      experimentsExposureSyncServiceApi.SyncExposuresResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      experimentsExposureSyncServiceApi.SyncExposuresResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      experimentsExposureSyncServiceApi.SyncExposuresResponse.fromPartial({
        exposure: {
          exposureId: (req?.exposureId ?? ""),
          source: (req?.exposure?.source ?? ""),
        },
      }),
    );
  }
}
