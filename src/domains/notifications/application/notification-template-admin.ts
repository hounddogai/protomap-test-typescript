/**
 * Operator actions on notification templates that support staff run by hand. Remote work stays behind typed client
 * ports.
 */

import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as notificationsNotificationTemplateAdminServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_admin_service.js";
import * as notificationsSubscriptionApprovalServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_approval_service.js";
import * as venuesVenueQueryServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_query_service.js";
import * as venuesVenueServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, metadataFor, operation, promised, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toNotificationTemplateRecord } from "../data/records.js";
import { NotificationsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate notification template operations and persist audit data.
 */
@injectable()
export class NotificationTemplateAdminWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptWorkflowService") private readonly notificationsDeliveryAttemptWorkflowClient: notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionApprovalService") private readonly notificationsSubscriptionApprovalClient: notificationsSubscriptionApprovalServiceApi.SubscriptionApprovalServiceClient,
    @inject("grpc:acme.venues.v1.VenueQueryService") private readonly venuesVenueQueryClient: venuesVenueQueryServiceApi.VenueQueryServiceClient,
    @inject("grpc:acme.venues.v1.VenueService") private readonly venuesVenueClient: venuesVenueServiceApi.VenueServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Archives a notification template.
   */
  async archiveNotificationTemplate(req: notificationsNotificationTemplateAdminServiceApi.ArchiveNotificationTemplateRequest): Promise<notificationsNotificationTemplateAdminServiceApi.ArchiveNotificationTemplateResponse> {
    validateContext(req.context);
    if (!req.notificationTemplateId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_template_id is required");
    }
    await this.repository.record(req.context.tenantId, "ArchiveNotificationTemplate", req);
    this.logger.info("archive_notification_template", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptWorkflowServiceApi.CancelDeliveryAttemptWorkflowRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: { subject: { displayName: (req?.details?.newOwner?.displayName ?? "") } },
      details: {
        notify: {
          email: (req?.details?.newOwner?.email ?? ""),
          name: req?.details?.notifyContact?.name,
          phone: (req?.details?.notifyContact?.phone ?? ""),
        },
      },
    });
    const invoke1: Unary<notificationsDeliveryAttemptWorkflowServiceApi.CancelDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.CancelDeliveryAttemptWorkflowResponse> =
      (input, done) => this.notificationsDeliveryAttemptWorkflowClient.cancelDeliveryAttemptWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsNotificationTemplateAdminServiceApi.ArchiveNotificationTemplateResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      notificationsNotificationTemplateAdminServiceApi.ArchiveNotificationTemplateResponse.fromPartial({
        notificationTemplate: { notificationTemplateId: (req?.notificationTemplateId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Locks a notification template.
   */
  async lockNotificationTemplate(req: notificationsNotificationTemplateAdminServiceApi.LockNotificationTemplateRequest): Promise<notificationsNotificationTemplateAdminServiceApi.LockNotificationTemplateResponse> {
    validateContext(req.context);
    if (!req.notificationTemplateId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_template_id is required");
    }
    await this.repository.record(req.context.tenantId, "LockNotificationTemplate", req);
    this.logger.info("lock_notification_template", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateAdminServiceApi.LockNotificationTemplateResponse.fromPartial({
      notificationTemplate: { notificationTemplateId: (req?.notificationTemplateId ?? "") },
      outcome: { effectiveAt: req?.details?.effectiveAt },
    });
  }

  /**
   * Deletes a notification template.
   */
  async purgeNotificationTemplate(req: notificationsNotificationTemplateAdminServiceApi.PurgeNotificationTemplateRequest): Promise<notificationsNotificationTemplateAdminServiceApi.PurgeNotificationTemplateResponse> {
    validateContext(req.context);
    if (!req.notificationTemplateId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_template_id is required");
    }
    await this.repository.record(req.context.tenantId, "PurgeNotificationTemplate", req);
    this.logger.info("purge_notification_template", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.etag ?? "") });
    return notificationsNotificationTemplateAdminServiceApi.PurgeNotificationTemplateResponse.fromPartial({});
  }

  /**
   * Reassigns a notification template.
   */
  async reassignNotificationTemplate(req: notificationsNotificationTemplateAdminServiceApi.ReassignNotificationTemplateRequest): Promise<notificationsNotificationTemplateAdminServiceApi.ReassignNotificationTemplateResponse> {
    validateContext(req.context);
    if (!req.notificationTemplateId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_template_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReassignNotificationTemplate", req);
    this.logger.info("reassign_notification_template", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalRequest.fromPartial({
      context: req?.context,
      subscription: { owner: { email: (req?.details?.assignee?.email ?? "") } },
    });
    const reply1 = await this.workQueue.enqueue<notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalRequest, notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalResponse>(
      "acme.notifications.v1.NotificationTemplateAdminService/ReassignNotificationTemplate:0", request1,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsNotificationTemplateAdminServiceApi.ReassignNotificationTemplateResponse.fromPartial({
        notificationTemplate: { audit: { updatedBy: (reply1?.subscription?.audit?.updatedBy ?? "") } },
        result: { message: (reply1?.outcome?.message ?? "") },
      }),
      notificationsNotificationTemplateAdminServiceApi.ReassignNotificationTemplateResponse.fromPartial({
        notificationTemplate: {
          counterparty: { displayName: (req?.details?.assignee?.displayName ?? "") },
          notificationTemplateId: (req?.notificationTemplateId ?? ""),
        },
      }),
    );
  }

  /**
   * Repairs a notification template.
   */
  async repairNotificationTemplate(req: notificationsNotificationTemplateAdminServiceApi.RepairNotificationTemplateRequest): Promise<notificationsNotificationTemplateAdminServiceApi.RepairNotificationTemplateResponse> {
    validateContext(req.context);
    if (req.notificationTemplate) {
      await this.repository.save(toNotificationTemplateRecord(req.context.tenantId, req.notificationTemplate));
    }
    await this.repository.record(req.context.tenantId, "RepairNotificationTemplate", req);
    this.logger.info("repair_notification_template", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateAdminServiceApi.RepairNotificationTemplateResponse.fromPartial({
      notificationTemplate: {
        issuedAt: req?.notificationTemplate?.issuedAt,
        notificationTemplateId: (req?.notificationTemplateId ?? ""),
      },
    });
  }

  /**
   * Restores a notification template.
   */
  async restoreNotificationTemplate(req: notificationsNotificationTemplateAdminServiceApi.RestoreNotificationTemplateRequest): Promise<notificationsNotificationTemplateAdminServiceApi.RestoreNotificationTemplateResponse> {
    validateContext(req.context);
    if (!req.notificationTemplateId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_template_id is required");
    }
    await this.repository.record(req.context.tenantId, "RestoreNotificationTemplate", req);
    this.logger.info("restore_notification_template", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = venuesVenueQueryServiceApi.CountVenuesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.details?.newOwner?.userId ?? ""),
      },
    });
    const invoke1: Unary<venuesVenueQueryServiceApi.CountVenuesRequest, venuesVenueQueryServiceApi.CountVenuesResponse> =
      (input, done) => this.venuesVenueQueryClient.countVenues(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<venuesVenueQueryServiceApi.CountVenuesRequest, venuesVenueQueryServiceApi.CountVenuesResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsNotificationTemplateAdminServiceApi.RestoreNotificationTemplateResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          details: (reply1?.result?.details ?? {}),
        },
      }),
      notificationsNotificationTemplateAdminServiceApi.RestoreNotificationTemplateResponse.fromPartial({
        notificationTemplate: { notificationTemplateId: (req?.notificationTemplateId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Transfers a notification template.
   */
  async transferNotificationTemplate(req: notificationsNotificationTemplateAdminServiceApi.TransferNotificationTemplateRequest): Promise<notificationsNotificationTemplateAdminServiceApi.TransferNotificationTemplateResponse> {
    validateContext(req.context);
    if (!req.notificationTemplateId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_template_id is required");
    }
    await this.repository.record(req.context.tenantId, "TransferNotificationTemplate", req);
    this.logger.info("transfer_notification_template", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptWorkflowServiceApi.AdvanceDeliveryAttemptWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { phone: (req?.details?.notifyContact?.phone ?? "") } },
    });
    const invoke1: Unary<notificationsDeliveryAttemptWorkflowServiceApi.AdvanceDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.AdvanceDeliveryAttemptWorkflowResponse> =
      (input, done) => this.notificationsDeliveryAttemptWorkflowClient.advanceDeliveryAttemptWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<notificationsDeliveryAttemptWorkflowServiceApi.AdvanceDeliveryAttemptWorkflowResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsNotificationTemplateAdminServiceApi.TransferNotificationTemplateResponse.fromPartial({
        notificationTemplate: { number: (reply1?.deliveryAttempt?.subject?.number ?? "") },
        outcome: { effectiveAt: reply1?.outcome?.effectiveAt },
      }),
      notificationsNotificationTemplateAdminServiceApi.TransferNotificationTemplateResponse.fromPartial({
        notificationTemplate: {
          counterparty: { displayName: (req?.details?.newOwner?.displayName ?? "") },
          notificationTemplateId: (req?.notificationTemplateId ?? ""),
        },
      }),
    );
  }

  /**
   * Unlocks a notification template.
   */
  async unlockNotificationTemplate(req: notificationsNotificationTemplateAdminServiceApi.UnlockNotificationTemplateRequest): Promise<notificationsNotificationTemplateAdminServiceApi.UnlockNotificationTemplateResponse> {
    validateContext(req.context);
    if (!req.notificationTemplateId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_template_id is required");
    }
    await this.repository.record(req.context.tenantId, "UnlockNotificationTemplate", req);
    this.logger.info("unlock_notification_template", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = venuesVenueServiceApi.CloneVenueRequest.fromPartial({
      context: req?.context,
      venue: { owner: { displayName: (req?.details?.newOwner?.displayName ?? "") } },
    });
    const invoke1: Unary<venuesVenueServiceApi.CloneVenueRequest, venuesVenueServiceApi.CloneVenueResponse> =
      (input, done) => this.venuesVenueClient.cloneVenue(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsNotificationTemplateAdminServiceApi.UnlockNotificationTemplateResponse.fromPartial({
        notificationTemplate: {
          billingAddress: {
            countryCode: ((reply1?.venue?.locator?.$case === "address" ? reply1?.venue?.locator.address : undefined)?.countryCode ?? ""),
          },
          lines: [{ quantity: (reply1?.venue?.components?.["primary"]?.quantity ?? 0) }],
        },
      }),
      notificationsNotificationTemplateAdminServiceApi.UnlockNotificationTemplateResponse.fromPartial({
        notificationTemplate: { notificationTemplateId: (req?.notificationTemplateId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }
}
