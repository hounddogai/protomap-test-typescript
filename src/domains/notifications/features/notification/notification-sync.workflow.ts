/**
 * Keeps notifications in step with the systems of record in other regions. Remote work stays behind typed client
 * ports.
 */

import * as featureflagsFeatureFlagQueryServiceApi from "../../../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as notificationsNotificationSyncServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_sync_service.js";
import * as notificationsNotificationTemplateCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_calculation_service.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, metadataFor, retry, type Unary } from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toNotificationRecord } from "../../data/records.js";
import { NotificationsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate notification operations and persist audit data.
 */
@injectable()
export class NotificationSyncWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.featureflags.v1.FeatureFlagQueryService") private readonly featureflagsFeatureFlagQueryClient: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateCalculationService") private readonly notificationsNotificationTemplateCalculationClient: notificationsNotificationTemplateCalculationServiceApi.NotificationTemplateCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Returns a notification.
   */
  async getNotificationSyncState(req: notificationsNotificationSyncServiceApi.GetNotificationSyncStateRequest): Promise<notificationsNotificationSyncServiceApi.GetNotificationSyncStateResponse> {
    validateContext(req.context);
    if (!req.notificationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetNotificationSyncState", req);
    this.logger.info("get_notification_sync_state", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsNotificationSyncServiceApi.GetNotificationSyncStateResponse.fromPartial({ notification: { notificationId: (req?.notificationId ?? "") } });
  }

  /**
   * Lists notifications a page at a time.
   */
  async listNotificationConflicts(req: notificationsNotificationSyncServiceApi.ListNotificationConflictsRequest): Promise<notificationsNotificationSyncServiceApi.ListNotificationConflictsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListNotificationConflicts", req);
    this.logger.info("list_notification_conflicts", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsNotificationSyncServiceApi.ListNotificationConflictsResponse.fromPartial({});
  }

  /**
   * Pulls a notification.
   */
  async pullNotifications(req: notificationsNotificationSyncServiceApi.PullNotificationsRequest): Promise<notificationsNotificationSyncServiceApi.PullNotificationsResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "PullNotifications", req);
    this.logger.info("pull_notifications", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationSyncServiceApi.PullNotificationsResponse.fromPartial({
      notification: {
        notificationId: (req?.notificationId ?? ""),
        requester: req?.notification?.requester,
      },
    });
  }

  /**
   * Pushs a notification.
   */
  async pushNotification(req: notificationsNotificationSyncServiceApi.PushNotificationRequest): Promise<notificationsNotificationSyncServiceApi.PushNotificationResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "PushNotification", req);
    this.logger.info("push_notification", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationSyncServiceApi.PushNotificationResponse.fromPartial({
      notification: {
        notificationId: (req?.notificationId ?? ""),
        requester: req?.notification?.requester,
      },
    });
  }

  /**
   * Reconciles a notification.
   */
  async reconcileNotifications(req: notificationsNotificationSyncServiceApi.ReconcileNotificationsRequest): Promise<notificationsNotificationSyncServiceApi.ReconcileNotificationsResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "ReconcileNotifications", req);
    this.logger.info("reconcile_notifications", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.notification?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.notification?.assignee?.userId ?? ""),
      },
    });
    const invoke1: Unary<featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagQueryClient.browseFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsNotificationSyncServiceApi.ReconcileNotificationsResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      notificationsNotificationSyncServiceApi.ReconcileNotificationsResponse.fromPartial({
        notification: {
          customFields: (req?.notification?.customFields ?? {}),
          notificationId: (req?.notificationId ?? ""),
        },
      }),
    );
  }

  /**
   * Resolves a notification.
   */
  async resolveNotificationConflict(req: notificationsNotificationSyncServiceApi.ResolveNotificationConflictRequest): Promise<notificationsNotificationSyncServiceApi.ResolveNotificationConflictResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "ResolveNotificationConflict", req);
    this.logger.info("resolve_notification_conflict", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_2: string | undefined;
    switch (req?.notification?.origin?.$case) {
      case "customer":
        selected1_2 = ((req?.notification?.origin?.$case === "customer" ? req?.notification?.origin.customer : undefined)?.displayName ?? "");
        break;
      default:
        selected1_2 = "";
    }
    const request1 = notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        audit: { updatedBy: (req?.notification?.audit?.updatedBy ?? "") },
        counterparty: { displayName: (selected1_2 ?? "") },
      },
    });
    const invoke1: Unary<notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesRequest, notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateCalculationClient.recalculateNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesRequest, notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsNotificationSyncServiceApi.ResolveNotificationConflictResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      notificationsNotificationSyncServiceApi.ResolveNotificationConflictResponse.fromPartial({
        notification: {
          notificationId: (req?.notificationId ?? ""),
          status: req?.notification?.status,
        },
      }),
    );
  }

  /**
   * Exchanges changes of notifications with a peer.
   */
  async streamNotificationChanges(req: notificationsNotificationSyncServiceApi.StreamNotificationChangesRequest): Promise<notificationsNotificationSyncServiceApi.StreamNotificationChangesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamNotificationChanges", req);
    this.logger.info("stream_notification_changes", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.cursor ?? "") });
    return notificationsNotificationSyncServiceApi.StreamNotificationChangesResponse.fromPartial({
      notification: {
        requester: (req?.frame?.$case === "change" ? req?.frame.change : undefined)?.requester,
      },
      sequence: ((req?.frame?.$case === "ack" ? req?.frame.ack : undefined)?.sequence ?? 0),
    });
  }

  /**
   * Syncs a notification.
   */
  async syncNotifications(req: notificationsNotificationSyncServiceApi.SyncNotificationsRequest): Promise<notificationsNotificationSyncServiceApi.SyncNotificationsResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "SyncNotifications", req);
    this.logger.info("sync_notifications", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationSyncServiceApi.SyncNotificationsResponse.fromPartial({
      notification: {
        notificationId: (req?.notificationId ?? ""),
        status: req?.notification?.status,
      },
    });
  }
}
