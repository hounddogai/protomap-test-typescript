/**
 * Computes the figures of a delivery attempt, such as totals, taxes, and estimates. Remote work stays behind typed
 * client ports.
 */

import * as authorizationAccessPolicyServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_service.js";
import * as notificationsDeliveryAttemptCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_calculation_service.js";
import * as notificationsSubscriptionApprovalServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_approval_service.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, metadataFor, type Unary } from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toDeliveryAttemptRecord } from "../data/records.js";
import { NotificationsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate delivery attempt operations and persist audit data.
 */
@injectable()
export class DeliveryAttemptCalculationWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyService") private readonly authorizationAccessPolicyClient: authorizationAccessPolicyServiceApi.AccessPolicyServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionApprovalService") private readonly notificationsSubscriptionApprovalClient: notificationsSubscriptionApprovalServiceApi.SubscriptionApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a delivery attempt.
   */
  async calculateDeliveryAttempt(req: notificationsDeliveryAttemptCalculationServiceApi.CalculateDeliveryAttemptRequest): Promise<notificationsDeliveryAttemptCalculationServiceApi.CalculateDeliveryAttemptResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "CalculateDeliveryAttempt", req);
    this.logger.info("calculate_delivery_attempt", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptCalculationServiceApi.CalculateDeliveryAttemptResponse.fromPartial({
      deliveryAttempt: {
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
        subject: req?.deliveryAttempt?.subject,
      },
    });
  }

  /**
   * Estimates a delivery attempt.
   */
  async estimateDeliveryAttempt(req: notificationsDeliveryAttemptCalculationServiceApi.EstimateDeliveryAttemptRequest): Promise<notificationsDeliveryAttemptCalculationServiceApi.EstimateDeliveryAttemptResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "EstimateDeliveryAttempt", req);
    this.logger.info("estimate_delivery_attempt", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = authorizationAccessPolicyServiceApi.WatchAccessPoliciesRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.details?.destination?.region ?? "") },
      subscriber: { email: (req?.context?.actor?.email ?? "") },
    });
    const stream1 = this.authorizationAccessPolicyClient.watchAccessPolicies(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? authorizationAccessPolicyServiceApi.WatchAccessPoliciesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptCalculationServiceApi.EstimateDeliveryAttemptResponse.fromPartial({
      deliveryAttempt: {
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
        subject: req?.deliveryAttempt?.subject,
      },
    });
  }

  /**
   * Explains a delivery attempt.
   */
  async explainDeliveryAttemptCalculation(req: notificationsDeliveryAttemptCalculationServiceApi.ExplainDeliveryAttemptCalculationRequest): Promise<notificationsDeliveryAttemptCalculationServiceApi.ExplainDeliveryAttemptCalculationResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "ExplainDeliveryAttemptCalculation", req);
    this.logger.info("explain_delivery_attempt_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptCalculationServiceApi.ExplainDeliveryAttemptCalculationResponse.fromPartial({
      deliveryAttempt: {
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
        source: (req?.deliveryAttempt?.source ?? ""),
      },
    });
  }

  /**
   * Returns a delivery attempt.
   */
  async getDeliveryAttemptRates(req: notificationsDeliveryAttemptCalculationServiceApi.GetDeliveryAttemptRatesRequest): Promise<notificationsDeliveryAttemptCalculationServiceApi.GetDeliveryAttemptRatesResponse> {
    validateContext(req.context);
    if (!req.deliveryAttemptId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "delivery_attempt_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetDeliveryAttemptRates", req);
    this.logger.info("get_delivery_attempt_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsDeliveryAttemptCalculationServiceApi.GetDeliveryAttemptRatesResponse.fromPartial({
      deliveryAttempt: { deliveryAttemptId: (req?.deliveryAttemptId ?? "") },
    });
  }

  /**
   * Quotes a delivery attempt.
   */
  async quoteDeliveryAttempt(req: notificationsDeliveryAttemptCalculationServiceApi.QuoteDeliveryAttemptRequest): Promise<notificationsDeliveryAttemptCalculationServiceApi.QuoteDeliveryAttemptResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "QuoteDeliveryAttempt", req);
    this.logger.info("quote_delivery_attempt", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.deliveryAttempt?.measurements ?? []).map(async (item) => {
      const request1 = notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalRequest.fromPartial({
        context: req?.context,
        subscription: {
          audit: { updatedAt: item?.observedAt },
          action: { $case: "block", block: { reason: (req?.reason ?? "") } },
          owner: { displayName: (req?.deliveryAttempt?.subject?.displayName ?? "") },
        },
      });
      const invoke1: Unary<notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalRequest, notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalResponse> =
        (input, done) => this.notificationsSubscriptionApprovalClient.delegateSubscriptionApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalRequest, notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.details?.destination?.countryCode ?? "") });
    return notificationsDeliveryAttemptCalculationServiceApi.QuoteDeliveryAttemptResponse.fromPartial({
      deliveryAttempt: {
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
        sequence: (req?.deliveryAttempt?.sequence ?? 0),
      },
    });
  }

  /**
   * Recalculates a delivery attempt.
   */
  async recalculateDeliveryAttempts(req: notificationsDeliveryAttemptCalculationServiceApi.RecalculateDeliveryAttemptsRequest): Promise<notificationsDeliveryAttemptCalculationServiceApi.RecalculateDeliveryAttemptsResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "RecalculateDeliveryAttempts", req);
    this.logger.info("recalculate_delivery_attempts", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptCalculationServiceApi.RecalculateDeliveryAttemptsResponse.fromPartial({
      deliveryAttempt: {
        correlationId: (req?.deliveryAttempt?.correlationId ?? ""),
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
      },
    });
  }

  /**
   * Simulates a delivery attempt.
   */
  async simulateDeliveryAttempt(req: notificationsDeliveryAttemptCalculationServiceApi.SimulateDeliveryAttemptRequest): Promise<notificationsDeliveryAttemptCalculationServiceApi.SimulateDeliveryAttemptResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "SimulateDeliveryAttempt", req);
    this.logger.info("simulate_delivery_attempt", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptCalculationServiceApi.SimulateDeliveryAttemptResponse.fromPartial({
      deliveryAttempt: {
        correlationId: (req?.deliveryAttempt?.correlationId ?? ""),
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
      },
    });
  }
}
