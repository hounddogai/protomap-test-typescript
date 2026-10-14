/**
 * Operator actions on delivery attempts that support staff run by hand.
 */

import * as notificationsDeliveryAttemptAdminServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_admin_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { DeliveryAttemptAdminWorkflow } from "./delivery-attempt-admin.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for DeliveryAttemptAdminService; workflows own validation and database transactions.
 */
@injectable()
export class DeliveryAttemptAdminHandler {
  constructor(@inject(DeliveryAttemptAdminWorkflow) private readonly workflow: DeliveryAttemptAdminWorkflow) {}

  /**
   * Archives a delivery attempt.
   */
  archiveDeliveryAttempt = unary<notificationsDeliveryAttemptAdminServiceApi.ArchiveDeliveryAttemptRequest, notificationsDeliveryAttemptAdminServiceApi.ArchiveDeliveryAttemptResponse>(
    (request) => this.workflow.archiveDeliveryAttempt(request),
  );

  /**
   * Returns a delivery attempt.
   */
  inspectDeliveryAttempt = (call: ServerUnaryCall<notificationsDeliveryAttemptAdminServiceApi.InspectDeliveryAttemptRequest, notificationsDeliveryAttemptAdminServiceApi.InspectDeliveryAttemptResponse>, done: sendUnaryData<notificationsDeliveryAttemptAdminServiceApi.InspectDeliveryAttemptResponse>): void => {
    void this.workflow.inspectDeliveryAttempt(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Locks a delivery attempt.
   */
  lockDeliveryAttempt = unary<notificationsDeliveryAttemptAdminServiceApi.LockDeliveryAttemptRequest, notificationsDeliveryAttemptAdminServiceApi.LockDeliveryAttemptResponse>(
    (request) => this.workflow.lockDeliveryAttempt(request),
  );

  /**
   * Reassigns a delivery attempt.
   */
  reassignDeliveryAttempt = unary<notificationsDeliveryAttemptAdminServiceApi.ReassignDeliveryAttemptRequest, notificationsDeliveryAttemptAdminServiceApi.ReassignDeliveryAttemptResponse>(
    (request) => this.workflow.reassignDeliveryAttempt(request),
  );

  /**
   * Repairs a delivery attempt.
   */
  repairDeliveryAttempt = (call: ServerUnaryCall<notificationsDeliveryAttemptAdminServiceApi.RepairDeliveryAttemptRequest, notificationsDeliveryAttemptAdminServiceApi.RepairDeliveryAttemptResponse>, done: sendUnaryData<notificationsDeliveryAttemptAdminServiceApi.RepairDeliveryAttemptResponse>): void => {
    void this.workflow.repairDeliveryAttempt(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Restores a delivery attempt.
   */
  restoreDeliveryAttempt = unary<notificationsDeliveryAttemptAdminServiceApi.RestoreDeliveryAttemptRequest, notificationsDeliveryAttemptAdminServiceApi.RestoreDeliveryAttemptResponse>(
    (request) => this.workflow.restoreDeliveryAttempt(request),
  );

  /**
   * Transfers a delivery attempt.
   */
  transferDeliveryAttempt = unary<notificationsDeliveryAttemptAdminServiceApi.TransferDeliveryAttemptRequest, notificationsDeliveryAttemptAdminServiceApi.TransferDeliveryAttemptResponse>(
    (request) => this.workflow.transferDeliveryAttempt(request),
  );

  /**
   * Unlocks a delivery attempt.
   */
  unlockDeliveryAttempt = (call: ServerUnaryCall<notificationsDeliveryAttemptAdminServiceApi.UnlockDeliveryAttemptRequest, notificationsDeliveryAttemptAdminServiceApi.UnlockDeliveryAttemptResponse>, done: sendUnaryData<notificationsDeliveryAttemptAdminServiceApi.UnlockDeliveryAttemptResponse>): void => {
    void this.workflow.unlockDeliveryAttempt(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: DeliveryAttemptAdminHandler): notificationsDeliveryAttemptAdminServiceApi.DeliveryAttemptAdminServiceServer {
  return {
    archiveDeliveryAttempt: handler.archiveDeliveryAttempt,
    inspectDeliveryAttempt: handler.inspectDeliveryAttempt,
    lockDeliveryAttempt: handler.lockDeliveryAttempt,
    reassignDeliveryAttempt: handler.reassignDeliveryAttempt,
    repairDeliveryAttempt: handler.repairDeliveryAttempt,
    restoreDeliveryAttempt: handler.restoreDeliveryAttempt,
    transferDeliveryAttempt: handler.transferDeliveryAttempt,
    unlockDeliveryAttempt: handler.unlockDeliveryAttempt,
  };
}
