/**
 * Moves a profile between the states of its lifecycle.
 */

import * as personalizationProfileLifecycleServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_lifecycle_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { ProfileLifecycleWorkflow } from "../application/profile-lifecycle.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ProfileLifecycleService; workflows own validation and database transactions.
 */
@injectable()
export class ProfileLifecycleHandler {
  constructor(@inject(ProfileLifecycleWorkflow) private readonly workflow: ProfileLifecycleWorkflow) {}

  /**
   * Activates a profile.
   */
  activateProfile = (call: ServerUnaryCall<personalizationProfileLifecycleServiceApi.ActivateProfileRequest, personalizationProfileLifecycleServiceApi.ActivateProfileResponse>, done: sendUnaryData<personalizationProfileLifecycleServiceApi.ActivateProfileResponse>): void => {
    void this.workflow.activateProfile(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Expires a profile.
   */
  expireProfile = unary<personalizationProfileLifecycleServiceApi.ExpireProfileRequest, personalizationProfileLifecycleServiceApi.ExpireProfileResponse>(
    (request) => this.workflow.expireProfile(request),
  );

  /**
   * Returns a profile.
   */
  getProfileLifecycle = unary<personalizationProfileLifecycleServiceApi.GetProfileLifecycleRequest, personalizationProfileLifecycleServiceApi.GetProfileLifecycleResponse>(
    (request) => this.workflow.getProfileLifecycle(request),
  );

  /**
   * Reinstates a profile.
   */
  reinstateProfile = (call: ServerUnaryCall<personalizationProfileLifecycleServiceApi.ReinstateProfileRequest, personalizationProfileLifecycleServiceApi.ReinstateProfileResponse>, done: sendUnaryData<personalizationProfileLifecycleServiceApi.ReinstateProfileResponse>): void => {
    void this.workflow.reinstateProfile(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Renews a profile.
   */
  renewProfile = unary<personalizationProfileLifecycleServiceApi.RenewProfileRequest, personalizationProfileLifecycleServiceApi.RenewProfileResponse>(
    (request) => this.workflow.renewProfile(request),
  );

  /**
   * Schedules a profile.
   */
  scheduleProfileExpiry = unary<personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryRequest, personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryResponse>(
    (request) => this.workflow.scheduleProfileExpiry(request),
  );

  /**
   * Suspends a profile.
   */
  suspendProfile = (call: ServerUnaryCall<personalizationProfileLifecycleServiceApi.SuspendProfileRequest, personalizationProfileLifecycleServiceApi.SuspendProfileResponse>, done: sendUnaryData<personalizationProfileLifecycleServiceApi.SuspendProfileResponse>): void => {
    void this.workflow.suspendProfile(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Terminates a profile.
   */
  terminateProfile = unary<personalizationProfileLifecycleServiceApi.TerminateProfileRequest, personalizationProfileLifecycleServiceApi.TerminateProfileResponse>(
    (request) => this.workflow.terminateProfile(request),
  );
}

export function implementation(handler: ProfileLifecycleHandler): personalizationProfileLifecycleServiceApi.ProfileLifecycleServiceServer {
  return {
    activateProfile: handler.activateProfile,
    expireProfile: handler.expireProfile,
    getProfileLifecycle: handler.getProfileLifecycle,
    reinstateProfile: handler.reinstateProfile,
    renewProfile: handler.renewProfile,
    scheduleProfileExpiry: handler.scheduleProfileExpiry,
    suspendProfile: handler.suspendProfile,
    terminateProfile: handler.terminateProfile,
  };
}
