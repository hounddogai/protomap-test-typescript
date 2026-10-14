/**
 * Moves a locale between the states of its lifecycle.
 */

import * as localizationLocaleLifecycleServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_lifecycle_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { LocaleLifecycleWorkflow } from "../application/locale-lifecycle.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for LocaleLifecycleService; workflows own validation and database transactions.
 */
@injectable()
export class LocaleLifecycleHandler {
  constructor(@inject(LocaleLifecycleWorkflow) private readonly workflow: LocaleLifecycleWorkflow) {}

  /**
   * Activates a locale.
   */
  activateLocale = (call: ServerUnaryCall<localizationLocaleLifecycleServiceApi.ActivateLocaleRequest, localizationLocaleLifecycleServiceApi.ActivateLocaleResponse>, done: sendUnaryData<localizationLocaleLifecycleServiceApi.ActivateLocaleResponse>): void => {
    void this.workflow.activateLocale(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Expires a locale.
   */
  expireLocale = unary<localizationLocaleLifecycleServiceApi.ExpireLocaleRequest, localizationLocaleLifecycleServiceApi.ExpireLocaleResponse>(
    (request) => this.workflow.expireLocale(request),
  );

  /**
   * Returns a locale.
   */
  getLocaleLifecycle = unary<localizationLocaleLifecycleServiceApi.GetLocaleLifecycleRequest, localizationLocaleLifecycleServiceApi.GetLocaleLifecycleResponse>(
    (request) => this.workflow.getLocaleLifecycle(request),
  );

  /**
   * Reinstates a locale.
   */
  reinstateLocale = (call: ServerUnaryCall<localizationLocaleLifecycleServiceApi.ReinstateLocaleRequest, localizationLocaleLifecycleServiceApi.ReinstateLocaleResponse>, done: sendUnaryData<localizationLocaleLifecycleServiceApi.ReinstateLocaleResponse>): void => {
    void this.workflow.reinstateLocale(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Renews a locale.
   */
  renewLocale = unary<localizationLocaleLifecycleServiceApi.RenewLocaleRequest, localizationLocaleLifecycleServiceApi.RenewLocaleResponse>(
    (request) => this.workflow.renewLocale(request),
  );

  /**
   * Schedules a locale.
   */
  scheduleLocaleExpiry = unary<localizationLocaleLifecycleServiceApi.ScheduleLocaleExpiryRequest, localizationLocaleLifecycleServiceApi.ScheduleLocaleExpiryResponse>(
    (request) => this.workflow.scheduleLocaleExpiry(request),
  );

  /**
   * Suspends a locale.
   */
  suspendLocale = (call: ServerUnaryCall<localizationLocaleLifecycleServiceApi.SuspendLocaleRequest, localizationLocaleLifecycleServiceApi.SuspendLocaleResponse>, done: sendUnaryData<localizationLocaleLifecycleServiceApi.SuspendLocaleResponse>): void => {
    void this.workflow.suspendLocale(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Terminates a locale.
   */
  terminateLocale = unary<localizationLocaleLifecycleServiceApi.TerminateLocaleRequest, localizationLocaleLifecycleServiceApi.TerminateLocaleResponse>(
    (request) => this.workflow.terminateLocale(request),
  );
}

export function implementation(handler: LocaleLifecycleHandler): localizationLocaleLifecycleServiceApi.LocaleLifecycleServiceServer {
  return {
    activateLocale: handler.activateLocale,
    expireLocale: handler.expireLocale,
    getLocaleLifecycle: handler.getLocaleLifecycle,
    reinstateLocale: handler.reinstateLocale,
    renewLocale: handler.renewLocale,
    scheduleLocaleExpiry: handler.scheduleLocaleExpiry,
    suspendLocale: handler.suspendLocale,
    terminateLocale: handler.terminateLocale,
  };
}
