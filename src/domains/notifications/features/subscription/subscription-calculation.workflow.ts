/**
 * Computes the figures of a subscription, such as totals, taxes, and estimates. Remote work stays behind typed client
 * ports.
 */

import * as commonMoneyApi from "../../../../../.cache/proto/acme/common/v1/money.js";
import * as notificationsNotificationTemplateSyncServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_sync_service.js";
import * as notificationsSubscriptionCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_calculation_service.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, metadataFor, type Unary } from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toSubscriptionRecord } from "../../data/records.js";
import { NotificationsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate subscription operations and persist audit data.
 */
@injectable()
export class SubscriptionCalculationWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.notifications.v1.NotificationTemplateSyncService") private readonly notificationsNotificationTemplateSyncClient: notificationsNotificationTemplateSyncServiceApi.NotificationTemplateSyncServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a subscription.
   */
  async calculateSubscription(req: notificationsSubscriptionCalculationServiceApi.CalculateSubscriptionRequest): Promise<notificationsSubscriptionCalculationServiceApi.CalculateSubscriptionResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "CalculateSubscription", req);
    this.logger.info("calculate_subscription", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: commonMoneyApi.Money | undefined;
    switch (req?.subscription?.action?.$case) {
      case "discount":
        selected1_1 = (req?.subscription?.action?.$case === "discount" ? req?.subscription?.action.discount : undefined)?.amount;
        break;
      default:
        selected1_1 = undefined;
    }
    const request1 = notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        audit: { createdAt: req?.subscription?.audit?.createdAt },
        lines: [{ tax: { amount: selected1_1 } }],
      },
    });
    const invoke1: Unary<notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesRequest, notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateSyncClient.syncNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesRequest, notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsSubscriptionCalculationServiceApi.CalculateSubscriptionResponse.fromPartial({ result: { message: (reply1?.outcome?.message ?? "") } }),
      notificationsSubscriptionCalculationServiceApi.CalculateSubscriptionResponse.fromPartial({
        breakdown: { currencyCode: (req?.details?.currencyCode ?? "") },
        subscription: { subscriptionId: (req?.subscriptionId ?? "") },
      }),
    );
  }

  /**
   * Compares a subscription.
   */
  async compareSubscriptionOptions(req: notificationsSubscriptionCalculationServiceApi.CompareSubscriptionOptionsRequest): Promise<notificationsSubscriptionCalculationServiceApi.CompareSubscriptionOptionsResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "CompareSubscriptionOptions", req);
    this.logger.info("compare_subscription_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionCalculationServiceApi.CompareSubscriptionOptionsResponse.fromPartial({
      subscription: {
        description: (req?.subscription?.description ?? ""),
        subscriptionId: (req?.subscriptionId ?? ""),
      },
    });
  }

  /**
   * Estimates a subscription.
   */
  async estimateSubscription(req: notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionRequest): Promise<notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "EstimateSubscription", req);
    this.logger.info("estimate_subscription", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionResponse.fromPartial({
      subscription: {
        name: (req?.subscription?.name ?? ""),
        subscriptionId: (req?.subscriptionId ?? ""),
      },
    });
  }

  /**
   * Explains a subscription.
   */
  async explainSubscriptionCalculation(req: notificationsSubscriptionCalculationServiceApi.ExplainSubscriptionCalculationRequest): Promise<notificationsSubscriptionCalculationServiceApi.ExplainSubscriptionCalculationResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "ExplainSubscriptionCalculation", req);
    this.logger.info("explain_subscription_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionCalculationServiceApi.ExplainSubscriptionCalculationResponse.fromPartial({
      subscription: {
        name: (req?.subscription?.name ?? ""),
        subscriptionId: (req?.subscriptionId ?? ""),
      },
    });
  }

  /**
   * Returns a subscription.
   */
  async getSubscriptionRates(req: notificationsSubscriptionCalculationServiceApi.GetSubscriptionRatesRequest): Promise<notificationsSubscriptionCalculationServiceApi.GetSubscriptionRatesResponse> {
    validateContext(req.context);
    if (!req.subscriptionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "subscription_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetSubscriptionRates", req);
    this.logger.info("get_subscription_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsSubscriptionCalculationServiceApi.GetSubscriptionRatesResponse.fromPartial({ subscription: { subscriptionId: (req?.subscriptionId ?? "") } });
  }

  /**
   * Quotes a subscription.
   */
  async quoteSubscription(req: notificationsSubscriptionCalculationServiceApi.QuoteSubscriptionRequest): Promise<notificationsSubscriptionCalculationServiceApi.QuoteSubscriptionResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "QuoteSubscription", req);
    this.logger.info("quote_subscription", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionCalculationServiceApi.QuoteSubscriptionResponse.fromPartial({
      subscription: {
        parameters: (req?.subscription?.parameters ?? {}),
        subscriptionId: (req?.subscriptionId ?? ""),
      },
    });
  }

  /**
   * Simulates a subscription.
   */
  async simulateSubscription(req: notificationsSubscriptionCalculationServiceApi.SimulateSubscriptionRequest): Promise<notificationsSubscriptionCalculationServiceApi.SimulateSubscriptionResponse> {
    validateContext(req.context);
    if (req.subscription) {
      await this.repository.save(toSubscriptionRecord(req.context.tenantId, req.subscription));
    }
    await this.repository.record(req.context.tenantId, "SimulateSubscription", req);
    this.logger.info("simulate_subscription", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionCalculationServiceApi.SimulateSubscriptionResponse.fromPartial({
      subscription: {
        owner: req?.subscription?.owner,
        subscriptionId: (req?.subscriptionId ?? ""),
      },
    });
  }
}
