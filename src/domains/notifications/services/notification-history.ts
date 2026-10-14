/**
 * Keeps every version of a notification and restores earlier ones. Remote work stays behind typed client ports.
 */

import * as notificationsNotificationHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import * as notificationsSubscriptionCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_calculation_service.js";
import * as notificationsSubscriptionWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_workflow_service.js";
import * as venuesVenueQueryServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_query_service.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, metadataFor, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toNotificationRecord } from "../data/records.js";
import { NotificationsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate notification operations and persist audit data.
 */
@injectable()
export class NotificationHistoryWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.notifications.v1.SubscriptionCalculationService") private readonly notificationsSubscriptionCalculationClient: notificationsSubscriptionCalculationServiceApi.SubscriptionCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionWorkflowService") private readonly notificationsSubscriptionWorkflowClient: notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient,
    @inject("grpc:acme.venues.v1.VenueQueryService") private readonly venuesVenueQueryClient: venuesVenueQueryServiceApi.VenueQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Annotates a notification.
   */
  async annotateNotificationVersion(req: notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest): Promise<notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "AnnotateNotificationVersion", req);
    this.logger.info("annotate_notification_version", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionResponse.fromPartial({
      notification: {
        notificationId: (req?.notificationId ?? ""),
        status: req?.notification?.status,
      },
    });
  }

  /**
   * Compares a notification.
   */
  async compareNotificationVersions(req: notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest): Promise<notificationsNotificationHistoryServiceApi.CompareNotificationVersionsResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "CompareNotificationVersions", req);
    this.logger.info("compare_notification_versions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.notification?.comments ?? []).map(async (item) => {
      const request1 = notificationsSubscriptionCalculationServiceApi.CompareSubscriptionOptionsRequest.fromPartial({
        context: req?.context,
        subscription: {
          audit: {
            createdAt: item?.createdAt,
            createdBy: (req?.notification?.audit?.createdBy ?? ""),
          },
          owner: { email: (item?.authorEmail ?? "") },
        },
      });
      const invoke1: Unary<notificationsSubscriptionCalculationServiceApi.CompareSubscriptionOptionsRequest, notificationsSubscriptionCalculationServiceApi.CompareSubscriptionOptionsResponse> =
        (input, done) => this.notificationsSubscriptionCalculationClient.compareSubscriptionOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<notificationsSubscriptionCalculationServiceApi.CompareSubscriptionOptionsRequest, notificationsSubscriptionCalculationServiceApi.CompareSubscriptionOptionsResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? notificationsSubscriptionCalculationServiceApi.CompareSubscriptionOptionsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationHistoryServiceApi.CompareNotificationVersionsResponse.fromPartial({
      notification: {
        assignee: req?.notification?.assignee,
        notificationId: (req?.notificationId ?? ""),
      },
    });
  }

  /**
   * Returns a notification.
   */
  async getNotificationVersion(req: notificationsNotificationHistoryServiceApi.GetNotificationVersionRequest): Promise<notificationsNotificationHistoryServiceApi.GetNotificationVersionResponse> {
    validateContext(req.context);
    if (!req.notificationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetNotificationVersion", req);
    this.logger.info("get_notification_version", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = venuesVenueQueryServiceApi.FindVenuesRequest.fromPartial({
      context: req?.context,
      filter: { ownerId: (req?.context?.actor?.userId ?? "") },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<venuesVenueQueryServiceApi.FindVenuesRequest, venuesVenueQueryServiceApi.FindVenuesResponse> =
      (input, done) => this.venuesVenueQueryClient.findVenues(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<venuesVenueQueryServiceApi.FindVenuesRequest, venuesVenueQueryServiceApi.FindVenuesResponse>(invoke1, spread1);
    return mergeResponses(
      notificationsNotificationHistoryServiceApi.GetNotificationVersionResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      notificationsNotificationHistoryServiceApi.GetNotificationVersionResponse.fromPartial({ notification: { notificationId: (req?.notificationId ?? "") } }),
    );
  }

  /**
   * Lists notifications a page at a time.
   */
  async listNotificationVersions(req: notificationsNotificationHistoryServiceApi.ListNotificationVersionsRequest): Promise<notificationsNotificationHistoryServiceApi.ListNotificationVersionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListNotificationVersions", req);
    this.logger.info("list_notification_versions", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsNotificationHistoryServiceApi.ListNotificationVersionsResponse.fromPartial({});
  }

  /**
   * Deletes a notification.
   */
  async pruneNotificationVersions(req: notificationsNotificationHistoryServiceApi.PruneNotificationVersionsRequest): Promise<notificationsNotificationHistoryServiceApi.PruneNotificationVersionsResponse> {
    validateContext(req.context);
    if (!req.notificationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_id is required");
    }
    await this.repository.record(req.context.tenantId, "PruneNotificationVersions", req);
    this.logger.info("prune_notification_versions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowRequest.fromPartial({
      context: input1?.context,
      subscription: {
        action: { $case: "block", block: { reason: (input1?.reason ?? "") } },
        owner: { email: (input1?.context?.actor?.email ?? "") },
      },
    });
    const invoke1: Unary<notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowResponse> =
      (input, done) => this.notificationsSubscriptionWorkflowClient.pauseSubscriptionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.etag ?? "") });
    return notificationsNotificationHistoryServiceApi.PruneNotificationVersionsResponse.fromPartial({
      effectiveAt: reply1?.outcome?.effectiveAt,
      result: { details: (reply1?.result?.details ?? {}) },
    });
  }

  /**
   * Records a notification.
   */
  async recordNotificationVersion(req: notificationsNotificationHistoryServiceApi.RecordNotificationVersionRequest): Promise<notificationsNotificationHistoryServiceApi.RecordNotificationVersionResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "RecordNotificationVersion", req);
    this.logger.info("record_notification_version", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationHistoryServiceApi.RecordNotificationVersionResponse.fromPartial({
      notification: {
        notificationId: (req?.notificationId ?? ""),
        priority: (req?.notification?.priority ?? 0),
      },
    });
  }

  /**
   * Reverts a notification.
   */
  async revertNotification(req: notificationsNotificationHistoryServiceApi.RevertNotificationRequest): Promise<notificationsNotificationHistoryServiceApi.RevertNotificationResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "RevertNotification", req);
    this.logger.info("revert_notification", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationHistoryServiceApi.RevertNotificationResponse.fromPartial({
      notification: {
        notificationId: (req?.notificationId ?? ""),
        priority: (req?.notification?.priority ?? 0),
      },
    });
  }
}

