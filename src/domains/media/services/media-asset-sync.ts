/**
 * Keeps media assets in step with the systems of record in other regions. Remote work stays behind typed client
 * ports.
 */

import * as customersConsentRecordValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_validation_service.js";
import * as customersHouseholdQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/household_query_service.js";
import * as customersHouseholdValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/household_validation_service.js";
import * as customersPreferenceCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/preference_calculation_service.js";
import * as experimentsVariantApprovalServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_approval_service.js";
import * as mediaMediaAssetCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_calculation_service.js";
import * as mediaMediaAssetSyncServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_sync_service.js";
import * as mediaMediaAssetValidationServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_validation_service.js";
import * as mediaRenditionQueryServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_query_service.js";
import * as mediaTranscodeJobCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_calculation_service.js";
import * as mediaTranscodeJobValidationServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_validation_service.js";
import * as modelregistryRegisteredModelQueryServiceApi from "../../../../.cache/proto/acme/modelregistry/v1/registered_model_query_service.js";
import * as personalizationProfileLifecycleServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_lifecycle_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { duplex, unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  promised,
  type RequestPort,
  type Unary,
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toMediaAssetRecord } from "../data/records.js";
import { MediaRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate media asset operations and persist audit data.
 */
@injectable()
export class MediaAssetSyncWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.customers.v1.ConsentRecordValidationService") private readonly customersConsentRecordValidationClient: customersConsentRecordValidationServiceApi.ConsentRecordValidationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdQueryService") private readonly customersHouseholdQueryClient: customersHouseholdQueryServiceApi.HouseholdQueryServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdValidationService") private readonly customersHouseholdValidationClient: customersHouseholdValidationServiceApi.HouseholdValidationServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceCalculationService") private readonly customersPreferenceCalculationClient: customersPreferenceCalculationServiceApi.PreferenceCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantApprovalService") private readonly experimentsVariantApprovalClient: experimentsVariantApprovalServiceApi.VariantApprovalServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetCalculationService") private readonly mediaMediaAssetCalculationClient: mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetValidationService") private readonly mediaMediaAssetValidationClient: mediaMediaAssetValidationServiceApi.MediaAssetValidationServiceClient,
    @inject("grpc:acme.media.v1.RenditionQueryService") private readonly mediaRenditionQueryClient: mediaRenditionQueryServiceApi.RenditionQueryServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobCalculationService") private readonly mediaTranscodeJobCalculationClient: mediaTranscodeJobCalculationServiceApi.TranscodeJobCalculationServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobValidationService") private readonly mediaTranscodeJobValidationClient: mediaTranscodeJobValidationServiceApi.TranscodeJobValidationServiceClient,
    @inject("grpc:acme.modelregistry.v1.RegisteredModelQueryService") private readonly modelregistryRegisteredModelQueryClient: modelregistryRegisteredModelQueryServiceApi.RegisteredModelQueryServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileLifecycleService") private readonly personalizationProfileLifecycleClient: personalizationProfileLifecycleServiceApi.ProfileLifecycleServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Returns a media asset.
   */
  async getMediaAssetSyncState(req: mediaMediaAssetSyncServiceApi.GetMediaAssetSyncStateRequest): Promise<mediaMediaAssetSyncServiceApi.GetMediaAssetSyncStateResponse> {
    validateContext(req.context);
    if (!req.mediaAssetId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "media_asset_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetMediaAssetSyncState", req);
    this.logger.info("get_media_asset_sync_state", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryRequest.fromPartial({
      context: req?.context,
      profile: { contact: { email: (req?.context?.actor?.email ?? "") } },
    });
    const invoke1: Unary<personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryRequest, personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryResponse> =
      (input, done) => this.personalizationProfileLifecycleClient.scheduleProfileExpiry(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    return mergeResponses(
      mediaMediaAssetSyncServiceApi.GetMediaAssetSyncStateResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      mediaMediaAssetSyncServiceApi.GetMediaAssetSyncStateResponse.fromPartial({ mediaAsset: { mediaAssetId: (req?.mediaAssetId ?? "") } }),
    );
  }

  /**
   * Lists media assets a page at a time.
   */
  async listMediaAssetConflicts(req: mediaMediaAssetSyncServiceApi.ListMediaAssetConflictsRequest): Promise<mediaMediaAssetSyncServiceApi.ListMediaAssetConflictsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListMediaAssetConflicts", req);
    this.logger.info("list_media_asset_conflicts", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mediaMediaAssetSyncServiceApi.ListMediaAssetConflictsResponse.fromPartial({});
  }

  /**
   * Pulls a media asset.
   */
  async pullMediaAssets(req: mediaMediaAssetSyncServiceApi.PullMediaAssetsRequest): Promise<mediaMediaAssetSyncServiceApi.PullMediaAssetsResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "PullMediaAssets", req);
    this.logger.info("pull_media_assets", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetValidationServiceApi.NormalizeMediaAssetRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        locator: { $case: "address", address: {
          lines: ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.lines ?? []).map((value) => value),
        } },
      },
    });
    const invoke1: Unary<mediaMediaAssetValidationServiceApi.NormalizeMediaAssetRequest, mediaMediaAssetValidationServiceApi.NormalizeMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetValidationClient.normalizeMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = customersHouseholdValidationServiceApi.CheckHouseholdEligibilityRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{
          children: [{
            audit: { createdBy: (reply1?.mediaAsset?.audit?.createdBy ?? "") },
            manager: { email: (req?.mediaAsset?.owner?.email ?? "") },
          }],
        }],
      },
    });
    const invoke2: Unary<customersHouseholdValidationServiceApi.CheckHouseholdEligibilityRequest, customersHouseholdValidationServiceApi.CheckHouseholdEligibilityResponse> =
      (input, done) => this.customersHouseholdValidationClient.checkHouseholdEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const request3 = customersConsentRecordValidationServiceApi.ExplainConsentRecordDecisionRequest.fromPartial({
      consentRecord: {
        subject: { displayName: (reply2?.household?.manager?.displayName ?? "") },
      },
      context: req?.context,
      details: { contact: { email: (reply1?.mediaAsset?.owner?.email ?? "") } },
    });
    const method3 = "explainConsentRecordDecision" as const;
    const invoke3: Unary<customersConsentRecordValidationServiceApi.ExplainConsentRecordDecisionRequest, customersConsentRecordValidationServiceApi.ExplainConsentRecordDecisionResponse> =
      (input, done) => this.customersConsentRecordValidationClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<customersConsentRecordValidationServiceApi.ExplainConsentRecordDecisionRequest, customersConsentRecordValidationServiceApi.ExplainConsentRecordDecisionResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetSyncServiceApi.PullMediaAssetsResponse.fromPartial({ outcome: { message: (reply1?.outcome?.message ?? "") } }),
      mediaMediaAssetSyncServiceApi.PullMediaAssetsResponse.fromPartial({
        mediaAsset: { audit: { createdBy: (reply2?.household?.audit?.createdBy ?? "") } },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      mediaMediaAssetSyncServiceApi.PullMediaAssetsResponse.fromPartial({
        result: {
          message: (reply3?.result?.message ?? ""),
          referenceIds: (reply3?.result?.referenceIds ?? []),
        },
      }),
      mediaMediaAssetSyncServiceApi.PullMediaAssetsResponse.fromPartial({
        mediaAsset: {
          mediaAssetId: (req?.mediaAssetId ?? ""),
          status: req?.mediaAsset?.status,
        },
      }),
    );
  }

  /**
   * Pushs a media asset.
   */
  async pushMediaAsset(req: mediaMediaAssetSyncServiceApi.PushMediaAssetRequest): Promise<mediaMediaAssetSyncServiceApi.PushMediaAssetResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "PushMediaAsset", req);
    this.logger.info("push_media_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaTranscodeJobCalculationServiceApi.CompareTranscodeJobOptionsRequest.fromPartial({
      context: req?.context,
      transcodeJob: {
        assignee: { userId: (req?.mediaAsset?.owner?.userId ?? "") },
        audit: { createdBy: (req?.mediaAsset?.audit?.createdBy ?? "") },
        requester: { email: (req?.mediaAsset?.owner?.email ?? "") },
      },
    });
    const proxy1 = forwarding(this.mediaTranscodeJobCalculationClient);
    const invoke1: Unary<mediaTranscodeJobCalculationServiceApi.CompareTranscodeJobOptionsRequest, mediaTranscodeJobCalculationServiceApi.CompareTranscodeJobOptionsResponse> =
      (input, done) => proxy1.compareTranscodeJobOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaTranscodeJobCalculationServiceApi.CompareTranscodeJobOptionsRequest, mediaTranscodeJobCalculationServiceApi.CompareTranscodeJobOptionsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetSyncServiceApi.PushMediaAssetResponse.fromPartial({
        mediaAsset: {
          audit: { updatedBy: (reply1?.transcodeJob?.audit?.updatedBy ?? "") },
          owner: { userId: (reply1?.transcodeJob?.assignee?.userId ?? "") },
        },
      }),
      mediaMediaAssetSyncServiceApi.PushMediaAssetResponse.fromPartial({
        mediaAsset: {
          code: (req?.mediaAsset?.code ?? ""),
          mediaAssetId: (req?.mediaAssetId ?? ""),
        },
      }),
    );
  }

  /**
   * Reconciles a media asset.
   */
  async reconcileMediaAssets(req: mediaMediaAssetSyncServiceApi.ReconcileMediaAssetsRequest): Promise<mediaMediaAssetSyncServiceApi.ReconcileMediaAssetsResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "ReconcileMediaAssets", req);
    this.logger.info("reconcile_media_assets", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.mediaAsset?.locator?.$case) {
      case "address":
        selected1_1 = ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = customersHouseholdQueryServiceApi.CountHouseholdsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.mediaAsset?.audit?.updatedAt,
        ownerId: (req?.mediaAsset?.mediaAssetId ?? ""),
        region: (selected1_1 ?? ""),
      },
    });
    const invoke1: Unary<customersHouseholdQueryServiceApi.CountHouseholdsRequest, customersHouseholdQueryServiceApi.CountHouseholdsResponse> =
      (input, done) => this.customersHouseholdQueryClient.countHouseholds(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersHouseholdQueryServiceApi.CountHouseholdsRequest, customersHouseholdQueryServiceApi.CountHouseholdsResponse>(invoke1, request1);
    const request2 = experimentsVariantApprovalServiceApi.DelegateVariantApprovalRequest.fromPartial({
      context: req?.context,
      details: { approver: { userId: (req?.mediaAsset?.owner?.userId ?? "") } },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<experimentsVariantApprovalServiceApi.DelegateVariantApprovalRequest, experimentsVariantApprovalServiceApi.DelegateVariantApprovalResponse> =
      (input, done) => this.experimentsVariantApprovalClient.delegateVariantApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsVariantApprovalServiceApi.DelegateVariantApprovalRequest, experimentsVariantApprovalServiceApi.DelegateVariantApprovalResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetSyncServiceApi.ReconcileMediaAssetsResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      mediaMediaAssetSyncServiceApi.ReconcileMediaAssetsResponse.fromPartial({
        mediaAsset: { owner: reply2?.variant?.owner },
        outcome: { nextSteps: (reply2?.outcome?.nextSteps ?? []) },
      }),
      mediaMediaAssetSyncServiceApi.ReconcileMediaAssetsResponse.fromPartial({
        mediaAsset: {
          capacity: (req?.mediaAsset?.capacity ?? 0),
          mediaAssetId: (req?.mediaAssetId ?? ""),
        },
      }),
    );
  }

  /**
   * Resolves a media asset.
   */
  async resolveMediaAssetConflict(req: mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictRequest): Promise<mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "ResolveMediaAssetConflict", req);
    this.logger.info("resolve_media_asset_conflict", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = mediaTranscodeJobValidationServiceApi.PreviewTranscodeJobRequest.fromPartial({
      context: input1?.context,
      details: { contact: { email: (input1?.mediaAsset?.owner?.email ?? "") } },
      transcodeJob: {
        assignee: { userId: (input1?.mediaAsset?.owner?.userId ?? "") },
        audit: { updatedAt: input1?.mediaAsset?.audit?.updatedAt },
      },
    });
    const invoke1: Unary<mediaTranscodeJobValidationServiceApi.PreviewTranscodeJobRequest, mediaTranscodeJobValidationServiceApi.PreviewTranscodeJobResponse> =
      (input, done) => this.mediaTranscodeJobValidationClient.previewTranscodeJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaTranscodeJobValidationServiceApi.PreviewTranscodeJobRequest, mediaTranscodeJobValidationServiceApi.PreviewTranscodeJobResponse>(invoke1, request1);
    const request2 = mediaMediaAssetCalculationServiceApi.CalculateMediaAssetRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        audit: { createdAt: req?.mediaAsset?.audit?.createdAt },
        components: { primary: { quantity: (req?.mediaAsset?.components?.["primary"]?.quantity ?? 0) } },
      },
    });
    const cloned2: mediaMediaAssetCalculationServiceApi.CalculateMediaAssetRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<mediaMediaAssetCalculationServiceApi.CalculateMediaAssetRequest, mediaMediaAssetCalculationServiceApi.CalculateMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetCalculationClient.calculateMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaMediaAssetCalculationServiceApi.CalculateMediaAssetRequest, mediaMediaAssetCalculationServiceApi.CalculateMediaAssetResponse>(invoke2, cloned2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictResponse.fromPartial({
        mediaAsset: {
          owner: {
            email: ((reply1?.transcodeJob?.origin?.$case === "customer" ? reply1?.transcodeJob?.origin.customer : undefined)?.email ?? ""),
          },
        },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictResponse.fromPartial({
        mediaAsset: { mediaAssetId: (reply2?.mediaAsset?.mediaAssetId ?? "") },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictResponse.fromPartial({
        mediaAsset: {
          code: (req?.mediaAsset?.code ?? ""),
          name: (req?.mediaAsset?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Exchanges changes of media assets with a peer.
   */
  async streamMediaAssetChanges(req: mediaMediaAssetSyncServiceApi.StreamMediaAssetChangesRequest): Promise<mediaMediaAssetSyncServiceApi.StreamMediaAssetChangesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamMediaAssetChanges", req);
    this.logger.info("stream_media_asset_changes", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          region: (((choice) => choice?.$case === "address" ? choice.address : undefined)((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.locator)?.region ?? ""),
        },
      },
      mediaAsset: {
        audit: {
          createdBy: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.audit?.createdBy ?? ""),
          updatedBy: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.audit?.updatedBy ?? ""),
        },
        dimensions: {
          unit: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.dimensions?.unit ?? ""),
        },
      },
    });
    const decoded1 = mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsRequest.fromJSON(
      JSON.parse(JSON.stringify(mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsRequest.toJSON(request1))),
    );
    const invoke1: Unary<mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsRequest, mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsResponse> =
      (input, done) => this.mediaMediaAssetCalculationClient.recalculateMediaAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsRequest, mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsResponse>(invoke1, decoded1);
    const request2 = customersPreferenceCalculationServiceApi.SimulatePreferenceRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          postalCode: (((choice) => choice?.$case === "address" ? choice.address : undefined)((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.locator)?.postalCode ?? ""),
        },
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.customers.v1.SimulatePreferenceRequest",
      value: Buffer.from(customersPreferenceCalculationServiceApi.SimulatePreferenceRequest.encode(request2).finish()),
    });
    const unpacked2 = customersPreferenceCalculationServiceApi.SimulatePreferenceRequest.decode(envelope2.value);
    const invoke2: Unary<customersPreferenceCalculationServiceApi.SimulatePreferenceRequest, customersPreferenceCalculationServiceApi.SimulatePreferenceResponse> =
      (input, done) => this.customersPreferenceCalculationClient.simulatePreference(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersPreferenceCalculationServiceApi.SimulatePreferenceRequest, customersPreferenceCalculationServiceApi.SimulatePreferenceResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.cursor ?? "") });
    return mergeResponses(
      mediaMediaAssetSyncServiceApi.StreamMediaAssetChangesResponse.fromPartial({
        mediaAsset: {
          audit: { updatedBy: (reply1?.mediaAsset?.audit?.updatedBy ?? "") },
          specs: (reply1?.mediaAsset?.specs ?? {}),
        },
      }),
      mediaMediaAssetSyncServiceApi.StreamMediaAssetChangesResponse.fromPartial({
        mediaAsset: { audit: { updatedAt: reply2?.preference?.audit?.updatedAt } },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      mediaMediaAssetSyncServiceApi.StreamMediaAssetChangesResponse.fromPartial({
        result: {
          status: ((req?.frame?.$case === "ack" ? req?.frame.ack : undefined)?.status ?? ""),
        },
        sequence: ((req?.frame?.$case === "ack" ? req?.frame.ack : undefined)?.sequence ?? 0),
      }),
    );
  }

  /**
   * Syncs a media asset.
   */
  async syncMediaAssets(req: mediaMediaAssetSyncServiceApi.SyncMediaAssetsRequest): Promise<mediaMediaAssetSyncServiceApi.SyncMediaAssetsResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "SyncMediaAssets", req);
    this.logger.info("sync_media_assets", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.mediaAsset?.locator?.$case) {
      case "address":
        selected1_1 = ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = mediaRenditionQueryServiceApi.FindRenditionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.mediaAsset?.audit?.createdAt,
        region: (selected1_1 ?? ""),
      },
    });
    const invoke1: Unary<mediaRenditionQueryServiceApi.FindRenditionsRequest, mediaRenditionQueryServiceApi.FindRenditionsResponse> =
      (input, done) => this.mediaRenditionQueryClient.findRenditions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaRenditionQueryServiceApi.FindRenditionsRequest, mediaRenditionQueryServiceApi.FindRenditionsResponse>(invoke1, request1);
    const request2 = modelregistryRegisteredModelQueryServiceApi.ResolveRegisteredModelsRequest.fromPartial({ context: req?.context });
    const invoke2: Unary<modelregistryRegisteredModelQueryServiceApi.ResolveRegisteredModelsRequest, modelregistryRegisteredModelQueryServiceApi.ResolveRegisteredModelsResponse> =
      (input, done) => this.modelregistryRegisteredModelQueryClient.resolveRegisteredModels(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<modelregistryRegisteredModelQueryServiceApi.ResolveRegisteredModelsRequest, modelregistryRegisteredModelQueryServiceApi.ResolveRegisteredModelsResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetSyncServiceApi.SyncMediaAssetsResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      mediaMediaAssetSyncServiceApi.SyncMediaAssetsResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      mediaMediaAssetSyncServiceApi.SyncMediaAssetsResponse.fromPartial({
        mediaAsset: {
          mediaAssetId: (req?.mediaAssetId ?? ""),
          owner: req?.mediaAsset?.owner,
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for MediaAssetSyncService; workflows own validation and database transactions.
 */
@injectable()
export class MediaAssetSyncHandler {
  constructor(@inject(MediaAssetSyncWorkflow) private readonly workflow: MediaAssetSyncWorkflow) {}

  /**
   * Returns a media asset.
   */
  getMediaAssetSyncState = unary<mediaMediaAssetSyncServiceApi.GetMediaAssetSyncStateRequest, mediaMediaAssetSyncServiceApi.GetMediaAssetSyncStateResponse>(
    (request) => this.workflow.getMediaAssetSyncState(request),
  );

  /**
   * Lists media assets a page at a time.
   */
  listMediaAssetConflicts = unary<mediaMediaAssetSyncServiceApi.ListMediaAssetConflictsRequest, mediaMediaAssetSyncServiceApi.ListMediaAssetConflictsResponse>(
    (request) => this.workflow.listMediaAssetConflicts(request),
  );

  /**
   * Pulls a media asset.
   */
  pullMediaAssets = (call: ServerUnaryCall<mediaMediaAssetSyncServiceApi.PullMediaAssetsRequest, mediaMediaAssetSyncServiceApi.PullMediaAssetsResponse>, done: sendUnaryData<mediaMediaAssetSyncServiceApi.PullMediaAssetsResponse>): void => {
    void this.workflow.pullMediaAssets(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pushs a media asset.
   */
  pushMediaAsset = unary<mediaMediaAssetSyncServiceApi.PushMediaAssetRequest, mediaMediaAssetSyncServiceApi.PushMediaAssetResponse>(
    (request) => this.workflow.pushMediaAsset(request),
  );

  /**
   * Reconciles a media asset.
   */
  reconcileMediaAssets = unary<mediaMediaAssetSyncServiceApi.ReconcileMediaAssetsRequest, mediaMediaAssetSyncServiceApi.ReconcileMediaAssetsResponse>(
    (request) => this.workflow.reconcileMediaAssets(request),
  );

  /**
   * Resolves a media asset.
   */
  resolveMediaAssetConflict = (call: ServerUnaryCall<mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictRequest, mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictResponse>, done: sendUnaryData<mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictResponse>): void => {
    void this.workflow.resolveMediaAssetConflict(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Exchanges changes of media assets with a peer.
   */
  streamMediaAssetChanges = duplex<mediaMediaAssetSyncServiceApi.StreamMediaAssetChangesRequest, mediaMediaAssetSyncServiceApi.StreamMediaAssetChangesResponse>(
    (request) => this.workflow.streamMediaAssetChanges(request),
  );

  /**
   * Syncs a media asset.
   */
  syncMediaAssets = unary<mediaMediaAssetSyncServiceApi.SyncMediaAssetsRequest, mediaMediaAssetSyncServiceApi.SyncMediaAssetsResponse>(
    (request) => this.workflow.syncMediaAssets(request),
  );
}

export function implementation(handler: MediaAssetSyncHandler): mediaMediaAssetSyncServiceApi.MediaAssetSyncServiceServer {
  return {
    getMediaAssetSyncState: handler.getMediaAssetSyncState,
    listMediaAssetConflicts: handler.listMediaAssetConflicts,
    pullMediaAssets: handler.pullMediaAssets,
    pushMediaAsset: handler.pushMediaAsset,
    reconcileMediaAssets: handler.reconcileMediaAssets,
    resolveMediaAssetConflict: handler.resolveMediaAssetConflict,
    streamMediaAssetChanges: handler.streamMediaAssetChanges,
    syncMediaAssets: handler.syncMediaAssets,
  };
}
