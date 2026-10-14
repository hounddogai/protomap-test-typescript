/**
 * Moves a form field between the states of its lifecycle.
 */

import * as formsFormFieldLifecycleServiceApi from "../../../../.cache/proto/acme/forms/v1/form_field_lifecycle_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { FormFieldLifecycleWorkflow } from "../application/form-field-lifecycle.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for FormFieldLifecycleService; workflows own validation and database transactions.
 */
@injectable()
export class FormFieldLifecycleHandler {
  constructor(@inject(FormFieldLifecycleWorkflow) private readonly workflow: FormFieldLifecycleWorkflow) {}

  /**
   * Activates a form field.
   */
  activateFormField = (call: ServerUnaryCall<formsFormFieldLifecycleServiceApi.ActivateFormFieldRequest, formsFormFieldLifecycleServiceApi.ActivateFormFieldResponse>, done: sendUnaryData<formsFormFieldLifecycleServiceApi.ActivateFormFieldResponse>): void => {
    void this.workflow.activateFormField(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Expires a form field.
   */
  expireFormField = unary<formsFormFieldLifecycleServiceApi.ExpireFormFieldRequest, formsFormFieldLifecycleServiceApi.ExpireFormFieldResponse>(
    (request) => this.workflow.expireFormField(request),
  );

  /**
   * Returns a form field.
   */
  getFormFieldLifecycle = unary<formsFormFieldLifecycleServiceApi.GetFormFieldLifecycleRequest, formsFormFieldLifecycleServiceApi.GetFormFieldLifecycleResponse>(
    (request) => this.workflow.getFormFieldLifecycle(request),
  );

  /**
   * Reinstates a form field.
   */
  reinstateFormField = (call: ServerUnaryCall<formsFormFieldLifecycleServiceApi.ReinstateFormFieldRequest, formsFormFieldLifecycleServiceApi.ReinstateFormFieldResponse>, done: sendUnaryData<formsFormFieldLifecycleServiceApi.ReinstateFormFieldResponse>): void => {
    void this.workflow.reinstateFormField(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Renews a form field.
   */
  renewFormField = unary<formsFormFieldLifecycleServiceApi.RenewFormFieldRequest, formsFormFieldLifecycleServiceApi.RenewFormFieldResponse>(
    (request) => this.workflow.renewFormField(request),
  );

  /**
   * Schedules a form field.
   */
  scheduleFormFieldExpiry = unary<formsFormFieldLifecycleServiceApi.ScheduleFormFieldExpiryRequest, formsFormFieldLifecycleServiceApi.ScheduleFormFieldExpiryResponse>(
    (request) => this.workflow.scheduleFormFieldExpiry(request),
  );

  /**
   * Suspends a form field.
   */
  suspendFormField = (call: ServerUnaryCall<formsFormFieldLifecycleServiceApi.SuspendFormFieldRequest, formsFormFieldLifecycleServiceApi.SuspendFormFieldResponse>, done: sendUnaryData<formsFormFieldLifecycleServiceApi.SuspendFormFieldResponse>): void => {
    void this.workflow.suspendFormField(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: FormFieldLifecycleHandler): formsFormFieldLifecycleServiceApi.FormFieldLifecycleServiceServer {
  return {
    activateFormField: handler.activateFormField,
    expireFormField: handler.expireFormField,
    getFormFieldLifecycle: handler.getFormFieldLifecycle,
    reinstateFormField: handler.reinstateFormField,
    renewFormField: handler.renewFormField,
    scheduleFormFieldExpiry: handler.scheduleFormFieldExpiry,
    suspendFormField: handler.suspendFormField,
  };
}
