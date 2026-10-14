/**
 * Manages notifications: creates, reads, changes, and lists them. Remote work stays behind typed client ports.
 */

import * as notificationsNotificationCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_calculation_service.js";
import * as notificationsNotificationHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import * as notificationsNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_service.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { clientStream, unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { GrpcAdapter, call, metadataFor, type RequestPort, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toNotificationRecord } from "../data/records.js";
import { NotificationsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate notification operations and persist audit data.
 */
@injectable()
export class NotificationWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.notifications.v1.NotificationCalculationService") private readonly notificationsNotificationCalculationClient: notificationsNotificationCalculationServiceApi.NotificationCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationHistoryService") private readonly notificationsNotificationHistoryClient: notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Takes a stream of notifications and answers once at the end.
   */
  async batchCreateNotifications(req: notificationsNotificationServiceApi.BatchCreateNotificationsRequest): Promise<notificationsNotificationServiceApi.BatchCreateNotificationsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchCreateNotifications", req);
    this.logger.info("batch_create_notifications", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.etag ?? "") });
    return notificationsNotificationServiceApi.BatchCreateNotificationsResponse.fromPartial({});
  }

  /**
   * Returns several notifications at once.
   */
  async batchGetNotifications(req: notificationsNotificationServiceApi.BatchGetNotificationsRequest): Promise<notificationsNotificationServiceApi.BatchGetNotificationsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchGetNotifications", req);
    this.logger.info("batch_get_notifications", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsNotificationServiceApi.BatchGetNotificationsResponse.fromPartial({});
  }

  /**
   * Creates a notification.
   */
  async cloneNotification(req: notificationsNotificationServiceApi.CloneNotificationRequest): Promise<notificationsNotificationServiceApi.CloneNotificationResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "CloneNotification", req);
    this.logger.info("clone_notification", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return notificationsNotificationServiceApi.CloneNotificationResponse.fromPartial({
      notification: {
        customFields: (req?.notification?.customFields ?? {}),
        notificationId: (req?.notification?.notificationId ?? ""),
      },
    });
  }

  /**
   * Creates a notification.
   */
  async createNotification(req: notificationsNotificationServiceApi.CreateNotificationRequest): Promise<notificationsNotificationServiceApi.CreateNotificationResponse> {
    validateContext(req.context);
    if (req.notification) {
      await this.repository.save(toNotificationRecord(req.context.tenantId, req.notification));
    }
    await this.repository.record(req.context.tenantId, "CreateNotification", req);
    this.logger.info("create_notification", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return notificationsNotificationServiceApi.CreateNotificationResponse.fromPartial({
      notification: {
        customFields: (req?.notification?.customFields ?? {}),
        requester: req?.notification?.requester,
      },
    });
  }

  /**
   * Returns a notification.
   */
  async getNotification(req: notificationsNotificationServiceApi.GetNotificationRequest): Promise<notificationsNotificationServiceApi.GetNotificationResponse> {
    validateContext(req.context);
    if (!req.notificationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetNotification", req);
    this.logger.info("get_notification", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsNotificationServiceApi.GetNotificationResponse.fromPartial({ notification: { notificationId: (req?.notificationId ?? "") } });
  }

  /**
   * Lists notifications a page at a time.
   */
  async listNotifications(req: notificationsNotificationServiceApi.ListNotificationsRequest): Promise<notificationsNotificationServiceApi.ListNotificationsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListNotifications", req);
    this.logger.info("list_notifications", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationHistoryServiceApi.RecordNotificationVersionRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: { userId: (req?.context?.actor?.userId ?? "") },
        audit: { updatedAt: req?.filter?.createdAfter },
        origin: { $case: "externalReference", externalReference: (req?.filter?.ownerId ?? "") },
        requester: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const client1 = this.clients.get<notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient>("acme.notifications.v1.NotificationHistoryService");
    const invoke1: Unary<notificationsNotificationHistoryServiceApi.RecordNotificationVersionRequest, notificationsNotificationHistoryServiceApi.RecordNotificationVersionResponse> =
      (input, done) => client1.recordNotificationVersion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationHistoryServiceApi.RecordNotificationVersionRequest, notificationsNotificationHistoryServiceApi.RecordNotificationVersionResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsNotificationServiceApi.ListNotificationsResponse.fromPartial({
      notifications: [{
        assignee: { email: (reply1?.notification?.assignee?.email ?? "") },
        priority: (reply1?.notification?.priority ?? 0),
      }],
    });
  }

  /**
   * Lists notifications a page at a time.
   */
  async searchNotifications(req: notificationsNotificationServiceApi.SearchNotificationsRequest): Promise<notificationsNotificationServiceApi.SearchNotificationsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SearchNotifications", req);
    this.logger.info("search_notifications", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationCalculationServiceApi.CompareNotificationOptionsRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const invoke1: Unary<notificationsNotificationCalculationServiceApi.CompareNotificationOptionsRequest, notificationsNotificationCalculationServiceApi.CompareNotificationOptionsResponse> =
      (input, done) => this.notificationsNotificationCalculationClient.compareNotificationOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<notificationsNotificationCalculationServiceApi.CompareNotificationOptionsRequest, notificationsNotificationCalculationServiceApi.CompareNotificationOptionsResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsNotificationServiceApi.SearchNotificationsResponse.fromPartial({
      notifications: [{
        audit: { etag: (reply1?.notification?.audit?.etag ?? "") },
        requester: { phone: (reply1?.notification?.requester?.phone ?? "") },
      }],
    });
  }
}

/**
 * The gRPC boundary for NotificationService; workflows own validation and database transactions.
 */
@injectable()
export class NotificationHandler {
  constructor(@inject(NotificationWorkflow) private readonly workflow: NotificationWorkflow) {}

  /**
   * Takes a stream of notifications and answers once at the end.
   */
  batchCreateNotifications = clientStream<notificationsNotificationServiceApi.BatchCreateNotificationsRequest, notificationsNotificationServiceApi.BatchCreateNotificationsResponse>(
    (request) => this.workflow.batchCreateNotifications(request), () => notificationsNotificationServiceApi.BatchCreateNotificationsResponse.fromPartial({}),
  );

  /**
   * Returns several notifications at once.
   */
  batchGetNotifications = unary<notificationsNotificationServiceApi.BatchGetNotificationsRequest, notificationsNotificationServiceApi.BatchGetNotificationsResponse>(
    (request) => this.workflow.batchGetNotifications(request),
  );

  /**
   * Creates a notification.
   */
  cloneNotification = (call: ServerUnaryCall<notificationsNotificationServiceApi.CloneNotificationRequest, notificationsNotificationServiceApi.CloneNotificationResponse>, done: sendUnaryData<notificationsNotificationServiceApi.CloneNotificationResponse>): void => {
    void this.workflow.cloneNotification(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Creates a notification.
   */
  createNotification = unary<notificationsNotificationServiceApi.CreateNotificationRequest, notificationsNotificationServiceApi.CreateNotificationResponse>(
    (request) => this.workflow.createNotification(request),
  );

  /**
   * Returns a notification.
   */
  getNotification = unary<notificationsNotificationServiceApi.GetNotificationRequest, notificationsNotificationServiceApi.GetNotificationResponse>(
    (request) => this.workflow.getNotification(request),
  );

  /**
   * Lists notifications a page at a time.
   */
  listNotifications = (call: ServerUnaryCall<notificationsNotificationServiceApi.ListNotificationsRequest, notificationsNotificationServiceApi.ListNotificationsResponse>, done: sendUnaryData<notificationsNotificationServiceApi.ListNotificationsResponse>): void => {
    void this.workflow.listNotifications(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists notifications a page at a time.
   */
  searchNotifications = unary<notificationsNotificationServiceApi.SearchNotificationsRequest, notificationsNotificationServiceApi.SearchNotificationsResponse>(
    (request) => this.workflow.searchNotifications(request),
  );
}

export function implementation(handler: NotificationHandler): notificationsNotificationServiceApi.NotificationServiceServer {
  return {
    batchCreateNotifications: handler.batchCreateNotifications,
    batchGetNotifications: handler.batchGetNotifications,
    cloneNotification: handler.cloneNotification,
    createNotification: handler.createNotification,
    getNotification: handler.getNotification,
    listNotifications: handler.listNotifications,
    searchNotifications: handler.searchNotifications,
  };
}
