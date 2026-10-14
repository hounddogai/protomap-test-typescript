/**
 * Answers read-only questions about webhook deliveries, for screens and reports. Remote work stays behind typed
 * client ports.
 */

import * as documentsDocumentValidationServiceApi from "../../../../../.cache/proto/acme/documents/v1/document_validation_service.js";
import * as experimentsExperimentCalculationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_calculation_service.js";
import * as experimentsExperimentValidationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import * as ledgerLedgerAccountServiceApi from "../../../../../.cache/proto/acme/ledger/v1/ledger_account_service.js";
import * as notificationsNotificationExportServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_export_service.js";
import * as notificationsNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_service.js";
import * as notificationsNotificationTemplateNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_notification_service.js";
import * as webhooksWebhookDeliveryQueryServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_query_service.js";
import * as webhooksWebhookDeliveryValidationServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_validation_service.js";
import * as webhooksWebhookEndpointQueryServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_query_service.js";
import * as webhooksWebhookSecretCalculationServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_secret_calculation_service.js";
import * as webhooksWebhookSecretValidationServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_secret_validation_service.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, forwarding, metadataFor, promised, type Unary } from "../../../../platform/rpc.js";
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { WebhooksRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate webhook delivery operations and persist audit data.
 */
@injectable()
export class WebhookDeliveryQueryWorkflow {
  constructor(
    @inject(WebhooksRepository) private readonly repository: WebhooksRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.documents.v1.DocumentValidationService") private readonly documentsDocumentValidationClient: documentsDocumentValidationServiceApi.DocumentValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentCalculationService") private readonly experimentsExperimentCalculationClient: experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentValidationService") private readonly experimentsExperimentValidationClient: experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountService") private readonly ledgerLedgerAccountClient: ledgerLedgerAccountServiceApi.LedgerAccountServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationExportService") private readonly notificationsNotificationExportClient: notificationsNotificationExportServiceApi.NotificationExportServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationService") private readonly notificationsNotificationClient: notificationsNotificationServiceApi.NotificationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateNotificationService") private readonly notificationsNotificationTemplateNotificationClient: notificationsNotificationTemplateNotificationServiceApi.NotificationTemplateNotificationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryValidationService") private readonly webhooksWebhookDeliveryValidationClient: webhooksWebhookDeliveryValidationServiceApi.WebhookDeliveryValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointQueryService") private readonly webhooksWebhookEndpointQueryClient: webhooksWebhookEndpointQueryServiceApi.WebhookEndpointQueryServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretCalculationService") private readonly webhooksWebhookSecretCalculationClient: webhooksWebhookSecretCalculationServiceApi.WebhookSecretCalculationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretValidationService") private readonly webhooksWebhookSecretValidationClient: webhooksWebhookSecretValidationServiceApi.WebhookSecretValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists webhook deliveries a page at a time.
   */
  async browseWebhookDeliveries(req: webhooksWebhookDeliveryQueryServiceApi.BrowseWebhookDeliveriesRequest): Promise<webhooksWebhookDeliveryQueryServiceApi.BrowseWebhookDeliveriesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseWebhookDeliveries", req);
    this.logger.info("browse_webhook_deliveries", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = documentsDocumentValidationServiceApi.LintDocumentsRequest.fromPartial({
      context: req?.context,
      document: { billingAddress: { region: (req?.filter?.region ?? "") } },
    });
    const invoke1: Unary<documentsDocumentValidationServiceApi.LintDocumentsRequest, documentsDocumentValidationServiceApi.LintDocumentsResponse> =
      (input, done) => this.documentsDocumentValidationClient.lintDocuments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<documentsDocumentValidationServiceApi.LintDocumentsRequest, documentsDocumentValidationServiceApi.LintDocumentsResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webhooksWebhookDeliveryQueryServiceApi.BrowseWebhookDeliveriesResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } });
  }

  /**
   * Counts webhook deliveries by status.
   */
  async countWebhookDeliveries(req: webhooksWebhookDeliveryQueryServiceApi.CountWebhookDeliveriesRequest): Promise<webhooksWebhookDeliveryQueryServiceApi.CountWebhookDeliveriesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountWebhookDeliveries", req);
    this.logger.info("count_webhook_deliveries", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentValidationServiceApi.ExplainExperimentDecisionRequest.fromPartial({
      context: req?.context,
      experiment: {
        location: { region: (req?.filter?.region ?? "") },
        organizer: { userId: (req?.context?.actor?.userId ?? "") },
      },
    });
    const invoke1: Unary<experimentsExperimentValidationServiceApi.ExplainExperimentDecisionRequest, experimentsExperimentValidationServiceApi.ExplainExperimentDecisionResponse> =
      (input, done) => this.experimentsExperimentValidationClient.explainExperimentDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<experimentsExperimentValidationServiceApi.ExplainExperimentDecisionResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationRequest.fromPartial({
      context: req?.context,
      experiment: { audit: { updatedBy: (reply1?.experiment?.audit?.updatedBy ?? "") } },
    });
    const invoke2: Unary<experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationRequest, experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationResponse> =
      (input, done) => this.experimentsExperimentCalculationClient.explainExperimentCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      webhooksWebhookDeliveryQueryServiceApi.CountWebhookDeliveriesResponse.fromPartial({
        result: {
          message: (reply1?.outcome?.message ?? ""),
          status: (reply1?.outcome?.status ?? ""),
        },
      }),
      webhooksWebhookDeliveryQueryServiceApi.CountWebhookDeliveriesResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
    );
  }

  /**
   * Lists webhook deliveries a page at a time.
   */
  async findWebhookDeliveries(req: webhooksWebhookDeliveryQueryServiceApi.FindWebhookDeliveriesRequest): Promise<webhooksWebhookDeliveryQueryServiceApi.FindWebhookDeliveriesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindWebhookDeliveries", req);
    this.logger.info("find_webhook_deliveries", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityRequest.fromPartial({
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
      webhookSecret: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
    });
    const invoke1: Unary<webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityRequest, webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityResponse> =
      (input, done) => this.webhooksWebhookSecretValidationClient.checkWebhookSecretEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webhooksWebhookDeliveryQueryServiceApi.FindWebhookDeliveriesResponse.fromPartial({
      webhookDeliveries: [{ correlationId: (reply1?.result?.correlationId ?? "") }],
    });
  }

  /**
   * Returns a webhook delivery.
   */
  async lookupWebhookDelivery(req: webhooksWebhookDeliveryQueryServiceApi.LookupWebhookDeliveryRequest): Promise<webhooksWebhookDeliveryQueryServiceApi.LookupWebhookDeliveryResponse> {
    validateContext(req.context);
    if (!req.webhookDeliveryId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "webhook_delivery_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupWebhookDelivery", req);
    this.logger.info("lookup_webhook_delivery", { tenant: req.context.tenantId, trace: req.context.traceId });
    return webhooksWebhookDeliveryQueryServiceApi.LookupWebhookDeliveryResponse.fromPartial({
      webhookDelivery: { webhookDeliveryId: (req?.webhookDeliveryId ?? "") },
    });
  }

  /**
   * Returns a webhook delivery.
   */
  async peekWebhookDelivery(req: webhooksWebhookDeliveryQueryServiceApi.PeekWebhookDeliveryRequest): Promise<webhooksWebhookDeliveryQueryServiceApi.PeekWebhookDeliveryResponse> {
    validateContext(req.context);
    if (!req.webhookDeliveryId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "webhook_delivery_id is required");
    }
    await this.repository.record(req.context.tenantId, "PeekWebhookDelivery", req);
    this.logger.info("peek_webhook_delivery", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ledgerLedgerAccountServiceApi.CloneLedgerAccountRequest.fromPartial({
      context: req?.context,
      ledgerAccount: { contact: { email: (req?.context?.actor?.email ?? "") } },
    });
    const method1 = "cloneLedgerAccount" as const;
    const invoke1: Unary<ledgerLedgerAccountServiceApi.CloneLedgerAccountRequest, ledgerLedgerAccountServiceApi.CloneLedgerAccountResponse> =
      (input, done) => this.ledgerLedgerAccountClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<ledgerLedgerAccountServiceApi.CloneLedgerAccountRequest, ledgerLedgerAccountServiceApi.CloneLedgerAccountResponse>(invoke1, request1);
    const request2 = webhooksWebhookEndpointQueryServiceApi.BrowseWebhookEndpointsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.ledgerAccount?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.ledgerAccount?.labels ?? {}))),
        ownerId: (reply1?.ledgerAccount?.ledgerAccountId ?? ""),
      },
    });
    const proxy2 = forwarding(this.webhooksWebhookEndpointQueryClient);
    const invoke2: Unary<webhooksWebhookEndpointQueryServiceApi.BrowseWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.BrowseWebhookEndpointsResponse> =
      (input, done) => proxy2.browseWebhookEndpoints(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webhooksWebhookEndpointQueryServiceApi.BrowseWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.BrowseWebhookEndpointsResponse>(invoke2, request2);
    return mergeResponses(
      webhooksWebhookDeliveryQueryServiceApi.PeekWebhookDeliveryResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      webhooksWebhookDeliveryQueryServiceApi.PeekWebhookDeliveryResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      webhooksWebhookDeliveryQueryServiceApi.PeekWebhookDeliveryResponse.fromPartial({
        webhookDelivery: { webhookDeliveryId: (req?.webhookDeliveryId ?? "") },
      }),
    );
  }

  /**
   * Lists webhook deliveries a page at a time.
   */
  async suggestWebhookDeliveries(req: webhooksWebhookDeliveryQueryServiceApi.SuggestWebhookDeliveriesRequest): Promise<webhooksWebhookDeliveryQueryServiceApi.SuggestWebhookDeliveriesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SuggestWebhookDeliveries", req);
    this.logger.info("suggest_webhook_deliveries", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateNotificationServiceApi.StreamNotificationTemplateNoticesRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        query: (req?.filter?.query ?? ""),
      },
    });
    const stream1 = this.notificationsNotificationTemplateNotificationClient.streamNotificationTemplateNotices(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? notificationsNotificationTemplateNotificationServiceApi.StreamNotificationTemplateNoticesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webhooksWebhookDeliveryQueryServiceApi.SuggestWebhookDeliveriesResponse.fromPartial({});
  }

  /**
   * Summarizes a webhook delivery.
   */
  async summarizeWebhookDeliveries(req: webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesRequest): Promise<webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeWebhookDeliveries", req);
    this.logger.info("summarize_webhook_deliveries", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationServiceApi.ListNotificationsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.details?.filters ?? {}))),
        ownerId: (req?.webhookDeliveryId ?? ""),
      },
    });
    const invoke1: Unary<notificationsNotificationServiceApi.ListNotificationsRequest, notificationsNotificationServiceApi.ListNotificationsResponse> =
      (input, done) => this.notificationsNotificationClient.listNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationServiceApi.ListNotificationsRequest, notificationsNotificationServiceApi.ListNotificationsResponse>(invoke1, request1);
    const request2 = notificationsNotificationExportServiceApi.RetryNotificationExportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      notification: {
        assignee: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      reason: (req?.reason ?? ""),
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<notificationsNotificationExportServiceApi.RetryNotificationExportRequest, notificationsNotificationExportServiceApi.RetryNotificationExportResponse> =
      (input, done) => this.notificationsNotificationExportClient.retryNotificationExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationExportServiceApi.RetryNotificationExportRequest, notificationsNotificationExportServiceApi.RetryNotificationExportResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretRequest.fromPartial({
      context: input3?.context,
      webhookSecret: {
        audit: {
          etag: (reply2?.notification?.audit?.etag ?? ""),
          updatedAt: reply2?.notification?.audit?.updatedAt,
        },
        contact: {
          email: (reply2?.notification?.requester?.email ?? ""),
          preferredChannel: (reply2?.notification?.requester?.preferredChannel ?? ""),
        },
      },
    });
    const invoke3: Unary<webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretResponse> =
      (input, done) => this.webhooksWebhookSecretCalculationClient.estimateWebhookSecret(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretResponse>(invoke3, request3);
    const request4 = webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (reply2?.notification?.assignee?.email ?? "") } },
    });
    const cloned4: webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityRequest = JSON.parse(JSON.stringify(request4));
    const invoke4: Unary<webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityRequest, webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityResponse> =
      (input, done) => this.webhooksWebhookDeliveryValidationClient.checkWebhookDeliveryEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityRequest, webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityResponse>(invoke4, cloned4);
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          details: (reply1?.result?.details ?? {}),
        },
      }),
      webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesResponse.fromPartial({ result: { details: (reply3?.result?.details ?? {}) } }),
      webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesResponse.fromPartial({ result: { message: (reply4?.outcome?.message ?? "") } }),
      webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}
