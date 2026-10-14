/**
 * Checks notifications against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as notificationsNotificationNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_notification_service.js";
import * as notificationsNotificationValidationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_validation_service.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { metadataFor } from "../../../../platform/rpc.js";
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toNotificationRecord } from "../../data/records.js";
import { NotificationsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate notification operations and persist audit data.
 */
@injectable()
export class NotificationValidationWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.notifications.v1.NotificationNotificationService") private readonly notificationsNotificationNotificationClient: notificationsNotificationNotificationServiceApi.NotificationNotificationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a notification.
   */
  async checkNotificationEligibility(req: notificationsNotificationValidationServiceApi.CheckNotificationEligibilityRequest): Promise<notificationsNotificationValidationServiceApi.CheckNotificationEligibilityResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "CheckNotificationEligibility", req);
    this.logger.info("check_notification_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationValidationServiceApi.CheckNotificationEligibilityResponse.fromPartial({
      notification: {
        notificationId: (req?.notificationId ?? ""),
        requester: req?.notification?.requester,
      },
    });
  }

  /**
   * Explains a notification.
   */
  async explainNotificationDecision(req: notificationsNotificationValidationServiceApi.ExplainNotificationDecisionRequest): Promise<notificationsNotificationValidationServiceApi.ExplainNotificationDecisionResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "ExplainNotificationDecision", req);
    this.logger.info("explain_notification_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationValidationServiceApi.ExplainNotificationDecisionResponse.fromPartial({
      notification: {
        notificationId: (req?.notificationId ?? ""),
        status: req?.notification?.status,
      },
    });
  }

  /**
   * Returns a notification.
   */
  async getNotificationRules(req: notificationsNotificationValidationServiceApi.GetNotificationRulesRequest): Promise<notificationsNotificationValidationServiceApi.GetNotificationRulesResponse> {
    validateContext(req.context);
    if (!req.notificationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetNotificationRules", req);
    this.logger.info("get_notification_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsNotificationValidationServiceApi.GetNotificationRulesResponse.fromPartial({ notification: { notificationId: (req?.notificationId ?? "") } });
  }

  /**
   * Lints a notification.
   */
  async lintNotifications(req: notificationsNotificationValidationServiceApi.LintNotificationsRequest): Promise<notificationsNotificationValidationServiceApi.LintNotificationsResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "LintNotifications", req);
    this.logger.info("lint_notifications", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationValidationServiceApi.LintNotificationsResponse.fromPartial({
      notification: {
        assignee: req?.notification?.assignee,
        notificationId: (req?.notificationId ?? ""),
      },
    });
  }

  /**
   * Normalizes a notification.
   */
  async normalizeNotification(req: notificationsNotificationValidationServiceApi.NormalizeNotificationRequest): Promise<notificationsNotificationValidationServiceApi.NormalizeNotificationResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "NormalizeNotification", req);
    this.logger.info("normalize_notification", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationValidationServiceApi.NormalizeNotificationResponse.fromPartial({
      notification: {
        notificationId: (req?.notificationId ?? ""),
        subject: (req?.notification?.subject ?? ""),
      },
    });
  }

  /**
   * Previews a notification.
   */
  async previewNotification(req: notificationsNotificationValidationServiceApi.PreviewNotificationRequest): Promise<notificationsNotificationValidationServiceApi.PreviewNotificationResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "PreviewNotification", req);
    this.logger.info("preview_notification", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationValidationServiceApi.PreviewNotificationResponse.fromPartial({
      notification: {
        notificationId: (req?.notificationId ?? ""),
        requester: req?.notification?.requester,
      },
    });
  }

  /**
   * Scores a notification.
   */
  async scoreNotification(req: notificationsNotificationValidationServiceApi.ScoreNotificationRequest): Promise<notificationsNotificationValidationServiceApi.ScoreNotificationResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "ScoreNotification", req);
    this.logger.info("score_notification", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationNotificationServiceApi.StreamNotificationNoticesRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.details?.destination?.region ?? "") },
      subscriber: {
        email: (req?.notification?.requester?.email ?? ""),
        name: req?.notification?.requester?.name,
      },
    });
    const stream1 = this.notificationsNotificationNotificationClient.streamNotificationNotices(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? notificationsNotificationNotificationServiceApi.StreamNotificationNoticesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationValidationServiceApi.ScoreNotificationResponse.fromPartial({
      notification: {
        notificationId: (req?.notificationId ?? ""),
        requester: req?.notification?.requester,
      },
    });
  }

  /**
   * Validates a notification.
   */
  async validateNotification(req: notificationsNotificationValidationServiceApi.ValidateNotificationRequest): Promise<notificationsNotificationValidationServiceApi.ValidateNotificationResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "ValidateNotification", req);
    this.logger.info("validate_notification", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationValidationServiceApi.ValidateNotificationResponse.fromPartial({
      notification: {
        assignee: req?.notification?.assignee,
        notificationId: (req?.notificationId ?? ""),
      },
    });
  }
}
