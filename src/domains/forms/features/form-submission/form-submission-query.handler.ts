/**
 * Answers read-only questions about form submissions, for screens and reports.
 */

import * as formsFormSubmissionQueryServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_submission_query_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { serverStream, unary } from "../../../../platform/handlers.js";
import { FormSubmissionQueryWorkflow } from "./form-submission-query.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for FormSubmissionQueryService; workflows own validation and database transactions.
 */
@injectable()
export class FormSubmissionQueryHandler {
  constructor(@inject(FormSubmissionQueryWorkflow) private readonly workflow: FormSubmissionQueryWorkflow) {}

  /**
   * Lists form submissions a page at a time.
   */
  browseFormSubmissions = unary<formsFormSubmissionQueryServiceApi.BrowseFormSubmissionsRequest, formsFormSubmissionQueryServiceApi.BrowseFormSubmissionsResponse>(
    (request) => this.workflow.browseFormSubmissions(request),
  );

  /**
   * Counts form submissions by status.
   */
  countFormSubmissions = (call: ServerUnaryCall<formsFormSubmissionQueryServiceApi.CountFormSubmissionsRequest, formsFormSubmissionQueryServiceApi.CountFormSubmissionsResponse>, done: sendUnaryData<formsFormSubmissionQueryServiceApi.CountFormSubmissionsResponse>): void => {
    void this.workflow.countFormSubmissions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Streams every matching form submission.
   */
  exportFormSubmissions = serverStream<formsFormSubmissionQueryServiceApi.ExportFormSubmissionsRequest, formsFormSubmissionQueryServiceApi.ExportFormSubmissionsResponse>(
    (request) => this.workflow.exportFormSubmissions(request),
  );

  /**
   * Lists form submissions a page at a time.
   */
  findFormSubmissions = unary<formsFormSubmissionQueryServiceApi.FindFormSubmissionsRequest, formsFormSubmissionQueryServiceApi.FindFormSubmissionsResponse>(
    (request) => this.workflow.findFormSubmissions(request),
  );

  /**
   * Returns a form submission.
   */
  lookupFormSubmission = (call: ServerUnaryCall<formsFormSubmissionQueryServiceApi.LookupFormSubmissionRequest, formsFormSubmissionQueryServiceApi.LookupFormSubmissionResponse>, done: sendUnaryData<formsFormSubmissionQueryServiceApi.LookupFormSubmissionResponse>): void => {
    void this.workflow.lookupFormSubmission(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a form submission.
   */
  peekFormSubmission = unary<formsFormSubmissionQueryServiceApi.PeekFormSubmissionRequest, formsFormSubmissionQueryServiceApi.PeekFormSubmissionResponse>(
    (request) => this.workflow.peekFormSubmission(request),
  );

  /**
   * Returns several form submissions at once.
   */
  resolveFormSubmissions = unary<formsFormSubmissionQueryServiceApi.ResolveFormSubmissionsRequest, formsFormSubmissionQueryServiceApi.ResolveFormSubmissionsResponse>(
    (request) => this.workflow.resolveFormSubmissions(request),
  );

  /**
   * Summarizes a form submission.
   */
  summarizeFormSubmissions = (call: ServerUnaryCall<formsFormSubmissionQueryServiceApi.SummarizeFormSubmissionsRequest, formsFormSubmissionQueryServiceApi.SummarizeFormSubmissionsResponse>, done: sendUnaryData<formsFormSubmissionQueryServiceApi.SummarizeFormSubmissionsResponse>): void => {
    void this.workflow.summarizeFormSubmissions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: FormSubmissionQueryHandler): formsFormSubmissionQueryServiceApi.FormSubmissionQueryServiceServer {
  return {
    browseFormSubmissions: handler.browseFormSubmissions,
    countFormSubmissions: handler.countFormSubmissions,
    exportFormSubmissions: handler.exportFormSubmissions,
    findFormSubmissions: handler.findFormSubmissions,
    lookupFormSubmission: handler.lookupFormSubmission,
    peekFormSubmission: handler.peekFormSubmission,
    resolveFormSubmissions: handler.resolveFormSubmissions,
    summarizeFormSubmissions: handler.summarizeFormSubmissions,
  };
}
