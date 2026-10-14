/**
 * Computes the figures of a notification, such as totals, taxes, and estimates. Remote work stays behind typed client
 * ports.
 */

import * as authorizationAccessPolicyQueryServiceApi from "../../../../../.cache/proto/acme/authorization/v1/access_policy_query_service.js";
import * as notificationsNotificationCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_calculation_service.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, metadataFor, type Unary } from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toNotificationRecord } from "../../data/records.js";
import { NotificationsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate notification operations and persist audit data.
 */
@injectable()
export class NotificationCalculationWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyQueryService") private readonly authorizationAccessPolicyQueryClient: authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a notification.
   */
  async calculateNotification(req: notificationsNotificationCalculationServiceApi.CalculateNotificationRequest): Promise<notificationsNotificationCalculationServiceApi.CalculateNotificationResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "CalculateNotification", req);
    this.logger.info("calculate_notification", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.notification?.sla?.dueAt,
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const invoke1: Unary<authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesResponse> =
      (input, done) => this.authorizationAccessPolicyQueryClient.findAccessPolicies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsNotificationCalculationServiceApi.CalculateNotificationResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      notificationsNotificationCalculationServiceApi.CalculateNotificationResponse.fromPartial({
        notification: {
          notificationId: (req?.notificationId ?? ""),
          subject: (req?.notification?.subject ?? ""),
        },
      }),
    );
  }

  /**
   * Compares a notification.
   */
  async compareNotificationOptions(req: notificationsNotificationCalculationServiceApi.CompareNotificationOptionsRequest): Promise<notificationsNotificationCalculationServiceApi.CompareNotificationOptionsResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "CompareNotificationOptions", req);
    this.logger.info("compare_notification_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationCalculationServiceApi.CompareNotificationOptionsResponse.fromPartial({
      breakdown: { currencyCode: (req?.details?.currencyCode ?? "") },
      notification: { notificationId: (req?.notificationId ?? "") },
    });
  }

  /**
   * Estimates a notification.
   */
  async estimateNotification(req: notificationsNotificationCalculationServiceApi.EstimateNotificationRequest): Promise<notificationsNotificationCalculationServiceApi.EstimateNotificationResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "EstimateNotification", req);
    this.logger.info("estimate_notification", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationCalculationServiceApi.EstimateNotificationResponse.fromPartial({
      breakdown: { currencyCode: (req?.details?.currencyCode ?? "") },
      notification: { notificationId: (req?.notificationId ?? "") },
    });
  }

  /**
   * Explains a notification.
   */
  async explainNotificationCalculation(req: notificationsNotificationCalculationServiceApi.ExplainNotificationCalculationRequest): Promise<notificationsNotificationCalculationServiceApi.ExplainNotificationCalculationResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "ExplainNotificationCalculation", req);
    this.logger.info("explain_notification_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationCalculationServiceApi.ExplainNotificationCalculationResponse.fromPartial({
      notification: {
        customFields: (req?.notification?.customFields ?? {}),
        notificationId: (req?.notificationId ?? ""),
      },
    });
  }

  /**
   * Returns a notification.
   */
  async getNotificationRates(req: notificationsNotificationCalculationServiceApi.GetNotificationRatesRequest): Promise<notificationsNotificationCalculationServiceApi.GetNotificationRatesResponse> {
    validateContext(req.context);
    if (!req.notificationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetNotificationRates", req);
    this.logger.info("get_notification_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsNotificationCalculationServiceApi.GetNotificationRatesResponse.fromPartial({ notification: { notificationId: (req?.notificationId ?? "") } });
  }

  /**
   * Quotes a notification.
   */
  async quoteNotification(req: notificationsNotificationCalculationServiceApi.QuoteNotificationRequest): Promise<notificationsNotificationCalculationServiceApi.QuoteNotificationResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "QuoteNotification", req);
    this.logger.info("quote_notification", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationCalculationServiceApi.QuoteNotificationResponse.fromPartial({
      notification: {
        assignee: req?.notification?.assignee,
        notificationId: (req?.notificationId ?? ""),
      },
    });
  }

  /**
   * Recalculates a notification.
   */
  async recalculateNotifications(req: notificationsNotificationCalculationServiceApi.RecalculateNotificationsRequest): Promise<notificationsNotificationCalculationServiceApi.RecalculateNotificationsResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "RecalculateNotifications", req);
    this.logger.info("recalculate_notifications", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationCalculationServiceApi.RecalculateNotificationsResponse.fromPartial({
      notification: {
        customFields: (req?.notification?.customFields ?? {}),
        notificationId: (req?.notificationId ?? ""),
      },
    });
  }

  /**
   * Simulates a notification.
   */
  async simulateNotification(req: notificationsNotificationCalculationServiceApi.SimulateNotificationRequest): Promise<notificationsNotificationCalculationServiceApi.SimulateNotificationResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "SimulateNotification", req);
    this.logger.info("simulate_notification", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationCalculationServiceApi.SimulateNotificationResponse.fromPartial({
      notification: {
        notificationId: (req?.notificationId ?? ""),
        status: req?.notification?.status,
      },
    });
  }
}
