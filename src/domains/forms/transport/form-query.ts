/**
 * Answers read-only questions about forms, for screens and reports.
 */

import * as formsFormQueryServiceApi from "../../../../.cache/proto/acme/forms/v1/form_query_service.js";
import { serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { FormQueryWorkflow } from "../application/form-query.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for FormQueryService; workflows own validation and database transactions.
 */
@injectable()
export class FormQueryHandler {
  constructor(@inject(FormQueryWorkflow) private readonly workflow: FormQueryWorkflow) {}

  /**
   * Lists forms a page at a time.
   */
  browseForms = (call: ServerUnaryCall<formsFormQueryServiceApi.BrowseFormsRequest, formsFormQueryServiceApi.BrowseFormsResponse>, done: sendUnaryData<formsFormQueryServiceApi.BrowseFormsResponse>): void => {
    void this.workflow.browseForms(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Streams every matching form.
   */
  exportForms = serverStream<formsFormQueryServiceApi.ExportFormsRequest, formsFormQueryServiceApi.ExportFormsResponse>(
    (request) => this.workflow.exportForms(request),
  );

  /**
   * Returns a form.
   */
  lookupForm = unary<formsFormQueryServiceApi.LookupFormRequest, formsFormQueryServiceApi.LookupFormResponse>(
    (request) => this.workflow.lookupForm(request),
  );

  /**
   * Returns several forms at once.
   */
  resolveForms = (call: ServerUnaryCall<formsFormQueryServiceApi.ResolveFormsRequest, formsFormQueryServiceApi.ResolveFormsResponse>, done: sendUnaryData<formsFormQueryServiceApi.ResolveFormsResponse>): void => {
    void this.workflow.resolveForms(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists forms a page at a time.
   */
  suggestForms = unary<formsFormQueryServiceApi.SuggestFormsRequest, formsFormQueryServiceApi.SuggestFormsResponse>(
    (request) => this.workflow.suggestForms(request),
  );

  /**
   * Summarizes a form.
   */
  summarizeForms = unary<formsFormQueryServiceApi.SummarizeFormsRequest, formsFormQueryServiceApi.SummarizeFormsResponse>(
    (request) => this.workflow.summarizeForms(request),
  );
}

export function implementation(handler: FormQueryHandler): formsFormQueryServiceApi.FormQueryServiceServer {
  return {
    browseForms: handler.browseForms,
    exportForms: handler.exportForms,
    lookupForm: handler.lookupForm,
    resolveForms: handler.resolveForms,
    suggestForms: handler.suggestForms,
    summarizeForms: handler.summarizeForms,
  };
}
