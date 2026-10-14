/**
 * Runs the long-lived workflow that takes a webhook endpoint from start to finish. Remote work stays behind typed
 * client ports.
 */

import * as communityModerationApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_approval_service.js";
import * as experimentsExposureReportingServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_reporting_service.js";
import * as localizationTranslationJobWorkflowServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_workflow_service.js";
import * as mediaMediaAssetServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_service.js";
import * as metricsMetricSeriesQueryServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_query_service.js";
import * as personalizationAffinitySyncServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_sync_service.js";
import * as personalizationRecommendationWorkflowServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_workflow_service.js";
import * as suppliersSupplierServiceApi from "../../../../.cache/proto/acme/suppliers/v1/supplier_service.js";
import * as venuesVenueQueryServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_query_service.js";
import * as venuesVenueValidationServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_validation_service.js";
import * as webhooksWebhookDeliveryQueryServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_query_service.js";
import * as webhooksWebhookDeliveryValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_validation_service.js";
import * as webhooksWebhookEndpointApprovalServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_approval_service.js";
import * as webhooksWebhookEndpointQueryServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_query_service.js";
import * as webhooksWebhookEndpointValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_validation_service.js";
import * as webhooksWebhookEndpointWorkflowServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_workflow_service.js";
import * as webhooksWebhookSecretValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_secret_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
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
  workflow,
} from "../../../platform/rpc.js";
import { upload } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toWebhookEndpointRecord } from "../data/records.js";
import { WebhooksRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate webhook endpoint operations and persist audit data.
 */
@injectable()
export class WebhookEndpointWorkflowWorkflow {
  constructor(
    @inject(WebhooksRepository) private readonly repository: WebhooksRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ModerationApprovalService") private readonly communityModerationApprovalClient: communityModerationApprovalServiceApi.ModerationApprovalServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureReportingService") private readonly experimentsExposureReportingClient: experimentsExposureReportingServiceApi.ExposureReportingServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobWorkflowService") private readonly localizationTranslationJobWorkflowClient: localizationTranslationJobWorkflowServiceApi.TranslationJobWorkflowServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetService") private readonly mediaMediaAssetClient: mediaMediaAssetServiceApi.MediaAssetServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesQueryService") private readonly metricsMetricSeriesQueryClient: metricsMetricSeriesQueryServiceApi.MetricSeriesQueryServiceClient,
    @inject("grpc:acme.personalization.v1.AffinitySyncService") private readonly personalizationAffinitySyncClient: personalizationAffinitySyncServiceApi.AffinitySyncServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationWorkflowService") private readonly personalizationRecommendationWorkflowClient: personalizationRecommendationWorkflowServiceApi.RecommendationWorkflowServiceClient,
    @inject("grpc:acme.suppliers.v1.SupplierService") private readonly suppliersSupplierClient: suppliersSupplierServiceApi.SupplierServiceClient,
    @inject("grpc:acme.venues.v1.VenueQueryService") private readonly venuesVenueQueryClient: venuesVenueQueryServiceApi.VenueQueryServiceClient,
    @inject("grpc:acme.venues.v1.VenueValidationService") private readonly venuesVenueValidationClient: venuesVenueValidationServiceApi.VenueValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryQueryService") private readonly webhooksWebhookDeliveryQueryClient: webhooksWebhookDeliveryQueryServiceApi.WebhookDeliveryQueryServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryValidationService") private readonly webhooksWebhookDeliveryValidationClient: webhooksWebhookDeliveryValidationServiceApi.WebhookDeliveryValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointApprovalService") private readonly webhooksWebhookEndpointApprovalClient: webhooksWebhookEndpointApprovalServiceApi.WebhookEndpointApprovalServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointQueryService") private readonly webhooksWebhookEndpointQueryClient: webhooksWebhookEndpointQueryServiceApi.WebhookEndpointQueryServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointValidationService") private readonly webhooksWebhookEndpointValidationClient: webhooksWebhookEndpointValidationServiceApi.WebhookEndpointValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretValidationService") private readonly webhooksWebhookSecretValidationClient: webhooksWebhookSecretValidationServiceApi.WebhookSecretValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a webhook endpoint.
   */
  async advanceWebhookEndpointWorkflow(req: webhooksWebhookEndpointWorkflowServiceApi.AdvanceWebhookEndpointWorkflowRequest): Promise<webhooksWebhookEndpointWorkflowServiceApi.AdvanceWebhookEndpointWorkflowResponse> {
    validateContext(req.context);
    if (req.webhookEndpoint) {
      await this.repository.save(toWebhookEndpointRecord(req.context.tenantId, req.webhookEndpoint));
    }
    await this.repository.record(req.context.tenantId, "AdvanceWebhookEndpointWorkflow", req);
    this.logger.info("advance_webhook_endpoint_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinitySyncServiceApi.ReconcileAffinitiesRequest.fromPartial({
      affinity: {
        measurements: [{ unit: (req?.webhookEndpoint?.dimensions?.unit ?? "") }],
        subject: { displayName: (req?.webhookEndpoint?.owner?.displayName ?? "") },
      },
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<personalizationAffinitySyncServiceApi.ReconcileAffinitiesRequest, personalizationAffinitySyncServiceApi.ReconcileAffinitiesResponse> =
      (input, done) => this.personalizationAffinitySyncClient.reconcileAffinities(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("AdvanceWebhookEndpointWorkflow.ReconcileAffinities", () => call<personalizationAffinitySyncServiceApi.ReconcileAffinitiesRequest, personalizationAffinitySyncServiceApi.ReconcileAffinitiesResponse>(invoke1, request1));
    const request2 = communityModerationApprovalServiceApi.EscalateModerationRequest.fromPartial({
      context: req?.context,
      moderation: {
        assignee: { displayName: (req?.webhookEndpoint?.owner?.displayName ?? "") },
        audit: { etag: (req?.webhookEndpoint?.audit?.etag ?? "") },
        requester: { name: req?.details?.notify?.name },
      },
    });
    const invoke2: Unary<communityModerationApprovalServiceApi.EscalateModerationRequest, communityModerationApprovalServiceApi.EscalateModerationResponse> =
      (input, done) => this.communityModerationApprovalClient.escalateModeration(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = experimentsExposureReportingServiceApi.ShareExposureReportRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (req?.webhookEndpoint?.owner?.email ?? ""),
          phone: (req?.details?.notify?.phone ?? ""),
        },
      },
    });
    const reply3 = await this.workQueue.enqueue<experimentsExposureReportingServiceApi.ShareExposureReportRequest, experimentsExposureReportingServiceApi.ShareExposureReportResponse>(
      "acme.webhooks.v1.WebhookEndpointWorkflowService/AdvanceWebhookEndpointWorkflow:2", request3,
    );
    let selected4_1: string | undefined;
    switch (req?.webhookEndpoint?.locator?.$case) {
      case "address":
        selected4_1 = ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected4_1 = "";
    }
    const request4 = webhooksWebhookEndpointQueryServiceApi.FindWebhookEndpointsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.moderation?.sla?.dueAt,
        region: (selected4_1 ?? ""),
      },
    });
    const invoke4: Unary<webhooksWebhookEndpointQueryServiceApi.FindWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.FindWebhookEndpointsResponse> =
      (input, done) => this.webhooksWebhookEndpointQueryClient.findWebhookEndpoints(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<webhooksWebhookEndpointQueryServiceApi.FindWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.FindWebhookEndpointsResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.details?.notify?.preferredChannel ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointWorkflowServiceApi.AdvanceWebhookEndpointWorkflowResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      webhooksWebhookEndpointWorkflowServiceApi.AdvanceWebhookEndpointWorkflowResponse.fromPartial({
        webhookEndpoint: {
          owner: {
            displayName: ((reply2?.moderation?.origin?.$case === "customer" ? reply2?.moderation?.origin.customer : undefined)?.displayName ?? ""),
          },
        },
      }),
      webhooksWebhookEndpointWorkflowServiceApi.AdvanceWebhookEndpointWorkflowResponse.fromPartial({
        outcome: { message: (reply3?.result?.message ?? "") },
        result: { status: (reply3?.outcome?.status ?? "") },
      }),
      webhooksWebhookEndpointWorkflowServiceApi.AdvanceWebhookEndpointWorkflowResponse.fromPartial({ outcome: { status: (reply4?.result?.status ?? "") } }),
      webhooksWebhookEndpointWorkflowServiceApi.AdvanceWebhookEndpointWorkflowResponse.fromPartial({
        webhookEndpoint: {
          name: (req?.webhookEndpoint?.name ?? ""),
          webhookEndpointId: (req?.webhookEndpointId ?? ""),
        },
      }),
    );
  }

  /**
   * Cancels a webhook endpoint.
   */
  async cancelWebhookEndpointWorkflow(req: webhooksWebhookEndpointWorkflowServiceApi.CancelWebhookEndpointWorkflowRequest): Promise<webhooksWebhookEndpointWorkflowServiceApi.CancelWebhookEndpointWorkflowResponse> {
    validateContext(req.context);
    if (req.webhookEndpoint) {
      await this.repository.save(toWebhookEndpointRecord(req.context.tenantId, req.webhookEndpoint));
    }
    await this.repository.record(req.context.tenantId, "CancelWebhookEndpointWorkflow", req);
    this.logger.info("cancel_webhook_endpoint_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookDeliveryValidationServiceApi.ScoreWebhookDeliveryRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          countryCode: ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.countryCode ?? ""),
          locality: ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.locality ?? ""),
          recipient: ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.recipient ?? ""),
        },
      },
    });
    const invoke1: Unary<webhooksWebhookDeliveryValidationServiceApi.ScoreWebhookDeliveryRequest, webhooksWebhookDeliveryValidationServiceApi.ScoreWebhookDeliveryResponse> =
      (input, done) => this.webhooksWebhookDeliveryValidationClient.scoreWebhookDelivery(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<webhooksWebhookDeliveryValidationServiceApi.ScoreWebhookDeliveryResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = suppliersSupplierServiceApi.CreateSupplierRequest.fromPartial({
      context: req?.context,
      supplier: {
        contact: { email: (req?.webhookEndpoint?.owner?.email ?? "") },
        primaryAddress: {
          lines: ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.lines ?? []).map((value) => value),
          locality: ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.locality ?? ""),
        },
        relationshipManager: { displayName: (req?.webhookEndpoint?.owner?.displayName ?? "") },
      },
    });
    const invoke2: Unary<suppliersSupplierServiceApi.CreateSupplierRequest, suppliersSupplierServiceApi.CreateSupplierResponse> =
      (input, done) => this.suppliersSupplierClient.createSupplier(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = webhooksWebhookEndpointApprovalServiceApi.RejectWebhookEndpointRequest.fromPartial({
      context: req?.context,
      details: { approver: { email: (reply2?.supplier?.contact?.email ?? "") } },
    });
    const invoke3: Unary<webhooksWebhookEndpointApprovalServiceApi.RejectWebhookEndpointRequest, webhooksWebhookEndpointApprovalServiceApi.RejectWebhookEndpointResponse> =
      (input, done) => this.webhooksWebhookEndpointApprovalClient.rejectWebhookEndpoint(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke3 = promisify(invoke3);
    const reply3 = requireReply(await asyncInvoke3(request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointWorkflowServiceApi.CancelWebhookEndpointWorkflowResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        webhookEndpoint: { code: (reply1?.webhookDelivery?.subject?.code ?? "") },
      }),
      webhooksWebhookEndpointWorkflowServiceApi.CancelWebhookEndpointWorkflowResponse.fromPartial({
        result: { details: (reply2?.result?.details ?? {}) },
        webhookEndpoint: {
          owner: { email: (reply2?.supplier?.relationshipManager?.email ?? "") },
        },
      }),
      webhooksWebhookEndpointWorkflowServiceApi.CancelWebhookEndpointWorkflowResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
      webhooksWebhookEndpointWorkflowServiceApi.CancelWebhookEndpointWorkflowResponse.fromPartial({
        webhookEndpoint: {
          name: (req?.webhookEndpoint?.name ?? ""),
          webhookEndpointId: (req?.webhookEndpointId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a webhook endpoint.
   */
  async inspectWebhookEndpointWorkflow(req: webhooksWebhookEndpointWorkflowServiceApi.InspectWebhookEndpointWorkflowRequest): Promise<webhooksWebhookEndpointWorkflowServiceApi.InspectWebhookEndpointWorkflowResponse> {
    validateContext(req.context);
    if (!req.webhookEndpointId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "webhook_endpoint_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectWebhookEndpointWorkflow", req);
    this.logger.info("inspect_webhook_endpoint_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    return webhooksWebhookEndpointWorkflowServiceApi.InspectWebhookEndpointWorkflowResponse.fromPartial({
      webhookEndpoint: { webhookEndpointId: (req?.webhookEndpointId ?? "") },
    });
  }

  /**
   * Lists webhook endpoints a page at a time.
   */
  async listWebhookEndpointWorkflows(req: webhooksWebhookEndpointWorkflowServiceApi.ListWebhookEndpointWorkflowsRequest): Promise<webhooksWebhookEndpointWorkflowServiceApi.ListWebhookEndpointWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListWebhookEndpointWorkflows", req);
    this.logger.info("list_webhook_endpoint_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = venuesVenueQueryServiceApi.CountVenuesRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        query: (req?.filter?.query ?? ""),
      },
    });
    const method1 = "countVenues" as const;
    const invoke1: Unary<venuesVenueQueryServiceApi.CountVenuesRequest, venuesVenueQueryServiceApi.CountVenuesResponse> =
      (input, done) => this.venuesVenueQueryClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<venuesVenueQueryServiceApi.CountVenuesRequest, venuesVenueQueryServiceApi.CountVenuesResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webhooksWebhookEndpointWorkflowServiceApi.ListWebhookEndpointWorkflowsResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } });
  }

  /**
   * Pauses a webhook endpoint.
   */
  async pauseWebhookEndpointWorkflow(req: webhooksWebhookEndpointWorkflowServiceApi.PauseWebhookEndpointWorkflowRequest): Promise<webhooksWebhookEndpointWorkflowServiceApi.PauseWebhookEndpointWorkflowResponse> {
    validateContext(req.context);
    if (req.webhookEndpoint) {
      await this.repository.save(toWebhookEndpointRecord(req.context.tenantId, req.webhookEndpoint));
    }
    await this.repository.record(req.context.tenantId, "PauseWebhookEndpointWorkflow", req);
    this.logger.info("pause_webhook_endpoint_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = venuesVenueValidationServiceApi.ExplainVenueDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: req?.details?.notify?.name } },
    });
    const proxy1 = forwarding(this.venuesVenueValidationClient);
    const invoke1: Unary<venuesVenueValidationServiceApi.ExplainVenueDecisionRequest, venuesVenueValidationServiceApi.ExplainVenueDecisionResponse> =
      (input, done) => proxy1.explainVenueDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<venuesVenueValidationServiceApi.ExplainVenueDecisionRequest, venuesVenueValidationServiceApi.ExplainVenueDecisionResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointWorkflowServiceApi.PauseWebhookEndpointWorkflowResponse.fromPartial({
        webhookEndpoint: {
          audit: { createdAt: reply1?.venue?.audit?.createdAt },
          dimensions: { weight: (reply1?.venue?.dimensions?.weight ?? 0) },
        },
      }),
      webhooksWebhookEndpointWorkflowServiceApi.PauseWebhookEndpointWorkflowResponse.fromPartial({
        webhookEndpoint: {
          name: (req?.webhookEndpoint?.name ?? ""),
          webhookEndpointId: (req?.webhookEndpointId ?? ""),
        },
      }),
    );
  }

  /**
   * Resumes a webhook endpoint.
   */
  async resumeWebhookEndpointWorkflow(req: webhooksWebhookEndpointWorkflowServiceApi.ResumeWebhookEndpointWorkflowRequest): Promise<webhooksWebhookEndpointWorkflowServiceApi.ResumeWebhookEndpointWorkflowResponse> {
    validateContext(req.context);
    if (req.webhookEndpoint) {
      await this.repository.save(toWebhookEndpointRecord(req.context.tenantId, req.webhookEndpoint));
    }
    await this.repository.record(req.context.tenantId, "ResumeWebhookEndpointWorkflow", req);
    this.logger.info("resume_webhook_endpoint_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.webhookEndpoint?.locator?.$case) {
      case "address":
        selected1_1 = ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = webhooksWebhookEndpointQueryServiceApi.CountWebhookEndpointsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.webhookEndpoint?.audit?.updatedAt,
        region: (selected1_1 ?? ""),
      },
    });
    const invoke1: Unary<webhooksWebhookEndpointQueryServiceApi.CountWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.CountWebhookEndpointsResponse> =
      (input, done) => this.webhooksWebhookEndpointQueryClient.countWebhookEndpoints(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookEndpointQueryServiceApi.CountWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.CountWebhookEndpointsResponse>(invoke1, request1);
    const request2 = webhooksWebhookEndpointQueryServiceApi.FindWebhookEndpointsRequest.fromPartial({
      context: req?.context,
      filter: {
        region: ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.region ?? ""),
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<webhooksWebhookEndpointQueryServiceApi.FindWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.FindWebhookEndpointsResponse> =
      (input, done) => this.webhooksWebhookEndpointQueryClient.findWebhookEndpoints(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webhooksWebhookEndpointQueryServiceApi.FindWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.FindWebhookEndpointsResponse>(invoke2, spread2);
    const request3 = mediaMediaAssetServiceApi.BatchCreateMediaAssetsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.context?.actor?.userId ?? ""),
        submittedBy: req?.details?.notify,
      } },
    });
    const reply3 = await upload<mediaMediaAssetServiceApi.BatchCreateMediaAssetsRequest, mediaMediaAssetServiceApi.BatchCreateMediaAssetsResponse>(
      (done) => this.mediaMediaAssetClient.batchCreateMediaAssets(metadataFor(request3.context), { deadline: Date.now() + 15_000 }, done), [request3],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointWorkflowServiceApi.ResumeWebhookEndpointWorkflowResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      webhooksWebhookEndpointWorkflowServiceApi.ResumeWebhookEndpointWorkflowResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      webhooksWebhookEndpointWorkflowServiceApi.ResumeWebhookEndpointWorkflowResponse.fromPartial({
        webhookEndpoint: {
          name: (req?.webhookEndpoint?.name ?? ""),
          webhookEndpointId: (req?.webhookEndpointId ?? ""),
        },
      }),
    );
  }

  /**
   * Retrys a webhook endpoint.
   */
  async retryWebhookEndpointWorkflow(req: webhooksWebhookEndpointWorkflowServiceApi.RetryWebhookEndpointWorkflowRequest): Promise<webhooksWebhookEndpointWorkflowServiceApi.RetryWebhookEndpointWorkflowResponse> {
    validateContext(req.context);
    if (req.webhookEndpoint) {
      await this.repository.save(toWebhookEndpointRecord(req.context.tenantId, req.webhookEndpoint));
    }
    await this.repository.record(req.context.tenantId, "RetryWebhookEndpointWorkflow", req);
    this.logger.info("retry_webhook_endpoint_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = webhooksWebhookDeliveryValidationServiceApi.PreviewWebhookDeliveryRequest.fromPartial({
      context: input1?.context,
      details: {
        contact: {
          email: (input1?.webhookEndpoint?.owner?.email ?? ""),
          phone: (input1?.details?.notify?.phone ?? ""),
          preferredChannel: (input1?.details?.notify?.preferredChannel ?? ""),
        },
      },
      webhookDelivery: { subject: { code: (input1?.webhookEndpoint?.code ?? "") } },
    });
    const invoke1: Unary<webhooksWebhookDeliveryValidationServiceApi.PreviewWebhookDeliveryRequest, webhooksWebhookDeliveryValidationServiceApi.PreviewWebhookDeliveryResponse> =
      (input, done) => this.webhooksWebhookDeliveryValidationClient.previewWebhookDelivery(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookDeliveryValidationServiceApi.PreviewWebhookDeliveryRequest, webhooksWebhookDeliveryValidationServiceApi.PreviewWebhookDeliveryResponse>(invoke1, request1);
    let selected2_1: string | undefined;
    switch (req?.webhookEndpoint?.locator?.$case) {
      case "address":
        selected2_1 = ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest.fromPartial({
      context: req?.context,
      filter: { region: (selected2_1 ?? "") },
    });
    const invoke2: Unary<metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesResponse> =
      (input, done) => this.metricsMetricSeriesQueryClient.browseMetricSerieses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointWorkflowServiceApi.RetryWebhookEndpointWorkflowResponse.fromPartial({
        webhookEndpoint: { code: (reply1?.webhookDelivery?.subject?.code ?? "") },
      }),
      webhooksWebhookEndpointWorkflowServiceApi.RetryWebhookEndpointWorkflowResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      webhooksWebhookEndpointWorkflowServiceApi.RetryWebhookEndpointWorkflowResponse.fromPartial({
        webhookEndpoint: {
          status: req?.webhookEndpoint?.status,
          webhookEndpointId: (req?.webhookEndpointId ?? ""),
        },
      }),
    );
  }

  /**
   * Signals a webhook endpoint.
   */
  async signalWebhookEndpointWorkflow(req: webhooksWebhookEndpointWorkflowServiceApi.SignalWebhookEndpointWorkflowRequest): Promise<webhooksWebhookEndpointWorkflowServiceApi.SignalWebhookEndpointWorkflowResponse> {
    validateContext(req.context);
    if (req.webhookEndpoint) {
      await this.repository.save(toWebhookEndpointRecord(req.context.tenantId, req.webhookEndpoint));
    }
    await this.repository.record(req.context.tenantId, "SignalWebhookEndpointWorkflow", req);
    this.logger.info("signal_webhook_endpoint_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityRequest.fromPartial({
      context: req?.context,
      webhookSecret: {
        audit: { etag: (req?.webhookEndpoint?.audit?.etag ?? "") },
        contact: {
          email: (req?.details?.notify?.email ?? ""),
          name: req?.details?.notify?.name,
        },
        holder: { displayName: (req?.webhookEndpoint?.owner?.displayName ?? "") },
      },
    });
    const decoded1 = webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityRequest.fromJSON(
      JSON.parse(JSON.stringify(webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityRequest.toJSON(request1))),
    );
    const invoke1: Unary<webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityRequest, webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityResponse> =
      (input, done) => this.webhooksWebhookSecretValidationClient.checkWebhookSecretEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityRequest, webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityResponse>(invoke1, decoded1);
    const request2 = personalizationRecommendationWorkflowServiceApi.StartRecommendationWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (req?.details?.notify?.email ?? "") } },
      recommendation: {
        audit: { etag: (reply1?.webhookSecret?.audit?.etag ?? "") },
        billingAddress: {
          recipient: ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.recipient ?? ""),
        },
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.personalization.v1.StartRecommendationWorkflowRequest",
      value: Buffer.from(personalizationRecommendationWorkflowServiceApi.StartRecommendationWorkflowRequest.encode(request2).finish()),
    });
    const unpacked2 = personalizationRecommendationWorkflowServiceApi.StartRecommendationWorkflowRequest.decode(envelope2.value);
    const invoke2: Unary<personalizationRecommendationWorkflowServiceApi.StartRecommendationWorkflowRequest, personalizationRecommendationWorkflowServiceApi.StartRecommendationWorkflowResponse> =
      (input, done) => this.personalizationRecommendationWorkflowClient.startRecommendationWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationRecommendationWorkflowServiceApi.StartRecommendationWorkflowRequest, personalizationRecommendationWorkflowServiceApi.StartRecommendationWorkflowResponse>(invoke2, unpacked2);
    const request3 = localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowRequest.fromPartial({
      context: req?.context,
      translationJob: { audit: { updatedBy: (reply1?.webhookSecret?.audit?.updatedBy ?? "") } },
    });
    const client3 = this.clients.get<localizationTranslationJobWorkflowServiceApi.TranslationJobWorkflowServiceClient>("acme.localization.v1.TranslationJobWorkflowService");
    const invoke3: Unary<localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowRequest, localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowResponse> =
      (input, done) => client3.advanceTranslationJobWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowRequest, localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowResponse>(invoke3, request3);
    const request4 = venuesVenueQueryServiceApi.CountVenuesRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((reply1?.webhookSecret?.labels ?? {}))),
      },
    });
    const invoke4: Unary<venuesVenueQueryServiceApi.CountVenuesRequest, venuesVenueQueryServiceApi.CountVenuesResponse> =
      (input, done) => this.venuesVenueQueryClient.countVenues(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port4: RequestPort<venuesVenueQueryServiceApi.CountVenuesRequest, venuesVenueQueryServiceApi.CountVenuesResponse> = new GrpcAdapter(invoke4);
    const reply4 = await port4.execute(request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointWorkflowServiceApi.SignalWebhookEndpointWorkflowResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        webhookEndpoint: { code: (reply1?.webhookSecret?.holder?.code ?? "") },
      }),
      webhooksWebhookEndpointWorkflowServiceApi.SignalWebhookEndpointWorkflowResponse.fromPartial({
        outcome: {
          nextSteps: (reply2?.outcome?.nextSteps ?? []),
          status: (reply2?.outcome?.status ?? ""),
        },
      }),
      webhooksWebhookEndpointWorkflowServiceApi.SignalWebhookEndpointWorkflowResponse.fromPartial({ result: { status: (reply3?.outcome?.status ?? "") } }),
      webhooksWebhookEndpointWorkflowServiceApi.SignalWebhookEndpointWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply4?.result?.correlationId ?? ""),
          status: (reply4?.result?.status ?? ""),
        },
      }),
      webhooksWebhookEndpointWorkflowServiceApi.SignalWebhookEndpointWorkflowResponse.fromPartial({
        webhookEndpoint: {
          status: req?.webhookEndpoint?.status,
          webhookEndpointId: (req?.webhookEndpointId ?? ""),
        },
      }),
    );
  }

  /**
   * Starts a webhook endpoint.
   */
  async startWebhookEndpointWorkflow(req: webhooksWebhookEndpointWorkflowServiceApi.StartWebhookEndpointWorkflowRequest): Promise<webhooksWebhookEndpointWorkflowServiceApi.StartWebhookEndpointWorkflowResponse> {
    validateContext(req.context);
    if (req.webhookEndpoint) {
      await this.repository.save(toWebhookEndpointRecord(req.context.tenantId, req.webhookEndpoint));
    }
    await this.repository.record(req.context.tenantId, "StartWebhookEndpointWorkflow", req);
    this.logger.info("start_webhook_endpoint_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.webhookEndpoint?.specs ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesResponse> =
      (input, done) => this.webhooksWebhookDeliveryQueryClient.summarizeWebhookDeliveries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesResponse>(invoke1, request1));
    const request2 = webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointRequest.fromPartial({
      context: req?.context,
      webhookEndpoint: {
        dimensions: { weight: (req?.webhookEndpoint?.dimensions?.weight ?? 0) },
      },
    });
    const invoke2: Unary<webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointResponse> =
      (input, done) => this.webhooksWebhookEndpointValidationClient.validateWebhookEndpoint(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("StartWebhookEndpointWorkflow.ValidateWebhookEndpoint", () => call<webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.details?.notify?.preferredChannel ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointWorkflowServiceApi.StartWebhookEndpointWorkflowResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      webhooksWebhookEndpointWorkflowServiceApi.StartWebhookEndpointWorkflowResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        webhookEndpoint: { code: (reply2?.webhookEndpoint?.code ?? "") },
      }),
      webhooksWebhookEndpointWorkflowServiceApi.StartWebhookEndpointWorkflowResponse.fromPartial({
        webhookEndpoint: {
          name: (req?.webhookEndpoint?.name ?? ""),
          webhookEndpointId: (req?.webhookEndpointId ?? ""),
        },
      }),
    );
  }
}
