/**
 * Checks delivery attempts against the rules before anything acts on them. Remote work stays behind typed client
 * ports.
 */

import * as notificationsDeliveryAttemptValidationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_validation_service.js";
import * as notificationsNotificationTemplateCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_calculation_service.js";
import * as notificationsSubscriptionApprovalServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_approval_service.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, metadataFor, type Unary } from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toDeliveryAttemptRecord } from "../../data/records.js";
import { NotificationsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate delivery attempt operations and persist audit data.
 */
@injectable()
export class DeliveryAttemptValidationWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.notifications.v1.NotificationTemplateCalculationService") private readonly notificationsNotificationTemplateCalculationClient: notificationsNotificationTemplateCalculationServiceApi.NotificationTemplateCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionApprovalService") private readonly notificationsSubscriptionApprovalClient: notificationsSubscriptionApprovalServiceApi.SubscriptionApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a delivery attempt.
   */
  async checkDeliveryAttemptEligibility(req: notificationsDeliveryAttemptValidationServiceApi.CheckDeliveryAttemptEligibilityRequest): Promise<notificationsDeliveryAttemptValidationServiceApi.CheckDeliveryAttemptEligibilityResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "CheckDeliveryAttemptEligibility", req);
    this.logger.info("check_delivery_attempt_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.deliveryAttempt?.measurements ?? []).map(async (item) => {
      const request1 = notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsRequest.fromPartial({
        context: req?.context,
        filter: {
          createdAfter: item?.observedAt,
          labels: Object.fromEntries(Object.entries((req?.deliveryAttempt?.attributes ?? {}))),
          ownerId: (req?.deliveryAttempt?.deliveryAttemptId ?? ""),
        },
      });
      const invoke1: Unary<notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsRequest, notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsResponse> =
        (input, done) => this.notificationsSubscriptionApprovalClient.listPendingSubscriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsRequest, notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptValidationServiceApi.CheckDeliveryAttemptEligibilityResponse.fromPartial({
      deliveryAttempt: {
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
        kind: (req?.deliveryAttempt?.kind ?? ""),
      },
    });
  }

  /**
   * Explains a delivery attempt.
   */
  async explainDeliveryAttemptDecision(req: notificationsDeliveryAttemptValidationServiceApi.ExplainDeliveryAttemptDecisionRequest): Promise<notificationsDeliveryAttemptValidationServiceApi.ExplainDeliveryAttemptDecisionResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "ExplainDeliveryAttemptDecision", req);
    this.logger.info("explain_delivery_attempt_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptValidationServiceApi.ExplainDeliveryAttemptDecisionResponse.fromPartial({
      deliveryAttempt: {
        correlationId: (req?.deliveryAttempt?.correlationId ?? ""),
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
      },
    });
  }

  /**
   * Returns a delivery attempt.
   */
  async getDeliveryAttemptRules(req: notificationsDeliveryAttemptValidationServiceApi.GetDeliveryAttemptRulesRequest): Promise<notificationsDeliveryAttemptValidationServiceApi.GetDeliveryAttemptRulesResponse> {
    validateContext(req.context);
    if (!req.deliveryAttemptId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "delivery_attempt_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetDeliveryAttemptRules", req);
    this.logger.info("get_delivery_attempt_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsDeliveryAttemptValidationServiceApi.GetDeliveryAttemptRulesResponse.fromPartial({
      deliveryAttempt: { deliveryAttemptId: (req?.deliveryAttemptId ?? "") },
    });
  }

  /**
   * Lints a delivery attempt.
   */
  async lintDeliveryAttempts(req: notificationsDeliveryAttemptValidationServiceApi.LintDeliveryAttemptsRequest): Promise<notificationsDeliveryAttemptValidationServiceApi.LintDeliveryAttemptsResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "LintDeliveryAttempts", req);
    this.logger.info("lint_delivery_attempts", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptValidationServiceApi.LintDeliveryAttemptsResponse.fromPartial({
      deliveryAttempt: {
        attributes: (req?.deliveryAttempt?.attributes ?? {}),
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
      },
    });
  }

  /**
   * Normalizes a delivery attempt.
   */
  async normalizeDeliveryAttempt(req: notificationsDeliveryAttemptValidationServiceApi.NormalizeDeliveryAttemptRequest): Promise<notificationsDeliveryAttemptValidationServiceApi.NormalizeDeliveryAttemptResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "NormalizeDeliveryAttempt", req);
    this.logger.info("normalize_delivery_attempt", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptValidationServiceApi.NormalizeDeliveryAttemptResponse.fromPartial({
      deliveryAttempt: {
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
        occurredAt: req?.deliveryAttempt?.occurredAt,
      },
    });
  }

  /**
   * Previews a delivery attempt.
   */
  async previewDeliveryAttempt(req: notificationsDeliveryAttemptValidationServiceApi.PreviewDeliveryAttemptRequest): Promise<notificationsDeliveryAttemptValidationServiceApi.PreviewDeliveryAttemptResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "PreviewDeliveryAttempt", req);
    this.logger.info("preview_delivery_attempt", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateCalculationServiceApi.GetNotificationTemplateRatesRequest.fromPartial({
      context: req?.context,
      notificationTemplateId: (req?.deliveryAttempt?.subject?.notificationTemplateId ?? ""),
    });
    const invoke1: Unary<notificationsNotificationTemplateCalculationServiceApi.GetNotificationTemplateRatesRequest, notificationsNotificationTemplateCalculationServiceApi.GetNotificationTemplateRatesResponse> =
      (input, done) => this.notificationsNotificationTemplateCalculationClient.getNotificationTemplateRates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsDeliveryAttemptValidationServiceApi.PreviewDeliveryAttemptResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      notificationsDeliveryAttemptValidationServiceApi.PreviewDeliveryAttemptResponse.fromPartial({
        deliveryAttempt: {
          deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
          occurredAt: req?.deliveryAttempt?.occurredAt,
        },
      }),
    );
  }

  /**
   * Scores a delivery attempt.
   */
  async scoreDeliveryAttempt(req: notificationsDeliveryAttemptValidationServiceApi.ScoreDeliveryAttemptRequest): Promise<notificationsDeliveryAttemptValidationServiceApi.ScoreDeliveryAttemptResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "ScoreDeliveryAttempt", req);
    this.logger.info("score_delivery_attempt", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptValidationServiceApi.ScoreDeliveryAttemptResponse.fromPartial({
      deliveryAttempt: {
        attributes: (req?.deliveryAttempt?.attributes ?? {}),
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
      },
    });
  }

  /**
   * Validates a delivery attempt.
   */
  async validateDeliveryAttempt(req: notificationsDeliveryAttemptValidationServiceApi.ValidateDeliveryAttemptRequest): Promise<notificationsDeliveryAttemptValidationServiceApi.ValidateDeliveryAttemptResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "ValidateDeliveryAttempt", req);
    this.logger.info("validate_delivery_attempt", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptValidationServiceApi.ValidateDeliveryAttemptResponse.fromPartial({
      deliveryAttempt: {
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
        source: (req?.deliveryAttempt?.source ?? ""),
      },
    });
  }
}
