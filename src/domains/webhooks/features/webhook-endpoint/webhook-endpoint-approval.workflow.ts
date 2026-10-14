/**
 * Routes webhook endpoints through approval, with escalation and delegation. Remote work stays behind typed client
 * ports.
 */

import * as experimentsExposureReportingServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_reporting_service.js";
import * as metricsMetricSeriesQueryServiceApi from "../../../../../.cache/proto/acme/metrics/v1/metric_series_query_service.js";
import * as notificationsNotificationQueryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_query_service.js";
import * as personalizationProfileReportingServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_reporting_service.js";
import * as webhooksWebhookDeliveryValidationServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_validation_service.js";
import * as webhooksWebhookEndpointApprovalServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_approval_service.js";
import * as webhooksWebhookEndpointQueryServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_query_service.js";
import * as webhooksWebhookEndpointValidationServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_validation_service.js";
import * as webhooksWebhookSecretCalculationServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_secret_calculation_service.js";
import * as webhooksWebhookSecretValidationServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_secret_validation_service.js";
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
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toWebhookEndpointRecord } from "../../data/records.js";
import { WebhooksRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate webhook endpoint operations and persist audit data.
 */
@injectable()
export class WebhookEndpointApprovalWorkflow {
  constructor(
    @inject(WebhooksRepository) private readonly repository: WebhooksRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.experiments.v1.ExposureReportingService") private readonly experimentsExposureReportingClient: experimentsExposureReportingServiceApi.ExposureReportingServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesQueryService") private readonly metricsMetricSeriesQueryClient: metricsMetricSeriesQueryServiceApi.MetricSeriesQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationQueryService") private readonly notificationsNotificationQueryClient: notificationsNotificationQueryServiceApi.NotificationQueryServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileReportingService") private readonly personalizationProfileReportingClient: personalizationProfileReportingServiceApi.ProfileReportingServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryValidationService") private readonly webhooksWebhookDeliveryValidationClient: webhooksWebhookDeliveryValidationServiceApi.WebhookDeliveryValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointQueryService") private readonly webhooksWebhookEndpointQueryClient: webhooksWebhookEndpointQueryServiceApi.WebhookEndpointQueryServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointValidationService") private readonly webhooksWebhookEndpointValidationClient: webhooksWebhookEndpointValidationServiceApi.WebhookEndpointValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretCalculationService") private readonly webhooksWebhookSecretCalculationClient: webhooksWebhookSecretCalculationServiceApi.WebhookSecretCalculationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretValidationService") private readonly webhooksWebhookSecretValidationClient: webhooksWebhookSecretValidationServiceApi.WebhookSecretValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a webhook endpoint.
   */
  async approveWebhookEndpoint(req: webhooksWebhookEndpointApprovalServiceApi.ApproveWebhookEndpointRequest): Promise<webhooksWebhookEndpointApprovalServiceApi.ApproveWebhookEndpointResponse> {
    validateContext(req.context);
    if (req.webhookEndpoint) {
      await this.repository.save(toWebhookEndpointRecord(req.context.tenantId, req.webhookEndpoint));
    }
    await this.repository.record(req.context.tenantId, "ApproveWebhookEndpoint", req);
    this.logger.info("approve_webhook_endpoint", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityRequest.fromPartial({
      context: req?.context,
      webhookSecret: {
        audit: {
          createdBy: (req?.webhookEndpoint?.audit?.createdBy ?? ""),
          etag: (req?.webhookEndpoint?.audit?.etag ?? ""),
          updatedBy: (req?.webhookEndpoint?.audit?.updatedBy ?? ""),
        },
        contact: { email: (req?.webhookEndpoint?.owner?.email ?? "") },
      },
    });
    const method1 = "checkWebhookSecretEligibility" as const;
    const invoke1: Unary<webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityRequest, webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityResponse> =
      (input, done) => this.webhooksWebhookSecretValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityRequest, webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityResponse>(invoke1, request1);
    const request2 = webhooksWebhookSecretValidationServiceApi.ScoreWebhookSecretRequest.fromPartial({
      context: req?.context,
      webhookSecret: {
        audit: { etag: (reply1?.webhookSecret?.audit?.etag ?? "") },
        funding: { $case: "bank", bank: {
          iban: ((reply1?.webhookSecret?.funding?.$case === "bank" ? reply1?.webhookSecret?.funding.bank : undefined)?.iban ?? ""),
        } },
        holder: { code: (reply1?.webhookSecret?.holder?.code ?? "") },
      },
    });
    const proxy2 = forwarding(this.webhooksWebhookSecretValidationClient);
    const invoke2: Unary<webhooksWebhookSecretValidationServiceApi.ScoreWebhookSecretRequest, webhooksWebhookSecretValidationServiceApi.ScoreWebhookSecretResponse> =
      (input, done) => proxy2.scoreWebhookSecret(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webhooksWebhookSecretValidationServiceApi.ScoreWebhookSecretRequest, webhooksWebhookSecretValidationServiceApi.ScoreWebhookSecretResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointApprovalServiceApi.ApproveWebhookEndpointResponse.fromPartial({
        result: { status: (reply1?.outcome?.status ?? "") },
        webhookEndpoint: { owner: { email: (reply1?.webhookSecret?.contact?.email ?? "") } },
      }),
      webhooksWebhookEndpointApprovalServiceApi.ApproveWebhookEndpointResponse.fromPartial({
        webhookEndpoint: {
          audit: { updatedBy: (reply2?.webhookSecret?.audit?.updatedBy ?? "") },
          owner: { email: (reply2?.webhookSecret?.contact?.email ?? "") },
        },
      }),
      webhooksWebhookEndpointApprovalServiceApi.ApproveWebhookEndpointResponse.fromPartial({
        webhookEndpoint: {
          status: req?.webhookEndpoint?.status,
          webhookEndpointId: (req?.webhookEndpointId ?? ""),
        },
      }),
    );
  }

  /**
   * Comments a webhook endpoint.
   */
  async commentWebhookEndpointApproval(req: webhooksWebhookEndpointApprovalServiceApi.CommentWebhookEndpointApprovalRequest): Promise<webhooksWebhookEndpointApprovalServiceApi.CommentWebhookEndpointApprovalResponse> {
    validateContext(req.context);
    if (req.webhookEndpoint) {
      await this.repository.save(toWebhookEndpointRecord(req.context.tenantId, req.webhookEndpoint));
    }
    await this.repository.record(req.context.tenantId, "CommentWebhookEndpointApproval", req);
    this.logger.info("comment_webhook_endpoint_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.webhookEndpoint?.locator?.$case) {
      case "address":
        selected1_1 = ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = experimentsExposureReportingServiceApi.ListExposureReportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.webhookEndpoint?.audit?.updatedAt,
        region: (selected1_1 ?? ""),
      },
    });
    const invoke1: Unary<experimentsExposureReportingServiceApi.ListExposureReportsRequest, experimentsExposureReportingServiceApi.ListExposureReportsResponse> =
      (input, done) => this.experimentsExposureReportingClient.listExposureReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExposureReportingServiceApi.ListExposureReportsRequest, experimentsExposureReportingServiceApi.ListExposureReportsResponse>(invoke1, request1);
    const request2 = webhooksWebhookDeliveryValidationServiceApi.LintWebhookDeliveriesRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.webhookEndpoint?.owner?.email ?? "") } },
      webhookDelivery: {
        subject: { displayName: (req?.webhookEndpoint?.owner?.displayName ?? "") },
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<webhooksWebhookDeliveryValidationServiceApi.LintWebhookDeliveriesRequest, webhooksWebhookDeliveryValidationServiceApi.LintWebhookDeliveriesResponse> =
      (input, done) => this.webhooksWebhookDeliveryValidationClient.lintWebhookDeliveries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webhooksWebhookDeliveryValidationServiceApi.LintWebhookDeliveriesRequest, webhooksWebhookDeliveryValidationServiceApi.LintWebhookDeliveriesResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointApprovalServiceApi.CommentWebhookEndpointApprovalResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      webhooksWebhookEndpointApprovalServiceApi.CommentWebhookEndpointApprovalResponse.fromPartial({
        outcome: { message: (reply2?.outcome?.message ?? "") },
        result: { message: (reply2?.outcome?.message ?? "") },
      }),
      webhooksWebhookEndpointApprovalServiceApi.CommentWebhookEndpointApprovalResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        webhookEndpoint: { webhookEndpointId: (req?.webhookEndpointId ?? "") },
      }),
    );
  }

  /**
   * Delegates a webhook endpoint.
   */
  async delegateWebhookEndpointApproval(req: webhooksWebhookEndpointApprovalServiceApi.DelegateWebhookEndpointApprovalRequest): Promise<webhooksWebhookEndpointApprovalServiceApi.DelegateWebhookEndpointApprovalResponse> {
    validateContext(req.context);
    if (req.webhookEndpoint) {
      await this.repository.save(toWebhookEndpointRecord(req.context.tenantId, req.webhookEndpoint));
    }
    await this.repository.record(req.context.tenantId, "DelegateWebhookEndpointApproval", req);
    this.logger.info("delegate_webhook_endpoint_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretRequest.fromPartial({
      context: input1?.context,
      webhookSecret: {
        audit: {
          createdBy: (input1?.webhookEndpoint?.audit?.createdBy ?? ""),
          updatedBy: (input1?.webhookEndpoint?.audit?.updatedBy ?? ""),
        },
      },
    });
    const invoke1: Unary<webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretResponse> =
      (input, done) => this.webhooksWebhookSecretCalculationClient.simulateWebhookSecret(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointApprovalServiceApi.DelegateWebhookEndpointApprovalResponse.fromPartial({
        webhookEndpoint: {
          webhookEndpointId: (reply1?.webhookSecret?.holder?.webhookEndpointId ?? ""),
        },
      }),
      webhooksWebhookEndpointApprovalServiceApi.DelegateWebhookEndpointApprovalResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        webhookEndpoint: { capacity: (req?.webhookEndpoint?.capacity ?? 0) },
      }),
    );
  }

  /**
   * Returns a webhook endpoint.
   */
  async getWebhookEndpointApprovalStatus(req: webhooksWebhookEndpointApprovalServiceApi.GetWebhookEndpointApprovalStatusRequest): Promise<webhooksWebhookEndpointApprovalServiceApi.GetWebhookEndpointApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.webhookEndpointId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "webhook_endpoint_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetWebhookEndpointApprovalStatus", req);
    this.logger.info("get_webhook_endpoint_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretRequest.fromPartial({
      context: req?.context,
      webhookSecret: {
        audit: { updatedAt: req?.context?.deadline },
        contact: { email: (req?.context?.actor?.email ?? "") },
        holder: { webhookEndpointId: (req?.webhookEndpointId ?? "") },
      },
    });
    const cloned1: webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretResponse> =
      (input, done) => this.webhooksWebhookSecretCalculationClient.calculateWebhookSecret(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretResponse>(invoke1, cloned1);
    const request2 = webhooksWebhookEndpointQueryServiceApi.ResolveWebhookEndpointsRequest.fromPartial({ context: req?.context });
    const decoded2 = webhooksWebhookEndpointQueryServiceApi.ResolveWebhookEndpointsRequest.fromJSON(
      JSON.parse(JSON.stringify(webhooksWebhookEndpointQueryServiceApi.ResolveWebhookEndpointsRequest.toJSON(request2))),
    );
    const invoke2: Unary<webhooksWebhookEndpointQueryServiceApi.ResolveWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.ResolveWebhookEndpointsResponse> =
      (input, done) => this.webhooksWebhookEndpointQueryClient.resolveWebhookEndpoints(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webhooksWebhookEndpointQueryServiceApi.ResolveWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.ResolveWebhookEndpointsResponse>(invoke2, decoded2);
    return mergeResponses(
      webhooksWebhookEndpointApprovalServiceApi.GetWebhookEndpointApprovalStatusResponse.fromPartial({
        webhookEndpoint: {
          audit: { updatedBy: (reply1?.webhookSecret?.audit?.updatedBy ?? "") },
          owner: { email: (reply1?.webhookSecret?.contact?.email ?? "") },
        },
      }),
      webhooksWebhookEndpointApprovalServiceApi.GetWebhookEndpointApprovalStatusResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      webhooksWebhookEndpointApprovalServiceApi.GetWebhookEndpointApprovalStatusResponse.fromPartial({
        webhookEndpoint: { webhookEndpointId: (req?.webhookEndpointId ?? "") },
      }),
    );
  }

  /**
   * Lists webhook endpoints a page at a time.
   */
  async listPendingWebhookEndpoints(req: webhooksWebhookEndpointApprovalServiceApi.ListPendingWebhookEndpointsRequest): Promise<webhooksWebhookEndpointApprovalServiceApi.ListPendingWebhookEndpointsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingWebhookEndpoints", req);
    this.logger.info("list_pending_webhook_endpoints", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webhooksWebhookEndpointApprovalServiceApi.ListPendingWebhookEndpointsResponse.fromPartial({});
  }

  /**
   * Recalls a webhook endpoint.
   */
  async recallWebhookEndpoint(req: webhooksWebhookEndpointApprovalServiceApi.RecallWebhookEndpointRequest): Promise<webhooksWebhookEndpointApprovalServiceApi.RecallWebhookEndpointResponse> {
    validateContext(req.context);
    if (req.webhookEndpoint) {
      await this.repository.save(toWebhookEndpointRecord(req.context.tenantId, req.webhookEndpoint));
    }
    await this.repository.record(req.context.tenantId, "RecallWebhookEndpoint", req);
    this.logger.info("recall_webhook_endpoint", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookEndpointValidationServiceApi.ExplainWebhookEndpointDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.approver?.email ?? "") } },
      webhookEndpoint: {
        locator: { $case: "address", address: {
          locality: ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.locality ?? ""),
          postalCode: ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.postalCode ?? ""),
        } },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.webhooks.v1.ExplainWebhookEndpointDecisionRequest",
      value: Buffer.from(webhooksWebhookEndpointValidationServiceApi.ExplainWebhookEndpointDecisionRequest.encode(request1).finish()),
    });
    const unpacked1 = webhooksWebhookEndpointValidationServiceApi.ExplainWebhookEndpointDecisionRequest.decode(envelope1.value);
    const invoke1: Unary<webhooksWebhookEndpointValidationServiceApi.ExplainWebhookEndpointDecisionRequest, webhooksWebhookEndpointValidationServiceApi.ExplainWebhookEndpointDecisionResponse> =
      (input, done) => this.webhooksWebhookEndpointValidationClient.explainWebhookEndpointDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookEndpointValidationServiceApi.ExplainWebhookEndpointDecisionRequest, webhooksWebhookEndpointValidationServiceApi.ExplainWebhookEndpointDecisionResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointApprovalServiceApi.RecallWebhookEndpointResponse.fromPartial({
        outcome: { status: (reply1?.outcome?.status ?? "") },
        webhookEndpoint: {
          audit: { createdBy: (reply1?.webhookEndpoint?.audit?.createdBy ?? "") },
        },
      }),
      webhooksWebhookEndpointApprovalServiceApi.RecallWebhookEndpointResponse.fromPartial({
        webhookEndpoint: {
          owner: req?.webhookEndpoint?.owner,
          webhookEndpointId: (req?.webhookEndpointId ?? ""),
        },
      }),
    );
  }

  /**
   * Rejects a webhook endpoint.
   */
  async rejectWebhookEndpoint(req: webhooksWebhookEndpointApprovalServiceApi.RejectWebhookEndpointRequest): Promise<webhooksWebhookEndpointApprovalServiceApi.RejectWebhookEndpointResponse> {
    validateContext(req.context);
    if (req.webhookEndpoint) {
      await this.repository.save(toWebhookEndpointRecord(req.context.tenantId, req.webhookEndpoint));
    }
    await this.repository.record(req.context.tenantId, "RejectWebhookEndpoint", req);
    this.logger.info("reject_webhook_endpoint", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookSecretValidationServiceApi.LintWebhookSecretsRequest.fromPartial({
      context: req?.context,
      webhookSecret: { audit: { createdAt: req?.webhookEndpoint?.audit?.createdAt } },
    });
    const client1 = this.clients.get<webhooksWebhookSecretValidationServiceApi.WebhookSecretValidationServiceClient>("acme.webhooks.v1.WebhookSecretValidationService");
    const invoke1: Unary<webhooksWebhookSecretValidationServiceApi.LintWebhookSecretsRequest, webhooksWebhookSecretValidationServiceApi.LintWebhookSecretsResponse> =
      (input, done) => client1.lintWebhookSecrets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookSecretValidationServiceApi.LintWebhookSecretsRequest, webhooksWebhookSecretValidationServiceApi.LintWebhookSecretsResponse>(invoke1, request1);
    const request2 = metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((reply1?.webhookSecret?.labels ?? {}))),
        region: ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke2: Unary<metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesResponse> =
      (input, done) => this.metricsMetricSeriesQueryClient.browseMetricSerieses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = personalizationProfileReportingServiceApi.ListProfileReportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.webhookEndpoint?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply1?.webhookSecret?.labels ?? {}))),
        region: ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke3: Unary<personalizationProfileReportingServiceApi.ListProfileReportsRequest, personalizationProfileReportingServiceApi.ListProfileReportsResponse> =
      (input, done) => this.personalizationProfileReportingClient.listProfileReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<personalizationProfileReportingServiceApi.ListProfileReportsRequest, personalizationProfileReportingServiceApi.ListProfileReportsResponse>(invoke3, request3));
    const request4 = webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (reply1?.webhookSecret?.contact?.phone ?? "") } },
      webhookDelivery: {
        subject: {
          code: (reply1?.webhookSecret?.holder?.code ?? ""),
          webhookEndpointId: (req?.webhookEndpoint?.webhookEndpointId ?? ""),
        },
      },
    });
    const invoke4: Unary<webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityRequest, webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityResponse> =
      (input, done) => this.webhooksWebhookDeliveryValidationClient.checkWebhookDeliveryEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await workflow("RejectWebhookEndpoint.CheckWebhookDeliveryEligibility", () => call<webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityRequest, webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointApprovalServiceApi.RejectWebhookEndpointResponse.fromPartial({ outcome: { status: (reply1?.outcome?.status ?? "") } }),
      webhooksWebhookEndpointApprovalServiceApi.RejectWebhookEndpointResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      webhooksWebhookEndpointApprovalServiceApi.RejectWebhookEndpointResponse.fromPartial({
        outcome: { status: (reply3?.result?.status ?? "") },
        result: { status: (reply3?.result?.status ?? "") },
      }),
      webhooksWebhookEndpointApprovalServiceApi.RejectWebhookEndpointResponse.fromPartial({ result: { referenceIds: (reply4?.result?.referenceIds ?? []) } }),
      webhooksWebhookEndpointApprovalServiceApi.RejectWebhookEndpointResponse.fromPartial({
        webhookEndpoint: {
          name: (req?.webhookEndpoint?.name ?? ""),
          webhookEndpointId: (req?.webhookEndpointId ?? ""),
        },
      }),
    );
  }

  /**
   * Submits a webhook endpoint.
   */
  async submitWebhookEndpoint(req: webhooksWebhookEndpointApprovalServiceApi.SubmitWebhookEndpointRequest): Promise<webhooksWebhookEndpointApprovalServiceApi.SubmitWebhookEndpointResponse> {
    validateContext(req.context);
    if (req.webhookEndpoint) {
      await this.repository.save(toWebhookEndpointRecord(req.context.tenantId, req.webhookEndpoint));
    }
    await this.repository.record(req.context.tenantId, "SubmitWebhookEndpoint", req);
    this.logger.info("submit_webhook_endpoint", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationQueryServiceApi.CountNotificationsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.webhookEndpoint?.audit?.updatedAt,
        ownerId: (req?.webhookEndpoint?.components?.["primary"]?.componentId ?? ""),
        region: ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke1: Unary<notificationsNotificationQueryServiceApi.CountNotificationsRequest, notificationsNotificationQueryServiceApi.CountNotificationsResponse> =
      (input, done) => this.notificationsNotificationQueryClient.countNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = metricsMetricSeriesQueryServiceApi.SuggestMetricSeriesesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.webhookEndpoint?.audit?.createdAt,
        region: ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.region ?? ""),
      },
    });
    const reply2 = await this.workQueue.enqueue<metricsMetricSeriesQueryServiceApi.SuggestMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.SuggestMetricSeriesesResponse>(
      "acme.webhooks.v1.WebhookEndpointApprovalService/SubmitWebhookEndpoint:1", request2,
    );
    const request3 = webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityRequest.fromPartial({
      context: req?.context,
      webhookSecret: { audit: { createdAt: req?.webhookEndpoint?.audit?.createdAt } },
    });
    const invoke3: Unary<webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityRequest, webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityResponse> =
      (input, done) => this.webhooksWebhookSecretValidationClient.checkWebhookSecretEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await inRequest(req.context!, () => call<webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityRequest, webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityResponse>(invoke3, request3));
    const request4 = notificationsNotificationQueryServiceApi.SummarizeNotificationsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((reply3?.webhookSecret?.labels ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const invoke4: Unary<notificationsNotificationQueryServiceApi.SummarizeNotificationsRequest, notificationsNotificationQueryServiceApi.SummarizeNotificationsResponse> =
      (input, done) => this.notificationsNotificationQueryClient.summarizeNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await new Promise<notificationsNotificationQueryServiceApi.SummarizeNotificationsResponse>((resolve, reject) => {
      invoke4(request4, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.details?.approver?.email ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointApprovalServiceApi.SubmitWebhookEndpointResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      webhooksWebhookEndpointApprovalServiceApi.SubmitWebhookEndpointResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      webhooksWebhookEndpointApprovalServiceApi.SubmitWebhookEndpointResponse.fromPartial({
        result: {
          details: (reply3?.result?.details ?? {}),
          message: (reply3?.outcome?.message ?? ""),
        },
      }),
      webhooksWebhookEndpointApprovalServiceApi.SubmitWebhookEndpointResponse.fromPartial({
        result: {
          message: (reply4?.result?.message ?? ""),
          referenceIds: (reply4?.result?.referenceIds ?? []),
        },
      }),
      webhooksWebhookEndpointApprovalServiceApi.SubmitWebhookEndpointResponse.fromPartial({
        webhookEndpoint: {
          specs: (req?.webhookEndpoint?.specs ?? {}),
          webhookEndpointId: (req?.webhookEndpointId ?? ""),
        },
      }),
    );
  }
}
