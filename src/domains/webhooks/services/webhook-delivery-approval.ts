/**
 * Routes webhook deliveries through approval, with escalation and delegation. Remote work stays behind typed client
 * ports.
 */

import * as auditAuditEventServiceApi from "../../../../.cache/proto/acme/audit/v1/audit_event_service.js";
import * as communityBadgeApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/badge_approval_service.js";
import * as documentsDocumentQueryServiceApi from "../../../../.cache/proto/acme/documents/v1/document_query_service.js";
import * as documentsDocumentServiceApi from "../../../../.cache/proto/acme/documents/v1/document_service.js";
import * as lendingLoanApplicationCalculationServiceApi from "../../../../.cache/proto/acme/lending/v1/loan_application_calculation_service.js";
import * as localizationLocaleApprovalServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_approval_service.js";
import * as notificationsNotificationQueryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_query_service.js";
import * as personalizationProfileReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_reporting_service.js";
import * as webhooksWebhookDeliveryApprovalServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_approval_service.js";
import * as webhooksWebhookDeliveryQueryServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_query_service.js";
import * as webhooksWebhookEndpointApprovalServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_approval_service.js";
import * as webhooksWebhookEndpointQueryServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_query_service.js";
import * as webhooksWebhookEndpointValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_validation_service.js";
import * as webhooksWebhookSecretCalculationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_secret_calculation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
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
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toWebhookDeliveryRecord } from "../data/records.js";
import { WebhooksRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate webhook delivery operations and persist audit data.
 */
@injectable()
export class WebhookDeliveryApprovalWorkflow {
  constructor(
    @inject(WebhooksRepository) private readonly repository: WebhooksRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventService") private readonly auditAuditEventClient: auditAuditEventServiceApi.AuditEventServiceClient,
    @inject("grpc:acme.community.v1.BadgeApprovalService") private readonly communityBadgeApprovalClient: communityBadgeApprovalServiceApi.BadgeApprovalServiceClient,
    @inject("grpc:acme.documents.v1.DocumentQueryService") private readonly documentsDocumentQueryClient: documentsDocumentQueryServiceApi.DocumentQueryServiceClient,
    @inject("grpc:acme.documents.v1.DocumentService") private readonly documentsDocumentClient: documentsDocumentServiceApi.DocumentServiceClient,
    @inject("grpc:acme.lending.v1.LoanApplicationCalculationService") private readonly lendingLoanApplicationCalculationClient: lendingLoanApplicationCalculationServiceApi.LoanApplicationCalculationServiceClient,
    @inject("grpc:acme.localization.v1.LocaleApprovalService") private readonly localizationLocaleApprovalClient: localizationLocaleApprovalServiceApi.LocaleApprovalServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationQueryService") private readonly notificationsNotificationQueryClient: notificationsNotificationQueryServiceApi.NotificationQueryServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileReportingService") private readonly personalizationProfileReportingClient: personalizationProfileReportingServiceApi.ProfileReportingServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryQueryService") private readonly webhooksWebhookDeliveryQueryClient: webhooksWebhookDeliveryQueryServiceApi.WebhookDeliveryQueryServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointApprovalService") private readonly webhooksWebhookEndpointApprovalClient: webhooksWebhookEndpointApprovalServiceApi.WebhookEndpointApprovalServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointQueryService") private readonly webhooksWebhookEndpointQueryClient: webhooksWebhookEndpointQueryServiceApi.WebhookEndpointQueryServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointValidationService") private readonly webhooksWebhookEndpointValidationClient: webhooksWebhookEndpointValidationServiceApi.WebhookEndpointValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretCalculationService") private readonly webhooksWebhookSecretCalculationClient: webhooksWebhookSecretCalculationServiceApi.WebhookSecretCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a webhook delivery.
   */
  async approveWebhookDelivery(req: webhooksWebhookDeliveryApprovalServiceApi.ApproveWebhookDeliveryRequest): Promise<webhooksWebhookDeliveryApprovalServiceApi.ApproveWebhookDeliveryResponse> {
    validateContext(req.context);
    if (req.webhookDelivery) {
      await this.repository.save(toWebhookDeliveryRecord(req.context.tenantId, req.webhookDelivery));
    }
    await this.repository.record(req.context.tenantId, "ApproveWebhookDelivery", req);
    this.logger.info("approve_webhook_delivery", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookEndpointApprovalServiceApi.RejectWebhookEndpointRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          displayName: (req?.webhookDelivery?.subject?.displayName ?? ""),
          email: (req?.details?.approver?.email ?? ""),
        },
      },
      webhookEndpoint: {
        owner: { userId: (req?.details?.approver?.userId ?? "") },
        webhookEndpointId: (req?.webhookDelivery?.subject?.webhookEndpointId ?? ""),
      },
    });
    const method1 = "rejectWebhookEndpoint" as const;
    const invoke1: Unary<webhooksWebhookEndpointApprovalServiceApi.RejectWebhookEndpointRequest, webhooksWebhookEndpointApprovalServiceApi.RejectWebhookEndpointResponse> =
      (input, done) => this.webhooksWebhookEndpointApprovalClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookEndpointApprovalServiceApi.RejectWebhookEndpointRequest, webhooksWebhookEndpointApprovalServiceApi.RejectWebhookEndpointResponse>(invoke1, request1);
    const tasks2: Array<() => Promise<webhooksWebhookDeliveryQueryServiceApi.SuggestWebhookDeliveriesResponse>> = [];
    for (const item of (req?.webhookDelivery?.measurements ?? [])) {
      tasks2.push(async () => {
        const request2 = webhooksWebhookDeliveryQueryServiceApi.SuggestWebhookDeliveriesRequest.fromPartial({
          context: req?.context,
          filter: {
            createdAfter: item?.observedAt,
            labels: Object.fromEntries(Object.entries((reply1?.webhookEndpoint?.specs ?? {}))),
            ownerId: (req?.webhookDelivery?.subject?.webhookEndpointId ?? ""),
            region: ((reply1?.webhookEndpoint?.locator?.$case === "address" ? reply1?.webhookEndpoint?.locator.address : undefined)?.region ?? ""),
          },
        });
        const invoke2: Unary<webhooksWebhookDeliveryQueryServiceApi.SuggestWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.SuggestWebhookDeliveriesResponse> =
          (input, done) => this.webhooksWebhookDeliveryQueryClient.suggestWebhookDeliveries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<webhooksWebhookDeliveryQueryServiceApi.SuggestWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.SuggestWebhookDeliveriesResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? webhooksWebhookDeliveryQueryServiceApi.SuggestWebhookDeliveriesResponse.fromPartial({});
    const request3 = notificationsNotificationQueryServiceApi.ResolveNotificationsRequest.fromPartial({ context: req?.context });
    const proxy3 = forwarding(this.notificationsNotificationQueryClient);
    const invoke3: Unary<notificationsNotificationQueryServiceApi.ResolveNotificationsRequest, notificationsNotificationQueryServiceApi.ResolveNotificationsResponse> =
      (input, done) => proxy3.resolveNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsNotificationQueryServiceApi.ResolveNotificationsRequest, notificationsNotificationQueryServiceApi.ResolveNotificationsResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookDeliveryApprovalServiceApi.ApproveWebhookDeliveryResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      webhooksWebhookDeliveryApprovalServiceApi.ApproveWebhookDeliveryResponse.fromPartial({
        outcome: { status: (reply3?.result?.status ?? "") },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      webhooksWebhookDeliveryApprovalServiceApi.ApproveWebhookDeliveryResponse.fromPartial({
        webhookDelivery: {
          kind: (req?.webhookDelivery?.kind ?? ""),
          webhookDeliveryId: (req?.webhookDeliveryId ?? ""),
        },
      }),
    );
  }

  /**
   * Comments a webhook delivery.
   */
  async commentWebhookDeliveryApproval(req: webhooksWebhookDeliveryApprovalServiceApi.CommentWebhookDeliveryApprovalRequest): Promise<webhooksWebhookDeliveryApprovalServiceApi.CommentWebhookDeliveryApprovalResponse> {
    validateContext(req.context);
    if (req.webhookDelivery) {
      await this.repository.save(toWebhookDeliveryRecord(req.context.tenantId, req.webhookDelivery));
    }
    await this.repository.record(req.context.tenantId, "CommentWebhookDeliveryApproval", req);
    this.logger.info("comment_webhook_delivery_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileReportingServiceApi.CountProfileTotalsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.webhookDelivery?.occurredAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.webhookDelivery?.subject?.webhookEndpointId ?? ""),
      },
    });
    const invoke1: Unary<personalizationProfileReportingServiceApi.CountProfileTotalsRequest, personalizationProfileReportingServiceApi.CountProfileTotalsResponse> =
      (input, done) => this.personalizationProfileReportingClient.countProfileTotals(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileReportingServiceApi.CountProfileTotalsRequest, personalizationProfileReportingServiceApi.CountProfileTotalsResponse>(invoke1, request1);
    const results2 = await Promise.all((req?.webhookDelivery?.measurements ?? []).map(async (item) => {
      const request2 = webhooksWebhookEndpointApprovalServiceApi.SubmitWebhookEndpointRequest.fromPartial({
        context: req?.context,
        webhookEndpoint: { dimensions: { unit: (item?.unit ?? "") } },
      });
      const invoke2: Unary<webhooksWebhookEndpointApprovalServiceApi.SubmitWebhookEndpointRequest, webhooksWebhookEndpointApprovalServiceApi.SubmitWebhookEndpointResponse> =
        (input, done) => this.webhooksWebhookEndpointApprovalClient.submitWebhookEndpoint(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<webhooksWebhookEndpointApprovalServiceApi.SubmitWebhookEndpointRequest, webhooksWebhookEndpointApprovalServiceApi.SubmitWebhookEndpointResponse>(invoke2, request2);
      return reply2;
    }));
    const reply2 = results2.at(-1) ?? webhooksWebhookEndpointApprovalServiceApi.SubmitWebhookEndpointResponse.fromPartial({});
    const request3 = documentsDocumentQueryServiceApi.SummarizeDocumentsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((reply2?.webhookEndpoint?.specs ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<documentsDocumentQueryServiceApi.SummarizeDocumentsRequest, documentsDocumentQueryServiceApi.SummarizeDocumentsResponse> =
      (input, done) => this.documentsDocumentQueryClient.summarizeDocuments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<documentsDocumentQueryServiceApi.SummarizeDocumentsRequest, documentsDocumentQueryServiceApi.SummarizeDocumentsResponse>(invoke3, spread3);
    const { context: context4, ...body4 } = req;
    const input4 = { ...body4, context: context4 };
    const request4 = auditAuditEventServiceApi.ListAuditEventsRequest.fromPartial({
      context: input4?.context,
      filter: {
        createdAfter: input4?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((reply2?.result?.details ?? {}))),
        region: ((reply2?.webhookEndpoint?.locator?.$case === "address" ? reply2?.webhookEndpoint?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke4: Unary<auditAuditEventServiceApi.ListAuditEventsRequest, auditAuditEventServiceApi.ListAuditEventsResponse> =
      (input, done) => this.auditAuditEventClient.listAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<auditAuditEventServiceApi.ListAuditEventsRequest, auditAuditEventServiceApi.ListAuditEventsResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.details?.approver?.email ?? "") });
    return mergeResponses(
      webhooksWebhookDeliveryApprovalServiceApi.CommentWebhookDeliveryApprovalResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      webhooksWebhookDeliveryApprovalServiceApi.CommentWebhookDeliveryApprovalResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      webhooksWebhookDeliveryApprovalServiceApi.CommentWebhookDeliveryApprovalResponse.fromPartial({ result: { details: (reply4?.result?.details ?? {}) } }),
      webhooksWebhookDeliveryApprovalServiceApi.CommentWebhookDeliveryApprovalResponse.fromPartial({
        webhookDelivery: {
          kind: (req?.webhookDelivery?.kind ?? ""),
          webhookDeliveryId: (req?.webhookDeliveryId ?? ""),
        },
      }),
    );
  }

  /**
   * Escalates a webhook delivery.
   */
  async escalateWebhookDelivery(req: webhooksWebhookDeliveryApprovalServiceApi.EscalateWebhookDeliveryRequest): Promise<webhooksWebhookDeliveryApprovalServiceApi.EscalateWebhookDeliveryResponse> {
    validateContext(req.context);
    if (req.webhookDelivery) {
      await this.repository.save(toWebhookDeliveryRecord(req.context.tenantId, req.webhookDelivery));
    }
    await this.repository.record(req.context.tenantId, "EscalateWebhookDelivery", req);
    this.logger.info("escalate_webhook_delivery", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = lendingLoanApplicationCalculationServiceApi.QuoteLoanApplicationRequest.fromPartial({
      context: req?.context,
      loanApplication: {
        counterparty: {
          displayName: (req?.webhookDelivery?.subject?.displayName ?? ""),
          email: (req?.details?.approver?.email ?? ""),
        },
        lines: [{
          attributes: Object.fromEntries(Object.entries((req?.webhookDelivery?.attributes ?? {}))),
        }],
      },
      reason: (req?.reason ?? ""),
    });
    const cloned1: lendingLoanApplicationCalculationServiceApi.QuoteLoanApplicationRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<lendingLoanApplicationCalculationServiceApi.QuoteLoanApplicationRequest, lendingLoanApplicationCalculationServiceApi.QuoteLoanApplicationResponse> =
      (input, done) => this.lendingLoanApplicationCalculationClient.quoteLoanApplication(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<lendingLoanApplicationCalculationServiceApi.QuoteLoanApplicationRequest, lendingLoanApplicationCalculationServiceApi.QuoteLoanApplicationResponse>(invoke1, cloned1);
    const settled2 = await Promise.allSettled((req?.webhookDelivery?.measurements ?? []).map(async (item) => {
      const request2 = communityBadgeApprovalServiceApi.SubmitBadgeRequest.fromPartial({
        badge: {
          audit: { createdAt: item?.observedAt },
          owner: { displayName: (req?.webhookDelivery?.subject?.displayName ?? "") },
        },
        context: req?.context,
      });
      const invoke2: Unary<communityBadgeApprovalServiceApi.SubmitBadgeRequest, communityBadgeApprovalServiceApi.SubmitBadgeResponse> =
        (input, done) => this.communityBadgeApprovalClient.submitBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<communityBadgeApprovalServiceApi.SubmitBadgeRequest, communityBadgeApprovalServiceApi.SubmitBadgeResponse>(invoke2, request2);
      return reply2;
    }));
    const results2: communityBadgeApprovalServiceApi.SubmitBadgeResponse[] = [];
    for (const result of settled2) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results2.push(result.value);
    }
    const reply2 = results2.at(-1) ?? communityBadgeApprovalServiceApi.SubmitBadgeResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.details?.approver?.displayName ?? "") });
    return mergeResponses(
      webhooksWebhookDeliveryApprovalServiceApi.EscalateWebhookDeliveryResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      webhooksWebhookDeliveryApprovalServiceApi.EscalateWebhookDeliveryResponse.fromPartial({
        webhookDelivery: {
          sequence: (req?.webhookDelivery?.sequence ?? 0),
          webhookDeliveryId: (req?.webhookDeliveryId ?? ""),
        },
      }),
    );
  }

  /**
   * Lists webhook deliveries a page at a time.
   */
  async listPendingWebhookDeliveries(req: webhooksWebhookDeliveryApprovalServiceApi.ListPendingWebhookDeliveriesRequest): Promise<webhooksWebhookDeliveryApprovalServiceApi.ListPendingWebhookDeliveriesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingWebhookDeliveries", req);
    this.logger.info("list_pending_webhook_deliveries", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
      webhookSecret: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        openedAt: req?.filter?.createdAfter,
      },
    });
    const decoded1 = webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretRequest.fromJSON(
      JSON.parse(JSON.stringify(webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretRequest.toJSON(request1))),
    );
    const invoke1: Unary<webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretResponse> =
      (input, done) => this.webhooksWebhookSecretCalculationClient.estimateWebhookSecret(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretResponse>(invoke1, decoded1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webhooksWebhookDeliveryApprovalServiceApi.ListPendingWebhookDeliveriesResponse.fromPartial({
      result: { status: (reply1?.result?.status ?? "") },
      webhookDeliveries: [{ subject: { code: (reply1?.webhookSecret?.holder?.code ?? "") } }],
    });
  }

  /**
   * Recalls a webhook delivery.
   */
  async recallWebhookDelivery(req: webhooksWebhookDeliveryApprovalServiceApi.RecallWebhookDeliveryRequest): Promise<webhooksWebhookDeliveryApprovalServiceApi.RecallWebhookDeliveryResponse> {
    validateContext(req.context);
    if (req.webhookDelivery) {
      await this.repository.save(toWebhookDeliveryRecord(req.context.tenantId, req.webhookDelivery));
    }
    await this.repository.record(req.context.tenantId, "RecallWebhookDelivery", req);
    this.logger.info("recall_webhook_delivery", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookEndpointQueryServiceApi.BrowseWebhookEndpointsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.webhookDeliveryId ?? ""),
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.webhooks.v1.BrowseWebhookEndpointsRequest",
      value: Buffer.from(webhooksWebhookEndpointQueryServiceApi.BrowseWebhookEndpointsRequest.encode(request1).finish()),
    });
    const unpacked1 = webhooksWebhookEndpointQueryServiceApi.BrowseWebhookEndpointsRequest.decode(envelope1.value);
    const invoke1: Unary<webhooksWebhookEndpointQueryServiceApi.BrowseWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.BrowseWebhookEndpointsResponse> =
      (input, done) => this.webhooksWebhookEndpointQueryClient.browseWebhookEndpoints(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookEndpointQueryServiceApi.BrowseWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.BrowseWebhookEndpointsResponse>(invoke1, unpacked1);
    const request2 = documentsDocumentServiceApi.CreateDocumentRequest.fromPartial({
      context: req?.context,
      document: {
        counterparty: { displayName: (req?.details?.approver?.displayName ?? "") },
      },
    });
    const client2 = this.clients.get<documentsDocumentServiceApi.DocumentServiceClient>("acme.documents.v1.DocumentService");
    const invoke2: Unary<documentsDocumentServiceApi.CreateDocumentRequest, documentsDocumentServiceApi.CreateDocumentResponse> =
      (input, done) => client2.createDocument(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<documentsDocumentServiceApi.CreateDocumentRequest, documentsDocumentServiceApi.CreateDocumentResponse>(invoke2, request2);
    const request3 = localizationLocaleApprovalServiceApi.ListPendingLocalesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.document?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.webhookDelivery?.attributes ?? {}))),
        ownerId: (req?.webhookDelivery?.subject?.webhookEndpointId ?? ""),
        region: (reply2?.document?.billingAddress?.region ?? ""),
      },
    });
    const invoke3: Unary<localizationLocaleApprovalServiceApi.ListPendingLocalesRequest, localizationLocaleApprovalServiceApi.ListPendingLocalesResponse> =
      (input, done) => this.localizationLocaleApprovalClient.listPendingLocales(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port3: RequestPort<localizationLocaleApprovalServiceApi.ListPendingLocalesRequest, localizationLocaleApprovalServiceApi.ListPendingLocalesResponse> = new GrpcAdapter(invoke3);
    const reply3 = await port3.execute(request3);
    const request4 = webhooksWebhookDeliveryQueryServiceApi.BrowseWebhookDeliveriesRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply2?.document?.billingAddress?.region ?? "") },
    });
    const invoke4: Unary<webhooksWebhookDeliveryQueryServiceApi.BrowseWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.BrowseWebhookDeliveriesResponse> =
      (input, done) => this.webhooksWebhookDeliveryQueryClient.browseWebhookDeliveries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await retry(() => call<webhooksWebhookDeliveryQueryServiceApi.BrowseWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.BrowseWebhookDeliveriesResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookDeliveryApprovalServiceApi.RecallWebhookDeliveryResponse.fromPartial({ outcome: { status: (reply1?.result?.status ?? "") } }),
      webhooksWebhookDeliveryApprovalServiceApi.RecallWebhookDeliveryResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      webhooksWebhookDeliveryApprovalServiceApi.RecallWebhookDeliveryResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
      webhooksWebhookDeliveryApprovalServiceApi.RecallWebhookDeliveryResponse.fromPartial({
        outcome: { status: (reply4?.result?.status ?? "") },
        result: { message: (reply4?.result?.message ?? "") },
      }),
      webhooksWebhookDeliveryApprovalServiceApi.RecallWebhookDeliveryResponse.fromPartial({
        webhookDelivery: {
          correlationId: (req?.webhookDelivery?.correlationId ?? ""),
          webhookDeliveryId: (req?.webhookDeliveryId ?? ""),
        },
      }),
    );
  }

  /**
   * Rejects a webhook delivery.
   */
  async rejectWebhookDelivery(req: webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryRequest): Promise<webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryResponse> {
    validateContext(req.context);
    if (req.webhookDelivery) {
      await this.repository.save(toWebhookDeliveryRecord(req.context.tenantId, req.webhookDelivery));
    }
    await this.repository.record(req.context.tenantId, "RejectWebhookDelivery", req);
    this.logger.info("reject_webhook_delivery", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookEndpointQueryServiceApi.PeekWebhookEndpointRequest.fromPartial({
      context: req?.context,
      webhookEndpointId: (req?.webhookDelivery?.subject?.webhookEndpointId ?? ""),
    });
    const invoke1: Unary<webhooksWebhookEndpointQueryServiceApi.PeekWebhookEndpointRequest, webhooksWebhookEndpointQueryServiceApi.PeekWebhookEndpointResponse> =
      (input, done) => this.webhooksWebhookEndpointQueryClient.peekWebhookEndpoint(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("RejectWebhookDelivery.PeekWebhookEndpoint", () => call<webhooksWebhookEndpointQueryServiceApi.PeekWebhookEndpointRequest, webhooksWebhookEndpointQueryServiceApi.PeekWebhookEndpointResponse>(invoke1, request1));
    const tasks2: Array<() => Promise<webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointResponse>> = [];
    for (const item of (req?.webhookDelivery?.measurements ?? [])) {
      tasks2.push(async () => {
        const request2 = webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointRequest.fromPartial({
          context: req?.context,
          webhookEndpoint: {
            locator: { $case: "address", address: {
              countryCode: ((reply1?.webhookEndpoint?.locator?.$case === "address" ? reply1?.webhookEndpoint?.locator.address : undefined)?.countryCode ?? ""),
              recipient: ((reply1?.webhookEndpoint?.locator?.$case === "address" ? reply1?.webhookEndpoint?.locator.address : undefined)?.recipient ?? ""),
            } },
            dimensions: { unit: (item?.unit ?? "") },
            owner: { displayName: (req?.details?.approver?.displayName ?? "") },
          },
        });
        const invoke2: Unary<webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointResponse> =
          (input, done) => this.webhooksWebhookEndpointValidationClient.validateWebhookEndpoint(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointResponse.fromPartial({});
    const request3 = webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: ((reply2?.webhookEndpoint?.locator?.$case === "address" ? reply2?.webhookEndpoint?.locator.address : undefined)?.lines ?? []).map((value) => value),
        },
      },
      webhookSecret: {
        audit: {
          createdAt: reply1?.webhookEndpoint?.audit?.createdAt,
          createdBy: (reply2?.webhookEndpoint?.audit?.createdBy ?? ""),
        },
        contact: { email: (reply1?.webhookEndpoint?.owner?.email ?? "") },
      },
    });
    const invoke3: Unary<webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsRequest, webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsResponse> =
      (input, done) => this.webhooksWebhookSecretCalculationClient.recalculateWebhookSecrets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryResponse.fromPartial({
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
        webhookDelivery: { subject: { code: (reply1?.webhookEndpoint?.code ?? "") } },
      }),
      webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryResponse.fromPartial({
        outcome: { message: (reply3?.result?.message ?? "") },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryResponse.fromPartial({
        webhookDelivery: {
          sequence: (req?.webhookDelivery?.sequence ?? 0),
          webhookDeliveryId: (req?.webhookDeliveryId ?? ""),
        },
      }),
    );
  }

  /**
   * Submits a webhook delivery.
   */
  async submitWebhookDelivery(req: webhooksWebhookDeliveryApprovalServiceApi.SubmitWebhookDeliveryRequest): Promise<webhooksWebhookDeliveryApprovalServiceApi.SubmitWebhookDeliveryResponse> {
    validateContext(req.context);
    if (req.webhookDelivery) {
      await this.repository.save(toWebhookDeliveryRecord(req.context.tenantId, req.webhookDelivery));
    }
    await this.repository.record(req.context.tenantId, "SubmitWebhookDelivery", req);
    this.logger.info("submit_webhook_delivery", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.webhookDelivery?.measurements ?? []).map(async (item) => {
      const request1 = communityBadgeApprovalServiceApi.DelegateBadgeApprovalRequest.fromPartial({
        badge: { audit: { updatedAt: item?.observedAt } },
        context: req?.context,
        details: {
          approver: { displayName: (req?.webhookDelivery?.subject?.displayName ?? "") },
        },
      });
      const invoke1: Unary<communityBadgeApprovalServiceApi.DelegateBadgeApprovalRequest, communityBadgeApprovalServiceApi.DelegateBadgeApprovalResponse> =
        (input, done) => this.communityBadgeApprovalClient.delegateBadgeApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<communityBadgeApprovalServiceApi.DelegateBadgeApprovalRequest, communityBadgeApprovalServiceApi.DelegateBadgeApprovalResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? communityBadgeApprovalServiceApi.DelegateBadgeApprovalResponse.fromPartial({});
    const request2 = webhooksWebhookEndpointQueryServiceApi.FindWebhookEndpointsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.badge?.audit?.updatedAt,
        ownerId: (req?.details?.approver?.userId ?? ""),
      },
    });
    const reply2 = await this.workQueue.enqueue<webhooksWebhookEndpointQueryServiceApi.FindWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.FindWebhookEndpointsResponse>(
      "acme.webhooks.v1.WebhookDeliveryApprovalService/SubmitWebhookDelivery:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookDeliveryApprovalServiceApi.SubmitWebhookDeliveryResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      webhooksWebhookDeliveryApprovalServiceApi.SubmitWebhookDeliveryResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        webhookDelivery: { webhookDeliveryId: (req?.webhookDeliveryId ?? "") },
      }),
    );
  }
}