/**
 * The gRPC boundary for NotificationHistoryService; workflows own validation and database transactions.
 */
@injectable()
export class NotificationHistoryHandler {
  constructor(@inject(NotificationHistoryWorkflow) private readonly workflow: NotificationHistoryWorkflow) {}

  /**
   * Annotates a notification.
   */
  annotateNotificationVersion = unary<notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest, notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionResponse>(
    (request) => this.workflow.annotateNotificationVersion(request),
  );

  /**
   * Compares a notification.
   */
  compareNotificationVersions = unary<notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest, notificationsNotificationHistoryServiceApi.CompareNotificationVersionsResponse>(
    (request) => this.workflow.compareNotificationVersions(request),
  );

  /**
   * Returns a notification.
   */
  getNotificationVersion = (call: ServerUnaryCall<notificationsNotificationHistoryServiceApi.GetNotificationVersionRequest, notificationsNotificationHistoryServiceApi.GetNotificationVersionResponse>, done: sendUnaryData<notificationsNotificationHistoryServiceApi.GetNotificationVersionResponse>): void => {
    void this.workflow.getNotificationVersion(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists notifications a page at a time.
   */
  listNotificationVersions = unary<notificationsNotificationHistoryServiceApi.ListNotificationVersionsRequest, notificationsNotificationHistoryServiceApi.ListNotificationVersionsResponse>(
    (request) => this.workflow.listNotificationVersions(request),
  );

  /**
   * Deletes a notification.
   */
  pruneNotificationVersions = unary<notificationsNotificationHistoryServiceApi.PruneNotificationVersionsRequest, notificationsNotificationHistoryServiceApi.PruneNotificationVersionsResponse>(
    (request) => this.workflow.pruneNotificationVersions(request),
  );

  /**
   * Records a notification.
   */
  recordNotificationVersion = (call: ServerUnaryCall<notificationsNotificationHistoryServiceApi.RecordNotificationVersionRequest, notificationsNotificationHistoryServiceApi.RecordNotificationVersionResponse>, done: sendUnaryData<notificationsNotificationHistoryServiceApi.RecordNotificationVersionResponse>): void => {
    void this.workflow.recordNotificationVersion(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Reverts a notification.
   */
  revertNotification = unary<notificationsNotificationHistoryServiceApi.RevertNotificationRequest, notificationsNotificationHistoryServiceApi.RevertNotificationResponse>(
    (request) => this.workflow.revertNotification(request),
  );
}

export function implementation(handler: NotificationHistoryHandler): notificationsNotificationHistoryServiceApi.NotificationHistoryServiceServer {
  return {
    annotateNotificationVersion: handler.annotateNotificationVersion,
    compareNotificationVersions: handler.compareNotificationVersions,
    getNotificationVersion: handler.getNotificationVersion,
    listNotificationVersions: handler.listNotificationVersions,
    pruneNotificationVersions: handler.pruneNotificationVersions,
    recordNotificationVersion: handler.recordNotificationVersion,
    revertNotification: handler.revertNotification,
  };
}
