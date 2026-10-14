/**
 * Keeps renditions in step with the systems of record in other regions. Remote work stays behind typed client ports.
 */

import * as chatHandoffReportingServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_reporting_service.js";
import * as communityForumWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/forum_workflow_service.js";
import * as customersConsentRecordCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as customersHouseholdCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/household_calculation_service.js";
import * as customersHouseholdQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/household_query_service.js";
import * as experimentsExposureWorkflowServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_workflow_service.js";
import * as helpdeskTicketCalculationServiceApi from "../../../../.cache/proto/acme/helpdesk/v1/ticket_calculation_service.js";
import * as mediaMediaAssetCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_calculation_service.js";
import * as mediaMediaAssetSyncServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_sync_service.js";
import * as mediaRenditionCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_calculation_service.js";
import * as mediaRenditionSyncServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_sync_service.js";
import * as mediaRenditionValidationServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_validation_service.js";
import * as mediaTranscodeJobValidationServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_validation_service.js";
import * as recruitingJobOpeningCalculationServiceApi from "../../../../.cache/proto/acme/recruiting/v1/job_opening_calculation_service.js";
import * as webhooksWebhookDeliveryApprovalServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_approval_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
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
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toRenditionRecord } from "../data/records.js";
import { MediaRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate rendition operations and persist audit data.
 */
@injectable()
export class RenditionSyncWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.HandoffReportingService") private readonly chatHandoffReportingClient: chatHandoffReportingServiceApi.HandoffReportingServiceClient,
    @inject("grpc:acme.community.v1.ForumWorkflowService") private readonly communityForumWorkflowClient: communityForumWorkflowServiceApi.ForumWorkflowServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordCalculationService") private readonly customersConsentRecordCalculationClient: customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdCalculationService") private readonly customersHouseholdCalculationClient: customersHouseholdCalculationServiceApi.HouseholdCalculationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdQueryService") private readonly customersHouseholdQueryClient: customersHouseholdQueryServiceApi.HouseholdQueryServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureWorkflowService") private readonly experimentsExposureWorkflowClient: experimentsExposureWorkflowServiceApi.ExposureWorkflowServiceClient,
    @inject("grpc:acme.helpdesk.v1.TicketCalculationService") private readonly helpdeskTicketCalculationClient: helpdeskTicketCalculationServiceApi.TicketCalculationServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetCalculationService") private readonly mediaMediaAssetCalculationClient: mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetSyncService") private readonly mediaMediaAssetSyncClient: mediaMediaAssetSyncServiceApi.MediaAssetSyncServiceClient,
    @inject("grpc:acme.media.v1.RenditionCalculationService") private readonly mediaRenditionCalculationClient: mediaRenditionCalculationServiceApi.RenditionCalculationServiceClient,
    @inject("grpc:acme.media.v1.RenditionValidationService") private readonly mediaRenditionValidationClient: mediaRenditionValidationServiceApi.RenditionValidationServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobValidationService") private readonly mediaTranscodeJobValidationClient: mediaTranscodeJobValidationServiceApi.TranscodeJobValidationServiceClient,
    @inject("grpc:acme.recruiting.v1.JobOpeningCalculationService") private readonly recruitingJobOpeningCalculationClient: recruitingJobOpeningCalculationServiceApi.JobOpeningCalculationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryApprovalService") private readonly webhooksWebhookDeliveryApprovalClient: webhooksWebhookDeliveryApprovalServiceApi.WebhookDeliveryApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Returns a rendition.
   */
  async getRenditionSyncState(req: mediaRenditionSyncServiceApi.GetRenditionSyncStateRequest): Promise<mediaRenditionSyncServiceApi.GetRenditionSyncStateResponse> {
    validateContext(req.context);
    if (!req.renditionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "rendition_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetRenditionSyncState", req);
    this.logger.info("get_rendition_sync_state", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionCalculationServiceApi.GetRenditionRatesRequest.fromPartial({
      context: req?.context,
      renditionId: (req?.renditionId ?? ""),
    });
    const invoke1: Unary<mediaRenditionCalculationServiceApi.GetRenditionRatesRequest, mediaRenditionCalculationServiceApi.GetRenditionRatesResponse> =
      (input, done) => this.mediaRenditionCalculationClient.getRenditionRates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = customersHouseholdCalculationServiceApi.QuoteHouseholdRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{
          children: [{ audit: { createdAt: reply1?.rendition?.audit?.createdAt } }],
        }],
      },
    });
    const reply2 = await this.workQueue.enqueue<customersHouseholdCalculationServiceApi.QuoteHouseholdRequest, customersHouseholdCalculationServiceApi.QuoteHouseholdResponse>(
      "acme.media.v1.RenditionSyncService/GetRenditionSyncState:1", request2,
    );
    return mergeResponses(
      mediaRenditionSyncServiceApi.GetRenditionSyncStateResponse.fromPartial({ rendition: { status: reply1?.rendition?.status } }),
      mediaRenditionSyncServiceApi.GetRenditionSyncStateResponse.fromPartial({
        rendition: {
          audit: { createdBy: (reply2?.household?.audit?.createdBy ?? "") },
          owner: { email: (reply2?.household?.manager?.email ?? "") },
        },
      }),
      mediaRenditionSyncServiceApi.GetRenditionSyncStateResponse.fromPartial({ rendition: { renditionId: (req?.renditionId ?? "") } }),
    );
  }

  /**
   * Lists renditions a page at a time.
   */
  async listRenditionConflicts(req: mediaRenditionSyncServiceApi.ListRenditionConflictsRequest): Promise<mediaRenditionSyncServiceApi.ListRenditionConflictsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListRenditionConflicts", req);
    this.logger.info("list_rendition_conflicts", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        locator: { $case: "address", address: { region: (req?.filter?.region ?? "") } },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest, mediaMediaAssetCalculationServiceApi.QuoteMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetCalculationClient.quoteMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest, mediaMediaAssetCalculationServiceApi.QuoteMediaAssetResponse>(invoke1, request1));
    const request2 = mediaMediaAssetSyncServiceApi.ListMediaAssetConflictsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        query: (req?.filter?.query ?? ""),
        region: ((reply1?.mediaAsset?.locator?.$case === "address" ? reply1?.mediaAsset?.locator.address : undefined)?.region ?? ""),
      },
      page: { pageToken: (req?.page?.pageToken ?? "") },
    });
    const invoke2: Unary<mediaMediaAssetSyncServiceApi.ListMediaAssetConflictsRequest, mediaMediaAssetSyncServiceApi.ListMediaAssetConflictsResponse> =
      (input, done) => this.mediaMediaAssetSyncClient.listMediaAssetConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<mediaMediaAssetSyncServiceApi.ListMediaAssetConflictsResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      mediaRenditionSyncServiceApi.ListRenditionConflictsResponse.fromPartial({
        renditions: [{
          components: { primary: {
            componentId: (reply1?.mediaAsset?.components?.["primary"]?.componentId ?? ""),
          } },
        }],
      }),
      mediaRenditionSyncServiceApi.ListRenditionConflictsResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
    );
  }

  /**
   * Pulls a rendition.
   */
  async pullRenditions(req: mediaRenditionSyncServiceApi.PullRenditionsRequest): Promise<mediaRenditionSyncServiceApi.PullRenditionsResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "PullRenditions", req);
    this.logger.info("pull_renditions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureWorkflowServiceApi.RetryExposureWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (req?.rendition?.owner?.email ?? "") } },
      exposure: {
        measurements: [{ unit: (req?.rendition?.dimensions?.unit ?? "") }],
        subject: { displayName: (req?.rendition?.owner?.displayName ?? "") },
      },
    });
    const invoke1: Unary<experimentsExposureWorkflowServiceApi.RetryExposureWorkflowRequest, experimentsExposureWorkflowServiceApi.RetryExposureWorkflowResponse> =
      (input, done) => this.experimentsExposureWorkflowClient.retryExposureWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = chatHandoffReportingServiceApi.GenerateHandoffReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
    });
    const invoke2: Unary<chatHandoffReportingServiceApi.GenerateHandoffReportRequest, chatHandoffReportingServiceApi.GenerateHandoffReportResponse> =
      (input, done) => this.chatHandoffReportingClient.generateHandoffReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionSyncServiceApi.PullRenditionsResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      mediaRenditionSyncServiceApi.PullRenditionsResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      mediaRenditionSyncServiceApi.PullRenditionsResponse.fromPartial({
        rendition: {
          owner: req?.rendition?.owner,
          renditionId: (req?.renditionId ?? ""),
        },
      }),
    );
  }

  /**
   * Pushs a rendition.
   */
  async pushRendition(req: mediaRenditionSyncServiceApi.PushRenditionRequest): Promise<mediaRenditionSyncServiceApi.PushRenditionResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "PushRendition", req);
    this.logger.info("push_rendition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionValidationServiceApi.PreviewRenditionRequest.fromPartial({
      context: req?.context,
      rendition: {
        audit: {
          updatedAt: req?.rendition?.audit?.updatedAt,
          updatedBy: (req?.rendition?.audit?.updatedBy ?? ""),
        },
        dimensions: {
          unit: (req?.rendition?.dimensions?.unit ?? ""),
          width: (req?.rendition?.dimensions?.width ?? 0),
        },
      },
    });
    const method1 = "previewRendition" as const;
    const invoke1: Unary<mediaRenditionValidationServiceApi.PreviewRenditionRequest, mediaRenditionValidationServiceApi.PreviewRenditionResponse> =
      (input, done) => this.mediaRenditionValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaRenditionValidationServiceApi.PreviewRenditionRequest, mediaRenditionValidationServiceApi.PreviewRenditionResponse>(invoke1, request1);
    const request2 = customersConsentRecordCalculationServiceApi.CalculateConsentRecordRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          countryCode: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.countryCode ?? ""),
          recipient: ((reply1?.rendition?.locator?.$case === "address" ? reply1?.rendition?.locator.address : undefined)?.recipient ?? ""),
        },
      },
    });
    const proxy2 = forwarding(this.customersConsentRecordCalculationClient);
    const invoke2: Unary<customersConsentRecordCalculationServiceApi.CalculateConsentRecordRequest, customersConsentRecordCalculationServiceApi.CalculateConsentRecordResponse> =
      (input, done) => proxy2.calculateConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersConsentRecordCalculationServiceApi.CalculateConsentRecordRequest, customersConsentRecordCalculationServiceApi.CalculateConsentRecordResponse>(invoke2, request2);
    let selected3_1: string | undefined;
    switch (req?.rendition?.locator?.$case) {
      case "address":
        selected3_1 = ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.recipient ?? "");
        break;
      default:
        selected3_1 = "";
    }
    const request3 = mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        locator: { $case: "address", address: { recipient: (selected3_1 ?? "") } },
        audit: { updatedAt: req?.rendition?.audit?.updatedAt },
        dimensions: {
          weight: (reply1?.rendition?.dimensions?.weight ?? 0),
          width: (req?.rendition?.dimensions?.width ?? 0),
        },
      },
    });
    const invoke3: Unary<mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictRequest, mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictResponse> =
      (input, done) => this.mediaMediaAssetSyncClient.resolveMediaAssetConflict(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictRequest, mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionSyncServiceApi.PushRenditionResponse.fromPartial({
        rendition: {
          audit: { updatedBy: (reply1?.rendition?.audit?.updatedBy ?? "") },
          dimensions: { unit: (reply1?.rendition?.dimensions?.unit ?? "") },
        },
      }),
      mediaRenditionSyncServiceApi.PushRenditionResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          details: (reply2?.result?.details ?? {}),
        },
      }),
      mediaRenditionSyncServiceApi.PushRenditionResponse.fromPartial({
        rendition: {
          audit: { createdBy: (reply3?.mediaAsset?.audit?.createdBy ?? "") },
          specs: (reply3?.mediaAsset?.specs ?? {}),
        },
      }),
      mediaRenditionSyncServiceApi.PushRenditionResponse.fromPartial({
        rendition: {
          capacity: (req?.rendition?.capacity ?? 0),
          renditionId: (req?.renditionId ?? ""),
        },
      }),
    );
  }

  /**
   * Reconciles a rendition.
   */
  async reconcileRenditions(req: mediaRenditionSyncServiceApi.ReconcileRenditionsRequest): Promise<mediaRenditionSyncServiceApi.ReconcileRenditionsResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "ReconcileRenditions", req);
    this.logger.info("reconcile_renditions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookDeliveryApprovalServiceApi.ApproveWebhookDeliveryRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          displayName: (req?.rendition?.owner?.displayName ?? ""),
          email: (req?.rendition?.owner?.email ?? ""),
          userId: (req?.rendition?.owner?.userId ?? ""),
        },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<webhooksWebhookDeliveryApprovalServiceApi.ApproveWebhookDeliveryRequest, webhooksWebhookDeliveryApprovalServiceApi.ApproveWebhookDeliveryResponse> =
      (input, done) => this.webhooksWebhookDeliveryApprovalClient.approveWebhookDelivery(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookDeliveryApprovalServiceApi.ApproveWebhookDeliveryRequest, webhooksWebhookDeliveryApprovalServiceApi.ApproveWebhookDeliveryResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = communityForumWorkflowServiceApi.PauseForumWorkflowRequest.fromPartial({
      context: input2?.context,
      forum: {
        children: [{
          children: [{
            location: {
              locality: ((input2?.rendition?.locator?.$case === "address" ? input2?.rendition?.locator.address : undefined)?.locality ?? ""),
            },
            manager: { displayName: (reply1?.webhookDelivery?.subject?.displayName ?? "") },
          }],
        }],
      },
    });
    const invoke2: Unary<communityForumWorkflowServiceApi.PauseForumWorkflowRequest, communityForumWorkflowServiceApi.PauseForumWorkflowResponse> =
      (input, done) => this.communityForumWorkflowClient.pauseForumWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityForumWorkflowServiceApi.PauseForumWorkflowRequest, communityForumWorkflowServiceApi.PauseForumWorkflowResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionSyncServiceApi.ReconcileRenditionsResponse.fromPartial({ outcome: { effectiveAt: reply1?.outcome?.effectiveAt } }),
      mediaRenditionSyncServiceApi.ReconcileRenditionsResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { status: (reply2?.outcome?.status ?? "") },
      }),
      mediaRenditionSyncServiceApi.ReconcileRenditionsResponse.fromPartial({
        rendition: {
          owner: req?.rendition?.owner,
          renditionId: (req?.renditionId ?? ""),
        },
      }),
    );
  }

  /**
   * Resolves a rendition.
   */
  async resolveRenditionConflict(req: mediaRenditionSyncServiceApi.ResolveRenditionConflictRequest): Promise<mediaRenditionSyncServiceApi.ResolveRenditionConflictResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "ResolveRenditionConflict", req);
    this.logger.info("resolve_rendition_conflict", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaTranscodeJobValidationServiceApi.LintTranscodeJobsRequest.fromPartial({
      context: req?.context,
      transcodeJob: { audit: { createdBy: (req?.rendition?.audit?.createdBy ?? "") } },
    });
    const cloned1: mediaTranscodeJobValidationServiceApi.LintTranscodeJobsRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<mediaTranscodeJobValidationServiceApi.LintTranscodeJobsRequest, mediaTranscodeJobValidationServiceApi.LintTranscodeJobsResponse> =
      (input, done) => this.mediaTranscodeJobValidationClient.lintTranscodeJobs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaTranscodeJobValidationServiceApi.LintTranscodeJobsRequest, mediaTranscodeJobValidationServiceApi.LintTranscodeJobsResponse>(invoke1, cloned1);
    const request2 = mediaRenditionValidationServiceApi.ExplainRenditionDecisionRequest.fromPartial({
      context: req?.context,
      rendition: { owner: { displayName: (req?.rendition?.owner?.displayName ?? "") } },
    });
    const decoded2 = mediaRenditionValidationServiceApi.ExplainRenditionDecisionRequest.fromJSON(
      JSON.parse(JSON.stringify(mediaRenditionValidationServiceApi.ExplainRenditionDecisionRequest.toJSON(request2))),
    );
    const invoke2: Unary<mediaRenditionValidationServiceApi.ExplainRenditionDecisionRequest, mediaRenditionValidationServiceApi.ExplainRenditionDecisionResponse> =
      (input, done) => this.mediaRenditionValidationClient.explainRenditionDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaRenditionValidationServiceApi.ExplainRenditionDecisionRequest, mediaRenditionValidationServiceApi.ExplainRenditionDecisionResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionSyncServiceApi.ResolveRenditionConflictResponse.fromPartial({
        outcome: { message: (reply1?.outcome?.message ?? "") },
        rendition: {
          owner: {
            email: ((reply1?.transcodeJob?.origin?.$case === "customer" ? reply1?.transcodeJob?.origin.customer : undefined)?.email ?? ""),
          },
        },
      }),
      mediaRenditionSyncServiceApi.ResolveRenditionConflictResponse.fromPartial({
        outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") },
        rendition: { dimensions: { width: (reply2?.rendition?.dimensions?.width ?? 0) } },
      }),
      mediaRenditionSyncServiceApi.ResolveRenditionConflictResponse.fromPartial({
        rendition: {
          renditionId: (req?.renditionId ?? ""),
          specs: (req?.rendition?.specs ?? {}),
        },
      }),
    );
  }

  /**
   * Exchanges changes of renditions with a peer.
   */
  async streamRenditionChanges(req: mediaRenditionSyncServiceApi.StreamRenditionChangesRequest): Promise<mediaRenditionSyncServiceApi.StreamRenditionChangesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamRenditionChanges", req);
    this.logger.info("stream_rendition_changes", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionCalculationServiceApi.EstimateRenditionRequest.fromPartial({
      context: req?.context,
      rendition: {
        dimensions: {
          unit: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.dimensions?.unit ?? ""),
        },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.media.v1.EstimateRenditionRequest",
      value: Buffer.from(mediaRenditionCalculationServiceApi.EstimateRenditionRequest.encode(request1).finish()),
    });
    const unpacked1 = mediaRenditionCalculationServiceApi.EstimateRenditionRequest.decode(envelope1.value);
    const invoke1: Unary<mediaRenditionCalculationServiceApi.EstimateRenditionRequest, mediaRenditionCalculationServiceApi.EstimateRenditionResponse> =
      (input, done) => this.mediaRenditionCalculationClient.estimateRendition(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaRenditionCalculationServiceApi.EstimateRenditionRequest, mediaRenditionCalculationServiceApi.EstimateRenditionResponse>(invoke1, unpacked1);
    let selected2_1: string | undefined;
    switch (req?.frame?.$case) {
      case "change":
        selected2_1 = ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.audit?.createdBy ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = mediaMediaAssetCalculationServiceApi.SimulateMediaAssetRequest.fromPartial({
      context: req?.context,
      mediaAsset: { audit: { createdBy: (selected2_1 ?? "") } },
    });
    const invoke2: Unary<mediaMediaAssetCalculationServiceApi.SimulateMediaAssetRequest, mediaMediaAssetCalculationServiceApi.SimulateMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetCalculationClient.simulateMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaMediaAssetCalculationServiceApi.SimulateMediaAssetRequest, mediaMediaAssetCalculationServiceApi.SimulateMediaAssetResponse>(invoke2, request2);
    const request3 = mediaTranscodeJobValidationServiceApi.CheckTranscodeJobEligibilityRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (reply1?.rendition?.owner?.email ?? "") } },
      transcodeJob: {
        assignee: { displayName: (reply1?.rendition?.owner?.displayName ?? "") },
      },
    });
    const invoke3: Unary<mediaTranscodeJobValidationServiceApi.CheckTranscodeJobEligibilityRequest, mediaTranscodeJobValidationServiceApi.CheckTranscodeJobEligibilityResponse> =
      (input, done) => this.mediaTranscodeJobValidationClient.checkTranscodeJobEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port3: RequestPort<mediaTranscodeJobValidationServiceApi.CheckTranscodeJobEligibilityRequest, mediaTranscodeJobValidationServiceApi.CheckTranscodeJobEligibilityResponse> = new GrpcAdapter(invoke3);
    const reply3 = await port3.execute(request3);
    this.logger.info("local_audit", { value: (req?.cursor ?? "") });
    return mergeResponses(
      mediaRenditionSyncServiceApi.StreamRenditionChangesResponse.fromPartial({ rendition: { name: (reply1?.rendition?.name ?? "") } }),
      mediaRenditionSyncServiceApi.StreamRenditionChangesResponse.fromPartial({
        rendition: { audit: { updatedAt: reply2?.mediaAsset?.audit?.updatedAt } },
      }),
      mediaRenditionSyncServiceApi.StreamRenditionChangesResponse.fromPartial({
        rendition: { owner: { userId: (reply3?.transcodeJob?.assignee?.userId ?? "") } },
      }),
      mediaRenditionSyncServiceApi.StreamRenditionChangesResponse.fromPartial({
        rendition: {
          renditionId: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.renditionId ?? ""),
          specs: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.specs ?? {}),
        },
      }),
    );
  }

  /**
   * Syncs a rendition.
   */
  async syncRenditions(req: mediaRenditionSyncServiceApi.SyncRenditionsRequest): Promise<mediaRenditionSyncServiceApi.SyncRenditionsResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "SyncRenditions", req);
    this.logger.info("sync_renditions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetSyncServiceApi.PushMediaAssetRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        audit: { createdBy: (req?.rendition?.audit?.createdBy ?? "") },
        dimensions: { height: (req?.rendition?.dimensions?.height ?? 0) },
        owner: { email: (req?.rendition?.owner?.email ?? "") },
      },
    });
    const invoke1: Unary<mediaMediaAssetSyncServiceApi.PushMediaAssetRequest, mediaMediaAssetSyncServiceApi.PushMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetSyncClient.pushMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<mediaMediaAssetSyncServiceApi.PushMediaAssetRequest, mediaMediaAssetSyncServiceApi.PushMediaAssetResponse>(invoke1, request1));
    const request2 = customersHouseholdQueryServiceApi.ExportHouseholdsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.mediaAsset?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (reply1?.mediaAsset?.owner?.userId ?? ""),
        region: ((reply1?.mediaAsset?.locator?.$case === "address" ? reply1?.mediaAsset?.locator.address : undefined)?.region ?? ""),
      },
    });
    const stream2 = this.customersHouseholdQueryClient.exportHouseholds(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? customersHouseholdQueryServiceApi.ExportHouseholdsResponse.fromPartial({});
    let selected3_1: string | undefined;
    switch (req?.rendition?.locator?.$case) {
      case "address":
        selected3_1 = ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.recipient ?? "");
        break;
      default:
        selected3_1 = "";
    }
    const request3 = helpdeskTicketCalculationServiceApi.QuoteTicketRequest.fromPartial({
      context: req?.context,
      details: { destination: { recipient: (selected3_1 ?? "") } },
      ticket: {
        audit: { createdBy: (reply1?.mediaAsset?.audit?.createdBy ?? "") },
        comments: [{ createdAt: req?.rendition?.audit?.createdAt }],
      },
    });
    const invoke3: Unary<helpdeskTicketCalculationServiceApi.QuoteTicketRequest, helpdeskTicketCalculationServiceApi.QuoteTicketResponse> =
      (input, done) => this.helpdeskTicketCalculationClient.quoteTicket(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<helpdeskTicketCalculationServiceApi.QuoteTicketRequest, helpdeskTicketCalculationServiceApi.QuoteTicketResponse>(invoke3, request3);
    const request4 = recruitingJobOpeningCalculationServiceApi.EstimateJobOpeningRequest.fromPartial({
      context: req?.context,
      jobOpening: {
        billingAddress: {
          recipient: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.recipient ?? ""),
          region: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.region ?? ""),
        },
        lines: [{
          quantity: (reply1?.mediaAsset?.components?.["primary"]?.quantity ?? 0),
        }],
      },
    });
    const invoke4: Unary<recruitingJobOpeningCalculationServiceApi.EstimateJobOpeningRequest, recruitingJobOpeningCalculationServiceApi.EstimateJobOpeningResponse> =
      (input, done) => this.recruitingJobOpeningCalculationClient.estimateJobOpening(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task4 = operation(invoke4)(request4);
    const reply4 = await task4();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionSyncServiceApi.SyncRenditionsResponse.fromPartial({
        rendition: {
          audit: { updatedBy: (reply1?.mediaAsset?.audit?.updatedBy ?? "") },
          name: (reply1?.mediaAsset?.name ?? ""),
        },
      }),
      mediaRenditionSyncServiceApi.SyncRenditionsResponse.fromPartial({ outcome: { status: (reply3?.result?.status ?? "") } }),
      mediaRenditionSyncServiceApi.SyncRenditionsResponse.fromPartial({ result: { status: (reply4?.result?.status ?? "") } }),
      mediaRenditionSyncServiceApi.SyncRenditionsResponse.fromPartial({
        rendition: {
          renditionId: (req?.renditionId ?? ""),
          specs: (req?.rendition?.specs ?? {}),
        },
      }),
    );
  }
}
