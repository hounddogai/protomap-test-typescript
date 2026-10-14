/**
 * Keeps variants in step with the systems of record in other regions. Remote work stays behind typed client ports.
 */

import * as audiencesAudienceServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_service.js";
import * as auditAuditEventServiceApi from "../../../../../.cache/proto/acme/audit/v1/audit_event_service.js";
import * as communityBadgeLifecycleServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_lifecycle_service.js";
import * as devicesManagedDeviceServiceApi from "../../../../../.cache/proto/acme/devices/v1/managed_device_service.js";
import * as experimentsExperimentCalculationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_calculation_service.js";
import * as experimentsExperimentQueryServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_query_service.js";
import * as experimentsExperimentServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_service.js";
import * as experimentsExposureImportServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_import_service.js";
import * as experimentsExposureValidationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_validation_service.js";
import * as experimentsVariantQueryServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_query_service.js";
import * as experimentsVariantSyncServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_sync_service.js";
import * as experimentsVariantValidationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_validation_service.js";
import * as featureflagsFeatureFlagValidationServiceApi from "../../../../../.cache/proto/acme/featureflags/v1/feature_flag_validation_service.js";
import * as notificationsNotificationExportServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_export_service.js";
import * as personalizationAffinityApprovalServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_approval_service.js";
import * as sellersSellerQueryServiceApi from "../../../../../.cache/proto/acme/sellers/v1/seller_query_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
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
  type RequestPort,
  type Unary,
  workflow,
} from "../../../../platform/rpc.js";
import { collect, upload } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toVariantRecord } from "../../data/records.js";
import { ExperimentsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate variant operations and persist audit data.
 */
@injectable()
export class VariantSyncWorkflow {
  constructor(
    @inject(ExperimentsRepository) private readonly repository: ExperimentsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceService") private readonly audiencesAudienceClient: audiencesAudienceServiceApi.AudienceServiceClient,
    @inject("grpc:acme.audit.v1.AuditEventService") private readonly auditAuditEventClient: auditAuditEventServiceApi.AuditEventServiceClient,
    @inject("grpc:acme.community.v1.BadgeLifecycleService") private readonly communityBadgeLifecycleClient: communityBadgeLifecycleServiceApi.BadgeLifecycleServiceClient,
    @inject("grpc:acme.devices.v1.ManagedDeviceService") private readonly devicesManagedDeviceClient: devicesManagedDeviceServiceApi.ManagedDeviceServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentCalculationService") private readonly experimentsExperimentCalculationClient: experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentQueryService") private readonly experimentsExperimentQueryClient: experimentsExperimentQueryServiceApi.ExperimentQueryServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentService") private readonly experimentsExperimentClient: experimentsExperimentServiceApi.ExperimentServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureImportService") private readonly experimentsExposureImportClient: experimentsExposureImportServiceApi.ExposureImportServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureValidationService") private readonly experimentsExposureValidationClient: experimentsExposureValidationServiceApi.ExposureValidationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantQueryService") private readonly experimentsVariantQueryClient: experimentsVariantQueryServiceApi.VariantQueryServiceClient,
    @inject("grpc:acme.experiments.v1.VariantValidationService") private readonly experimentsVariantValidationClient: experimentsVariantValidationServiceApi.VariantValidationServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagValidationService") private readonly featureflagsFeatureFlagValidationClient: featureflagsFeatureFlagValidationServiceApi.FeatureFlagValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationExportService") private readonly notificationsNotificationExportClient: notificationsNotificationExportServiceApi.NotificationExportServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityApprovalService") private readonly personalizationAffinityApprovalClient: personalizationAffinityApprovalServiceApi.AffinityApprovalServiceClient,
    @inject("grpc:acme.sellers.v1.SellerQueryService") private readonly sellersSellerQueryClient: sellersSellerQueryServiceApi.SellerQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Returns a variant.
   */
  async getVariantSyncState(req: experimentsVariantSyncServiceApi.GetVariantSyncStateRequest): Promise<experimentsVariantSyncServiceApi.GetVariantSyncStateResponse> {
    validateContext(req.context);
    if (!req.variantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "variant_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetVariantSyncState", req);
    this.logger.info("get_variant_sync_state", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagValidationServiceApi.PreviewFeatureFlagRequest.fromPartial({
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
      featureFlag: {
        audit: { createdAt: req?.context?.deadline },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<featureflagsFeatureFlagValidationServiceApi.PreviewFeatureFlagRequest, featureflagsFeatureFlagValidationServiceApi.PreviewFeatureFlagResponse> =
      (input, done) => this.featureflagsFeatureFlagValidationClient.previewFeatureFlag(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("GetVariantSyncState.PreviewFeatureFlag", () => call<featureflagsFeatureFlagValidationServiceApi.PreviewFeatureFlagRequest, featureflagsFeatureFlagValidationServiceApi.PreviewFeatureFlagResponse>(invoke1, request1));
    const request2 = experimentsVariantValidationServiceApi.NormalizeVariantRequest.fromPartial({
      context: req?.context,
      variant: {
        audit: { updatedBy: (reply1?.featureFlag?.audit?.updatedBy ?? "") },
        owner: { email: (reply1?.featureFlag?.owner?.email ?? "") },
      },
    });
    const invoke2: Unary<experimentsVariantValidationServiceApi.NormalizeVariantRequest, experimentsVariantValidationServiceApi.NormalizeVariantResponse> =
      (input, done) => this.experimentsVariantValidationClient.normalizeVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    return mergeResponses(
      experimentsVariantSyncServiceApi.GetVariantSyncStateResponse.fromPartial({ variant: { name: (reply1?.featureFlag?.name ?? "") } }),
      experimentsVariantSyncServiceApi.GetVariantSyncStateResponse.fromPartial({
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
        variant: { owner: { email: (reply2?.variant?.owner?.email ?? "") } },
      }),
      experimentsVariantSyncServiceApi.GetVariantSyncStateResponse.fromPartial({ variant: { variantId: (req?.variantId ?? "") } }),
    );
  }

  /**
   * Lists variants a page at a time.
   */
  async listVariantConflicts(req: experimentsVariantSyncServiceApi.ListVariantConflictsRequest): Promise<experimentsVariantSyncServiceApi.ListVariantConflictsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListVariantConflicts", req);
    this.logger.info("list_variant_conflicts", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = auditAuditEventServiceApi.WatchAuditEventsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        region: (req?.filter?.region ?? ""),
      },
      subscriber: { email: (req?.context?.actor?.email ?? "") },
    });
    const stream1 = this.auditAuditEventClient.watchAuditEvents(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? auditAuditEventServiceApi.WatchAuditEventsResponse.fromPartial({});
    const request2 = experimentsExperimentServiceApi.ListExperimentsRequest.fromPartial({
      context: req?.context,
      filter: { query: (req?.filter?.query ?? "") },
      page: { pageSize: (req?.page?.pageSize ?? 0) },
    });
    const reply2 = await this.workQueue.enqueue<experimentsExperimentServiceApi.ListExperimentsRequest, experimentsExperimentServiceApi.ListExperimentsResponse>(
      "acme.experiments.v1.VariantSyncService/ListVariantConflicts:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return experimentsVariantSyncServiceApi.ListVariantConflictsResponse.fromPartial({
      pageInfo: { nextPageToken: (reply2?.pageInfo?.nextPageToken ?? "") },
      result: { correlationId: (reply2?.result?.correlationId ?? "") },
    });
  }

  /**
   * Pulls a variant.
   */
  async pullVariants(req: experimentsVariantSyncServiceApi.PullVariantsRequest): Promise<experimentsVariantSyncServiceApi.PullVariantsResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "PullVariants", req);
    this.logger.info("pull_variants", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = devicesManagedDeviceServiceApi.UpdateManagedDeviceRequest.fromPartial({
      context: req?.context,
      managedDevice: { audit: { etag: (req?.variant?.audit?.etag ?? "") } },
    });
    const invoke1: Unary<devicesManagedDeviceServiceApi.UpdateManagedDeviceRequest, devicesManagedDeviceServiceApi.UpdateManagedDeviceResponse> =
      (input, done) => this.devicesManagedDeviceClient.updateManagedDevice(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<devicesManagedDeviceServiceApi.UpdateManagedDeviceRequest, devicesManagedDeviceServiceApi.UpdateManagedDeviceResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantSyncServiceApi.PullVariantsResponse.fromPartial({
        variant: { audit: { createdBy: (reply1?.managedDevice?.audit?.createdBy ?? "") } },
      }),
      experimentsVariantSyncServiceApi.PullVariantsResponse.fromPartial({
        variant: {
          parameters: (req?.variant?.parameters ?? {}),
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }

  /**
   * Pushs a variant.
   */
  async pushVariant(req: experimentsVariantSyncServiceApi.PushVariantRequest): Promise<experimentsVariantSyncServiceApi.PushVariantResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "PushVariant", req);
    this.logger.info("push_variant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureValidationServiceApi.PreviewExposureRequest.fromPartial({
      context: req?.context,
      exposure: { subject: { displayName: (req?.variant?.owner?.displayName ?? "") } },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<experimentsExposureValidationServiceApi.PreviewExposureRequest, experimentsExposureValidationServiceApi.PreviewExposureResponse> =
      (input, done) => this.experimentsExposureValidationClient.previewExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<experimentsExposureValidationServiceApi.PreviewExposureResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.details?.checksum ?? "") });
    return mergeResponses(
      experimentsVariantSyncServiceApi.PushVariantResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { correlationId: (reply1?.exposure?.correlationId ?? "") },
      }),
      experimentsVariantSyncServiceApi.PushVariantResponse.fromPartial({
        variant: {
          parameters: (req?.variant?.parameters ?? {}),
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }

  /**
   * Reconciles a variant.
   */
  async reconcileVariants(req: experimentsVariantSyncServiceApi.ReconcileVariantsRequest): Promise<experimentsVariantSyncServiceApi.ReconcileVariantsResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "ReconcileVariants", req);
    this.logger.info("reconcile_variants", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentCalculationServiceApi.SimulateExperimentRequest.fromPartial({
      context: req?.context,
      experiment: {
        participants: [{ contact: { email: (req?.variant?.owner?.email ?? "") } }],
      },
    });
    const invoke1: Unary<experimentsExperimentCalculationServiceApi.SimulateExperimentRequest, experimentsExperimentCalculationServiceApi.SimulateExperimentResponse> =
      (input, done) => this.experimentsExperimentCalculationClient.simulateExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = experimentsExperimentServiceApi.SearchExperimentsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.experiment?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.experiment?.metadata ?? {}))),
        ownerId: (reply1?.experiment?.experimentId ?? ""),
        region: (reply1?.experiment?.location?.region ?? ""),
      },
    });
    const invoke2: Unary<experimentsExperimentServiceApi.SearchExperimentsRequest, experimentsExperimentServiceApi.SearchExperimentsResponse> =
      (input, done) => this.experimentsExperimentClient.searchExperiments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const request3 = experimentsVariantQueryServiceApi.FindVariantsRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply1?.experiment?.location?.region ?? "") },
    });
    const method3 = "findVariants" as const;
    const invoke3: Unary<experimentsVariantQueryServiceApi.FindVariantsRequest, experimentsVariantQueryServiceApi.FindVariantsResponse> =
      (input, done) => this.experimentsVariantQueryClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<experimentsVariantQueryServiceApi.FindVariantsRequest, experimentsVariantQueryServiceApi.FindVariantsResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantSyncServiceApi.ReconcileVariantsResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      experimentsVariantSyncServiceApi.ReconcileVariantsResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      experimentsVariantSyncServiceApi.ReconcileVariantsResponse.fromPartial({ outcome: { status: (reply3?.result?.status ?? "") } }),
      experimentsVariantSyncServiceApi.ReconcileVariantsResponse.fromPartial({
        variant: {
          parameters: (req?.variant?.parameters ?? {}),
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }

  /**
   * Resolves a variant.
   */
  async resolveVariantConflict(req: experimentsVariantSyncServiceApi.ResolveVariantConflictRequest): Promise<experimentsVariantSyncServiceApi.ResolveVariantConflictResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "ResolveVariantConflict", req);
    this.logger.info("resolve_variant_conflict", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantValidationServiceApi.ValidateVariantRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.variant?.owner?.email ?? "") } },
      variant: {
        audit: { etag: (req?.variant?.audit?.etag ?? "") },
        action: { $case: "route", route: {
          weight: ((req?.variant?.action?.$case === "route" ? req?.variant?.action.route : undefined)?.weight ?? 0),
        } },
      },
    });
    const proxy1 = forwarding(this.experimentsVariantValidationClient);
    const invoke1: Unary<experimentsVariantValidationServiceApi.ValidateVariantRequest, experimentsVariantValidationServiceApi.ValidateVariantResponse> =
      (input, done) => proxy1.validateVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsVariantValidationServiceApi.ValidateVariantRequest, experimentsVariantValidationServiceApi.ValidateVariantResponse>(invoke1, request1);
    let selected2_1: string | undefined;
    switch (reply1?.variant?.action?.$case) {
      case "block":
        selected2_1 = ((reply1?.variant?.action?.$case === "block" ? reply1?.variant?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = experimentsExperimentQueryServiceApi.SummarizeExperimentsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((reply1?.variant?.parameters ?? {}))),
        period: req?.variant?.effective,
      },
      reason: (selected2_1 ?? ""),
    });
    const invoke2: Unary<experimentsExperimentQueryServiceApi.SummarizeExperimentsRequest, experimentsExperimentQueryServiceApi.SummarizeExperimentsResponse> =
      (input, done) => this.experimentsExperimentQueryClient.summarizeExperiments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExperimentQueryServiceApi.SummarizeExperimentsRequest, experimentsExperimentQueryServiceApi.SummarizeExperimentsResponse>(invoke2, request2);
    const request3 = audiencesAudienceServiceApi.BatchCreateAudiencesRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.context?.actor?.userId ?? ""),
        submittedBy: { email: (req?.context?.actor?.email ?? "") },
      } },
    });
    const reply3 = await upload<audiencesAudienceServiceApi.BatchCreateAudiencesRequest, audiencesAudienceServiceApi.BatchCreateAudiencesResponse>(
      (done) => this.audiencesAudienceClient.batchCreateAudiences(metadataFor(request3.context), { deadline: Date.now() + 15_000 }, done), [request3],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantSyncServiceApi.ResolveVariantConflictResponse.fromPartial({
        variant: { audit: { updatedBy: (reply1?.variant?.audit?.updatedBy ?? "") } },
      }),
      experimentsVariantSyncServiceApi.ResolveVariantConflictResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      experimentsVariantSyncServiceApi.ResolveVariantConflictResponse.fromPartial({
        variant: {
          effective: req?.variant?.effective,
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }

  /**
   * Exchanges changes of variants with a peer.
   */
  async streamVariantChanges(req: experimentsVariantSyncServiceApi.StreamVariantChangesRequest): Promise<experimentsVariantSyncServiceApi.StreamVariantChangesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamVariantChanges", req);
    this.logger.info("stream_variant_changes", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentCalculationServiceApi.RecalculateExperimentsRequest.fromPartial({
      context: req?.context,
      experiment: {
        organizer: {
          email: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.owner?.email ?? ""),
        },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<experimentsExperimentCalculationServiceApi.RecalculateExperimentsRequest, experimentsExperimentCalculationServiceApi.RecalculateExperimentsResponse> =
      (input, done) => this.experimentsExperimentCalculationClient.recalculateExperiments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExperimentCalculationServiceApi.RecalculateExperimentsRequest, experimentsExperimentCalculationServiceApi.RecalculateExperimentsResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = sellersSellerQueryServiceApi.CountSellersRequest.fromPartial({
      context: input2?.context,
      filter: { region: (reply1?.experiment?.location?.region ?? "") },
    });
    const invoke2: Unary<sellersSellerQueryServiceApi.CountSellersRequest, sellersSellerQueryServiceApi.CountSellersResponse> =
      (input, done) => this.sellersSellerQueryClient.countSellers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<sellersSellerQueryServiceApi.CountSellersRequest, sellersSellerQueryServiceApi.CountSellersResponse>(invoke2, request2);
    let selected3_2: string | undefined;
    switch (req?.frame?.$case) {
      case "change":
        selected3_2 = (((choice) => choice?.$case === "block" ? choice.block : undefined)((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.action)?.reason ?? "");
        break;
      default:
        selected3_2 = "";
    }
    const request3 = notificationsNotificationExportServiceApi.ShareNotificationExportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((reply2?.result?.details ?? {}))),
      context: req?.context,
      details: {
        recipient: { email: (reply1?.experiment?.organizer?.email ?? "") },
        variables: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
      },
      reason: (selected3_2 ?? ""),
    });
    const invoke3: Unary<notificationsNotificationExportServiceApi.ShareNotificationExportRequest, notificationsNotificationExportServiceApi.ShareNotificationExportResponse> =
      (input, done) => this.notificationsNotificationExportClient.shareNotificationExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsNotificationExportServiceApi.ShareNotificationExportRequest, notificationsNotificationExportServiceApi.ShareNotificationExportResponse>(invoke3, request3);
    const request4 = experimentsExperimentServiceApi.BatchGetExperimentsRequest.fromPartial({ context: req?.context });
    const decoded4 = experimentsExperimentServiceApi.BatchGetExperimentsRequest.fromJSON(
      JSON.parse(JSON.stringify(experimentsExperimentServiceApi.BatchGetExperimentsRequest.toJSON(request4))),
    );
    const invoke4: Unary<experimentsExperimentServiceApi.BatchGetExperimentsRequest, experimentsExperimentServiceApi.BatchGetExperimentsResponse> =
      (input, done) => this.experimentsExperimentClient.batchGetExperiments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<experimentsExperimentServiceApi.BatchGetExperimentsRequest, experimentsExperimentServiceApi.BatchGetExperimentsResponse>(invoke4, decoded4);
    this.logger.info("local_audit", { value: (req?.cursor ?? "") });
    return mergeResponses(
      experimentsVariantSyncServiceApi.StreamVariantChangesResponse.fromPartial({
        variant: {
          audit: { updatedBy: (reply1?.experiment?.audit?.updatedBy ?? "") },
          owner: { displayName: (reply1?.experiment?.organizer?.displayName ?? "") },
        },
      }),
      experimentsVariantSyncServiceApi.StreamVariantChangesResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      experimentsVariantSyncServiceApi.StreamVariantChangesResponse.fromPartial({
        result: { message: (reply3?.outcome?.message ?? "") },
        variant: {
          owner: { displayName: (reply3?.notification?.assignee?.displayName ?? "") },
        },
      }),
      experimentsVariantSyncServiceApi.StreamVariantChangesResponse.fromPartial({ result: { referenceIds: (reply4?.result?.referenceIds ?? []) } }),
      experimentsVariantSyncServiceApi.StreamVariantChangesResponse.fromPartial({
        variant: {
          parameters: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.parameters ?? {}),
          priority: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Syncs a variant.
   */
  async syncVariants(req: experimentsVariantSyncServiceApi.SyncVariantsRequest): Promise<experimentsVariantSyncServiceApi.SyncVariantsResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "SyncVariants", req);
    this.logger.info("sync_variants", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityApprovalServiceApi.CommentAffinityApprovalRequest.fromPartial({
      affinity: { subject: { displayName: (req?.variant?.owner?.displayName ?? "") } },
      context: req?.context,
      reason: ((req?.variant?.action?.$case === "block" ? req?.variant?.action.block : undefined)?.reason ?? ""),
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.personalization.v1.CommentAffinityApprovalRequest",
      value: Buffer.from(personalizationAffinityApprovalServiceApi.CommentAffinityApprovalRequest.encode(request1).finish()),
    });
    const unpacked1 = personalizationAffinityApprovalServiceApi.CommentAffinityApprovalRequest.decode(envelope1.value);
    const invoke1: Unary<personalizationAffinityApprovalServiceApi.CommentAffinityApprovalRequest, personalizationAffinityApprovalServiceApi.CommentAffinityApprovalResponse> =
      (input, done) => this.personalizationAffinityApprovalClient.commentAffinityApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationAffinityApprovalServiceApi.CommentAffinityApprovalRequest, personalizationAffinityApprovalServiceApi.CommentAffinityApprovalResponse>(invoke1, unpacked1);
    const request2 = communityBadgeLifecycleServiceApi.ScheduleBadgeExpiryRequest.fromPartial({
      badge: {
        audit: {
          createdAt: req?.variant?.audit?.createdAt,
          etag: (req?.variant?.audit?.etag ?? ""),
        },
        owner: { displayName: (req?.variant?.owner?.displayName ?? "") },
      },
      context: req?.context,
    });
    const client2 = this.clients.get<communityBadgeLifecycleServiceApi.BadgeLifecycleServiceClient>("acme.community.v1.BadgeLifecycleService");
    const invoke2: Unary<communityBadgeLifecycleServiceApi.ScheduleBadgeExpiryRequest, communityBadgeLifecycleServiceApi.ScheduleBadgeExpiryResponse> =
      (input, done) => client2.scheduleBadgeExpiry(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityBadgeLifecycleServiceApi.ScheduleBadgeExpiryRequest, communityBadgeLifecycleServiceApi.ScheduleBadgeExpiryResponse>(invoke2, request2);
    const request3 = experimentsExposureImportServiceApi.RetryExposureImportRequest.fromPartial({
      context: req?.context,
      exposure: {
        subject: { displayName: (reply1?.affinity?.subject?.displayName ?? "") },
      },
    });
    const invoke3: Unary<experimentsExposureImportServiceApi.RetryExposureImportRequest, experimentsExposureImportServiceApi.RetryExposureImportResponse> =
      (input, done) => this.experimentsExposureImportClient.retryExposureImport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port3: RequestPort<experimentsExposureImportServiceApi.RetryExposureImportRequest, experimentsExposureImportServiceApi.RetryExposureImportResponse> = new GrpcAdapter(invoke3);
    const reply3 = await port3.execute(request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantSyncServiceApi.SyncVariantsResponse.fromPartial({
        outcome: { referenceId: (reply1?.outcome?.referenceId ?? "") },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      experimentsVariantSyncServiceApi.SyncVariantsResponse.fromPartial({
        result: { status: (reply2?.outcome?.status ?? "") },
        variant: { effective: reply2?.badge?.effective },
      }),
      experimentsVariantSyncServiceApi.SyncVariantsResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
      experimentsVariantSyncServiceApi.SyncVariantsResponse.fromPartial({
        variant: {
          priority: (req?.variant?.priority ?? 0),
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }
}
