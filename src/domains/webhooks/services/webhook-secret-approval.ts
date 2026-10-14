/**
 * Routes webhook secrets through approval, with escalation and delegation. Remote work stays behind typed client
 * ports.
 */

import * as experimentsVariantApprovalServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_approval_service.js";
import * as localizationLocaleApprovalServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_approval_service.js";
import * as notificationsDeliveryAttemptAdminServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_admin_service.js";
import * as notificationsDeliveryAttemptNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_notification_service.js";
import * as notificationsDeliveryAttemptValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_validation_service.js";
import * as personalizationRecommendationReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_reporting_service.js";
import * as webhooksWebhookDeliveryApprovalServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_approval_service.js";
import * as webhooksWebhookDeliveryQueryServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_query_service.js";
import * as webhooksWebhookEndpointApprovalServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_approval_service.js";
import * as webhooksWebhookSecretApprovalServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_secret_approval_service.js";
import * as webhooksWebhookSecretCalculationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_secret_calculation_service.js";
import * as webhooksWebhookSecretValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_secret_validation_service.js";
import * as yardsYardQueryServiceApi from "../../../../.cache/proto/acme/yards/v1/yard_query_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, operation, promised, type Unary } from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toWebhookSecretRecord } from "../data/records.js";
import { WebhooksRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate webhook secret operations and persist audit data.
 */
@injectable()
export class WebhookSecretApprovalWorkflow {
  constructor(
    @inject(WebhooksRepository) private readonly repository: WebhooksRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.experiments.v1.VariantApprovalService") private readonly experimentsVariantApprovalClient: experimentsVariantApprovalServiceApi.VariantApprovalServiceClient,
    @inject("grpc:acme.localization.v1.LocaleApprovalService") private readonly localizationLocaleApprovalClient: localizationLocaleApprovalServiceApi.LocaleApprovalServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptAdminService") private readonly notificationsDeliveryAttemptAdminClient: notificationsDeliveryAttemptAdminServiceApi.DeliveryAttemptAdminServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptNotificationService") private readonly notificationsDeliveryAttemptNotificationClient: notificationsDeliveryAttemptNotificationServiceApi.DeliveryAttemptNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptValidationService") private readonly notificationsDeliveryAttemptValidationClient: notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationReportingService") private readonly personalizationRecommendationReportingClient: personalizationRecommendationReportingServiceApi.RecommendationReportingServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryApprovalService") private readonly webhooksWebhookDeliveryApprovalClient: webhooksWebhookDeliveryApprovalServiceApi.WebhookDeliveryApprovalServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryQueryService") private readonly webhooksWebhookDeliveryQueryClient: webhooksWebhookDeliveryQueryServiceApi.WebhookDeliveryQueryServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointApprovalService") private readonly webhooksWebhookEndpointApprovalClient: webhooksWebhookEndpointApprovalServiceApi.WebhookEndpointApprovalServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretCalculationService") private readonly webhooksWebhookSecretCalculationClient: webhooksWebhookSecretCalculationServiceApi.WebhookSecretCalculationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretValidationService") private readonly webhooksWebhookSecretValidationClient: webhooksWebhookSecretValidationServiceApi.WebhookSecretValidationServiceClient,
    @inject("grpc:acme.yards.v1.YardQueryService") private readonly yardsYardQueryClient: yardsYardQueryServiceApi.YardQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a webhook secret.
   */
  async approveWebhookSecret(req: webhooksWebhookSecretApprovalServiceApi.ApproveWebhookSecretRequest): Promise<webhooksWebhookSecretApprovalServiceApi.ApproveWebhookSecretResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "ApproveWebhookSecret", req);
    this.logger.info("approve_webhook_secret", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationReportingServiceApi.CountRecommendationTotalsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.webhookSecret?.labels ?? {}))),
      },
    });
    const invoke1: Unary<personalizationRecommendationReportingServiceApi.CountRecommendationTotalsRequest, personalizationRecommendationReportingServiceApi.CountRecommendationTotalsResponse> =
      (input, done) => this.personalizationRecommendationReportingClient.countRecommendationTotals(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = notificationsDeliveryAttemptAdminServiceApi.RepairDeliveryAttemptRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      deliveryAttempt: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        subject: { displayName: (req?.details?.approver?.displayName ?? "") },
      },
      reason: (req?.reason ?? ""),
    });
    const reply2 = await this.workQueue.enqueue<notificationsDeliveryAttemptAdminServiceApi.RepairDeliveryAttemptRequest, notificationsDeliveryAttemptAdminServiceApi.RepairDeliveryAttemptResponse>(
      "acme.webhooks.v1.WebhookSecretApprovalService/ApproveWebhookSecret:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.details?.approver?.email ?? "") });
    return mergeResponses(
      webhooksWebhookSecretApprovalServiceApi.ApproveWebhookSecretResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      webhooksWebhookSecretApprovalServiceApi.ApproveWebhookSecretResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          status: (reply2?.outcome?.status ?? ""),
        },
      }),
      webhooksWebhookSecretApprovalServiceApi.ApproveWebhookSecretResponse.fromPartial({
        webhookSecret: {
          currencyCode: (req?.webhookSecret?.currencyCode ?? ""),
          webhookSecretId: (req?.webhookSecretId ?? ""),
        },
      }),
    );
  }

  /**
   * Delegates a webhook secret.
   */
  async delegateWebhookSecretApproval(req: webhooksWebhookSecretApprovalServiceApi.DelegateWebhookSecretApprovalRequest): Promise<webhooksWebhookSecretApprovalServiceApi.DelegateWebhookSecretApprovalResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "DelegateWebhookSecretApproval", req);
    this.logger.info("delegate_webhook_secret_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.webhookSecret?.limits ?? []).map(async (item) => {
      const request1 = webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsRequest.fromPartial({
        context: req?.context,
        webhookSecret: {
          limits: [{
            name: (item?.name ?? ""),
            period: item?.period,
          }],
        },
      });
      const invoke1: Unary<webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsRequest, webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsResponse> =
        (input, done) => this.webhooksWebhookSecretCalculationClient.recalculateWebhookSecrets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsRequest, webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsResponse.fromPartial({});
    const request2 = webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryRequest.fromPartial({
      context: req?.context,
      details: {
        approver: { displayName: (reply1?.webhookSecret?.holder?.displayName ?? "") },
      },
      webhookDelivery: {
        subject: {
          webhookEndpointId: (reply1?.webhookSecret?.holder?.webhookEndpointId ?? ""),
        },
      },
    });
    const invoke2: Unary<webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryRequest, webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryResponse> =
      (input, done) => this.webhooksWebhookDeliveryApprovalClient.rejectWebhookDelivery(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryRequest, webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookSecretApprovalServiceApi.DelegateWebhookSecretApprovalResponse.fromPartial({
        outcome: {
          message: (reply2?.result?.message ?? ""),
          referenceId: (reply2?.outcome?.referenceId ?? ""),
        },
      }),
      webhooksWebhookSecretApprovalServiceApi.DelegateWebhookSecretApprovalResponse.fromPartial({
        webhookSecret: {
          contact: req?.webhookSecret?.contact,
          webhookSecretId: (req?.webhookSecretId ?? ""),
        },
      }),
    );
  }

  /**
   * Escalates a webhook secret.
   */
  async escalateWebhookSecret(req: webhooksWebhookSecretApprovalServiceApi.EscalateWebhookSecretRequest): Promise<webhooksWebhookSecretApprovalServiceApi.EscalateWebhookSecretResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "EscalateWebhookSecret", req);
    this.logger.info("escalate_webhook_secret", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = yardsYardQueryServiceApi.FindYardsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.webhookSecret?.labels ?? {}))),
      },
    });
    const invoke1: Unary<yardsYardQueryServiceApi.FindYardsRequest, yardsYardQueryServiceApi.FindYardsResponse> =
      (input, done) => this.yardsYardQueryClient.findYards(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<yardsYardQueryServiceApi.FindYardsResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          displayName: (req?.webhookSecret?.holder?.displayName ?? ""),
          email: (req?.webhookSecret?.contact?.email ?? ""),
        },
      },
    });
    const invoke2: Unary<webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryRequest, webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryResponse> =
      (input, done) => this.webhooksWebhookDeliveryApprovalClient.rejectWebhookDelivery(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookSecretApprovalServiceApi.EscalateWebhookSecretResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      webhooksWebhookSecretApprovalServiceApi.EscalateWebhookSecretResponse.fromPartial({
        outcome: { nextSteps: (reply2?.outcome?.nextSteps ?? []) },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      webhooksWebhookSecretApprovalServiceApi.EscalateWebhookSecretResponse.fromPartial({
        webhookSecret: {
          currencyCode: (req?.webhookSecret?.currencyCode ?? ""),
          webhookSecretId: (req?.webhookSecretId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a webhook secret.
   */
  async getWebhookSecretApprovalStatus(req: webhooksWebhookSecretApprovalServiceApi.GetWebhookSecretApprovalStatusRequest): Promise<webhooksWebhookSecretApprovalServiceApi.GetWebhookSecretApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.webhookSecretId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "webhook_secret_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetWebhookSecretApprovalStatus", req);
    this.logger.info("get_webhook_secret_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptValidationServiceApi.CheckDeliveryAttemptEligibilityRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
    });
    const invoke1: Unary<notificationsDeliveryAttemptValidationServiceApi.CheckDeliveryAttemptEligibilityRequest, notificationsDeliveryAttemptValidationServiceApi.CheckDeliveryAttemptEligibilityResponse> =
      (input, done) => this.notificationsDeliveryAttemptValidationClient.checkDeliveryAttemptEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    return mergeResponses(
      webhooksWebhookSecretApprovalServiceApi.GetWebhookSecretApprovalStatusResponse.fromPartial({
        result: { message: (reply1?.outcome?.message ?? "") },
        webhookSecret: {
          holder: { displayName: (reply1?.deliveryAttempt?.subject?.displayName ?? "") },
        },
      }),
      webhooksWebhookSecretApprovalServiceApi.GetWebhookSecretApprovalStatusResponse.fromPartial({ webhookSecret: { webhookSecretId: (req?.webhookSecretId ?? "") } }),
    );
  }

  /**
   * Recalls a webhook secret.
   */
  async recallWebhookSecret(req: webhooksWebhookSecretApprovalServiceApi.RecallWebhookSecretRequest): Promise<webhooksWebhookSecretApprovalServiceApi.RecallWebhookSecretResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "RecallWebhookSecret", req);
    this.logger.info("recall_webhook_secret", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptNotificationServiceApi.StreamDeliveryAttemptNoticesRequest.fromPartial({
      context: req?.context,
      subscriber: { email: (req?.webhookSecret?.contact?.email ?? "") },
    });
    const stream1 = this.notificationsDeliveryAttemptNotificationClient.streamDeliveryAttemptNotices(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? notificationsDeliveryAttemptNotificationServiceApi.StreamDeliveryAttemptNoticesResponse.fromPartial({});
    const request2 = localizationLocaleApprovalServiceApi.EscalateLocaleRequest.fromPartial({
      context: req?.context,
      locale: { audit: { updatedBy: (req?.webhookSecret?.audit?.updatedBy ?? "") } },
    });
    const method2 = "escalateLocale" as const;
    const invoke2: Unary<localizationLocaleApprovalServiceApi.EscalateLocaleRequest, localizationLocaleApprovalServiceApi.EscalateLocaleResponse> =
      (input, done) => this.localizationLocaleApprovalClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationLocaleApprovalServiceApi.EscalateLocaleRequest, localizationLocaleApprovalServiceApi.EscalateLocaleResponse>(invoke2, request2);
    const settled3 = await Promise.allSettled((req?.webhookSecret?.limits ?? []).map(async (item) => {
      const request3 = webhooksWebhookSecretValidationServiceApi.ExplainWebhookSecretDecisionRequest.fromPartial({
        context: req?.context,
        webhookSecret: {
          funding: { $case: "bank", bank: {
            accountHolder: ((req?.webhookSecret?.funding?.$case === "bank" ? req?.webhookSecret?.funding.bank : undefined)?.accountHolder ?? ""),
          } },
          limits: [{
            amount: item?.amount,
            name: (item?.name ?? ""),
            period: item?.period,
          }],
        },
      });
      const invoke3: Unary<webhooksWebhookSecretValidationServiceApi.ExplainWebhookSecretDecisionRequest, webhooksWebhookSecretValidationServiceApi.ExplainWebhookSecretDecisionResponse> =
        (input, done) => this.webhooksWebhookSecretValidationClient.explainWebhookSecretDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<webhooksWebhookSecretValidationServiceApi.ExplainWebhookSecretDecisionRequest, webhooksWebhookSecretValidationServiceApi.ExplainWebhookSecretDecisionResponse>(invoke3, request3);
      return reply3;
    }));
    const results3: webhooksWebhookSecretValidationServiceApi.ExplainWebhookSecretDecisionResponse[] = [];
    for (const result of settled3) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results3.push(result.value);
    }
    const reply3 = results3.at(-1) ?? webhooksWebhookSecretValidationServiceApi.ExplainWebhookSecretDecisionResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookSecretApprovalServiceApi.RecallWebhookSecretResponse.fromPartial({ outcome: { nextSteps: (reply2?.outcome?.nextSteps ?? []) } }),
      webhooksWebhookSecretApprovalServiceApi.RecallWebhookSecretResponse.fromPartial({
        webhookSecret: {
          contact: req?.webhookSecret?.contact,
          webhookSecretId: (req?.webhookSecretId ?? ""),
        },
      }),
    );
  }

  /**
   * Rejects a webhook secret.
   */
  async rejectWebhookSecret(req: webhooksWebhookSecretApprovalServiceApi.RejectWebhookSecretRequest): Promise<webhooksWebhookSecretApprovalServiceApi.RejectWebhookSecretResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "RejectWebhookSecret", req);
    this.logger.info("reject_webhook_secret", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookDeliveryQueryServiceApi.CountWebhookDeliveriesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.webhookSecret?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.webhookSecret?.labels ?? {}))),
        ownerId: (req?.webhookSecret?.holder?.webhookEndpointId ?? ""),
      },
    });
    const proxy1 = forwarding(this.webhooksWebhookDeliveryQueryClient);
    const invoke1: Unary<webhooksWebhookDeliveryQueryServiceApi.CountWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.CountWebhookDeliveriesResponse> =
      (input, done) => proxy1.countWebhookDeliveries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookDeliveryQueryServiceApi.CountWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.CountWebhookDeliveriesResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookSecretApprovalServiceApi.RejectWebhookSecretResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      webhooksWebhookSecretApprovalServiceApi.RejectWebhookSecretResponse.fromPartial({
        webhookSecret: {
          contact: req?.webhookSecret?.contact,
          webhookSecretId: (req?.webhookSecretId ?? ""),
        },
      }),
    );
  }

  /**
   * Submits a webhook secret.
   */
  async submitWebhookSecret(req: webhooksWebhookSecretApprovalServiceApi.SubmitWebhookSecretRequest): Promise<webhooksWebhookSecretApprovalServiceApi.SubmitWebhookSecretResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "SubmitWebhookSecret", req);
    this.logger.info("submit_webhook_secret", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantApprovalServiceApi.DelegateVariantApprovalRequest.fromPartial({
      context: req?.context,
      details: {
        approver: { displayName: (req?.webhookSecret?.holder?.displayName ?? "") },
      },
      variant: {
        audit: { etag: (req?.webhookSecret?.audit?.etag ?? "") },
        owner: { email: (req?.webhookSecret?.contact?.email ?? "") },
      },
    });
    const invoke1: Unary<experimentsVariantApprovalServiceApi.DelegateVariantApprovalRequest, experimentsVariantApprovalServiceApi.DelegateVariantApprovalResponse> =
      (input, done) => this.experimentsVariantApprovalClient.delegateVariantApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsVariantApprovalServiceApi.DelegateVariantApprovalRequest, experimentsVariantApprovalServiceApi.DelegateVariantApprovalResponse>(invoke1, request1);
    const request2 = webhooksWebhookEndpointApprovalServiceApi.SubmitWebhookEndpointRequest.fromPartial({
      context: req?.context,
      webhookEndpoint: { audit: { createdAt: reply1?.variant?.audit?.createdAt } },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<webhooksWebhookEndpointApprovalServiceApi.SubmitWebhookEndpointRequest, webhooksWebhookEndpointApprovalServiceApi.SubmitWebhookEndpointResponse> =
      (input, done) => this.webhooksWebhookEndpointApprovalClient.submitWebhookEndpoint(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webhooksWebhookEndpointApprovalServiceApi.SubmitWebhookEndpointRequest, webhooksWebhookEndpointApprovalServiceApi.SubmitWebhookEndpointResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookSecretApprovalServiceApi.SubmitWebhookSecretResponse.fromPartial({ outcome: { effectiveAt: reply1?.outcome?.effectiveAt } }),
      webhooksWebhookSecretApprovalServiceApi.SubmitWebhookSecretResponse.fromPartial({
        webhookSecret: {
          audit: {
            createdAt: reply2?.webhookEndpoint?.audit?.createdAt,
            etag: (reply2?.webhookEndpoint?.audit?.etag ?? ""),
          },
        },
      }),
      webhooksWebhookSecretApprovalServiceApi.SubmitWebhookSecretResponse.fromPartial({
        webhookSecret: {
          available: req?.webhookSecret?.available,
          webhookSecretId: (req?.webhookSecretId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for WebhookSecretApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class WebhookSecretApprovalHandler {
  constructor(@inject(WebhookSecretApprovalWorkflow) private readonly workflow: WebhookSecretApprovalWorkflow) {}

  /**
   * Approves a webhook secret.
   */
  approveWebhookSecret = unary<webhooksWebhookSecretApprovalServiceApi.ApproveWebhookSecretRequest, webhooksWebhookSecretApprovalServiceApi.ApproveWebhookSecretResponse>(
    (request) => this.workflow.approveWebhookSecret(request),
  );

  /**
   * Delegates a webhook secret.
   */
  delegateWebhookSecretApproval = unary<webhooksWebhookSecretApprovalServiceApi.DelegateWebhookSecretApprovalRequest, webhooksWebhookSecretApprovalServiceApi.DelegateWebhookSecretApprovalResponse>(
    (request) => this.workflow.delegateWebhookSecretApproval(request),
  );

  /**
   * Escalates a webhook secret.
   */
  escalateWebhookSecret = (call: ServerUnaryCall<webhooksWebhookSecretApprovalServiceApi.EscalateWebhookSecretRequest, webhooksWebhookSecretApprovalServiceApi.EscalateWebhookSecretResponse>, done: sendUnaryData<webhooksWebhookSecretApprovalServiceApi.EscalateWebhookSecretResponse>): void => {
    void this.workflow.escalateWebhookSecret(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a webhook secret.
   */
  getWebhookSecretApprovalStatus = unary<webhooksWebhookSecretApprovalServiceApi.GetWebhookSecretApprovalStatusRequest, webhooksWebhookSecretApprovalServiceApi.GetWebhookSecretApprovalStatusResponse>(
    (request) => this.workflow.getWebhookSecretApprovalStatus(request),
  );

  /**
   * Recalls a webhook secret.
   */
  recallWebhookSecret = unary<webhooksWebhookSecretApprovalServiceApi.RecallWebhookSecretRequest, webhooksWebhookSecretApprovalServiceApi.RecallWebhookSecretResponse>(
    (request) => this.workflow.recallWebhookSecret(request),
  );

  /**
   * Rejects a webhook secret.
   */
  rejectWebhookSecret = (call: ServerUnaryCall<webhooksWebhookSecretApprovalServiceApi.RejectWebhookSecretRequest, webhooksWebhookSecretApprovalServiceApi.RejectWebhookSecretResponse>, done: sendUnaryData<webhooksWebhookSecretApprovalServiceApi.RejectWebhookSecretResponse>): void => {
    void this.workflow.rejectWebhookSecret(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Submits a webhook secret.
   */
  submitWebhookSecret = unary<webhooksWebhookSecretApprovalServiceApi.SubmitWebhookSecretRequest, webhooksWebhookSecretApprovalServiceApi.SubmitWebhookSecretResponse>(
    (request) => this.workflow.submitWebhookSecret(request),
  );
}

export function implementation(handler: WebhookSecretApprovalHandler): webhooksWebhookSecretApprovalServiceApi.WebhookSecretApprovalServiceServer {
  return {
    approveWebhookSecret: handler.approveWebhookSecret,
    delegateWebhookSecretApproval: handler.delegateWebhookSecretApproval,
    escalateWebhookSecret: handler.escalateWebhookSecret,
    getWebhookSecretApprovalStatus: handler.getWebhookSecretApprovalStatus,
    recallWebhookSecret: handler.recallWebhookSecret,
    rejectWebhookSecret: handler.rejectWebhookSecret,
    submitWebhookSecret: handler.submitWebhookSecret,
  };
}
