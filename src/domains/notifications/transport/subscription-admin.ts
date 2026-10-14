/**
 * Operator actions on subscriptions that support staff run by hand.
 */

import * as notificationsSubscriptionAdminServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_admin_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { SubscriptionAdminWorkflow } from "../application/subscription-admin.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for SubscriptionAdminService; workflows own validation and database transactions.
 */
@injectable()
export class SubscriptionAdminHandler {
  constructor(@inject(SubscriptionAdminWorkflow) private readonly workflow: SubscriptionAdminWorkflow) {}

  /**
   * Archives a subscription.
   */
  archiveSubscription = (call: ServerUnaryCall<notificationsSubscriptionAdminServiceApi.ArchiveSubscriptionRequest, notificationsSubscriptionAdminServiceApi.ArchiveSubscriptionResponse>, done: sendUnaryData<notificationsSubscriptionAdminServiceApi.ArchiveSubscriptionResponse>): void => {
    void this.workflow.archiveSubscription(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a subscription.
   */
  inspectSubscription = unary<notificationsSubscriptionAdminServiceApi.InspectSubscriptionRequest, notificationsSubscriptionAdminServiceApi.InspectSubscriptionResponse>(
    (request) => this.workflow.inspectSubscription(request),
  );

  /**
   * Locks a subscription.
   */
  lockSubscription = unary<notificationsSubscriptionAdminServiceApi.LockSubscriptionRequest, notificationsSubscriptionAdminServiceApi.LockSubscriptionResponse>(
    (request) => this.workflow.lockSubscription(request),
  );

  /**
   * Deletes a subscription.
   */
  purgeSubscription = (call: ServerUnaryCall<notificationsSubscriptionAdminServiceApi.PurgeSubscriptionRequest, notificationsSubscriptionAdminServiceApi.PurgeSubscriptionResponse>, done: sendUnaryData<notificationsSubscriptionAdminServiceApi.PurgeSubscriptionResponse>): void => {
    void this.workflow.purgeSubscription(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Reassigns a subscription.
   */
  reassignSubscription = unary<notificationsSubscriptionAdminServiceApi.ReassignSubscriptionRequest, notificationsSubscriptionAdminServiceApi.ReassignSubscriptionResponse>(
    (request) => this.workflow.reassignSubscription(request),
  );

  /**
   * Restores a subscription.
   */
  restoreSubscription = unary<notificationsSubscriptionAdminServiceApi.RestoreSubscriptionRequest, notificationsSubscriptionAdminServiceApi.RestoreSubscriptionResponse>(
    (request) => this.workflow.restoreSubscription(request),
  );

  /**
   * Transfers a subscription.
   */
  transferSubscription = (call: ServerUnaryCall<notificationsSubscriptionAdminServiceApi.TransferSubscriptionRequest, notificationsSubscriptionAdminServiceApi.TransferSubscriptionResponse>, done: sendUnaryData<notificationsSubscriptionAdminServiceApi.TransferSubscriptionResponse>): void => {
    void this.workflow.transferSubscription(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: SubscriptionAdminHandler): notificationsSubscriptionAdminServiceApi.SubscriptionAdminServiceServer {
  return {
    archiveSubscription: handler.archiveSubscription,
    inspectSubscription: handler.inspectSubscription,
    lockSubscription: handler.lockSubscription,
    purgeSubscription: handler.purgeSubscription,
    reassignSubscription: handler.reassignSubscription,
    restoreSubscription: handler.restoreSubscription,
    transferSubscription: handler.transferSubscription,
  };
}