/**
 * The gRPC boundary for WebhookDeliveryApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class WebhookDeliveryApprovalHandler {
  constructor(@inject(WebhookDeliveryApprovalWorkflow) private readonly workflow: WebhookDeliveryApprovalWorkflow) {}

  /**
   * Approves a webhook delivery.
   */
  approveWebhookDelivery = unary<webhooksWebhookDeliveryApprovalServiceApi.ApproveWebhookDeliveryRequest, webhooksWebhookDeliveryApprovalServiceApi.ApproveWebhookDeliveryResponse>(
    (request) => this.workflow.approveWebhookDelivery(request),
  );

  /**
   * Comments a webhook delivery.
   */
  commentWebhookDeliveryApproval = unary<webhooksWebhookDeliveryApprovalServiceApi.CommentWebhookDeliveryApprovalRequest, webhooksWebhookDeliveryApprovalServiceApi.CommentWebhookDeliveryApprovalResponse>(
    (request) => this.workflow.commentWebhookDeliveryApproval(request),
  );

  /**
   * Escalates a webhook delivery.
   */
  escalateWebhookDelivery = (call: ServerUnaryCall<webhooksWebhookDeliveryApprovalServiceApi.EscalateWebhookDeliveryRequest, webhooksWebhookDeliveryApprovalServiceApi.EscalateWebhookDeliveryResponse>, done: sendUnaryData<webhooksWebhookDeliveryApprovalServiceApi.EscalateWebhookDeliveryResponse>): void => {
    void this.workflow.escalateWebhookDelivery(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists webhook deliveries a page at a time.
   */
  listPendingWebhookDeliveries = unary<webhooksWebhookDeliveryApprovalServiceApi.ListPendingWebhookDeliveriesRequest, webhooksWebhookDeliveryApprovalServiceApi.ListPendingWebhookDeliveriesResponse>(
    (request) => this.workflow.listPendingWebhookDeliveries(request),
  );

  /**
   * Recalls a webhook delivery.
   */
  recallWebhookDelivery = unary<webhooksWebhookDeliveryApprovalServiceApi.RecallWebhookDeliveryRequest, webhooksWebhookDeliveryApprovalServiceApi.RecallWebhookDeliveryResponse>(
    (request) => this.workflow.recallWebhookDelivery(request),
  );

  /**
   * Rejects a webhook delivery.
   */
  rejectWebhookDelivery = (call: ServerUnaryCall<webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryRequest, webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryResponse>, done: sendUnaryData<webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryResponse>): void => {
    void this.workflow.rejectWebhookDelivery(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Submits a webhook delivery.
   */
  submitWebhookDelivery = unary<webhooksWebhookDeliveryApprovalServiceApi.SubmitWebhookDeliveryRequest, webhooksWebhookDeliveryApprovalServiceApi.SubmitWebhookDeliveryResponse>(
    (request) => this.workflow.submitWebhookDelivery(request),
  );
}

export function implementation(handler: WebhookDeliveryApprovalHandler): webhooksWebhookDeliveryApprovalServiceApi.WebhookDeliveryApprovalServiceServer {
  return {
    approveWebhookDelivery: handler.approveWebhookDelivery,
    commentWebhookDeliveryApproval: handler.commentWebhookDeliveryApproval,
    escalateWebhookDelivery: handler.escalateWebhookDelivery,
    listPendingWebhookDeliveries: handler.listPendingWebhookDeliveries,
    recallWebhookDelivery: handler.recallWebhookDelivery,
    rejectWebhookDelivery: handler.rejectWebhookDelivery,
    submitWebhookDelivery: handler.submitWebhookDelivery,
  };
}
