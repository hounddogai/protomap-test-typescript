/**
 * Routes form submissions through approval, with escalation and delegation.
 */

import * as formsFormSubmissionApprovalServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_submission_approval_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { FormSubmissionApprovalWorkflow } from "./form-submission-approval.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for FormSubmissionApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class FormSubmissionApprovalHandler {
  constructor(@inject(FormSubmissionApprovalWorkflow) private readonly workflow: FormSubmissionApprovalWorkflow) {}

  /**
   * Approves a form submission.
   */
  approveFormSubmission = unary<formsFormSubmissionApprovalServiceApi.ApproveFormSubmissionRequest, formsFormSubmissionApprovalServiceApi.ApproveFormSubmissionResponse>(
    (request) => this.workflow.approveFormSubmission(request),
  );

  /**
   * Comments a form submission.
   */
  commentFormSubmissionApproval = (call: ServerUnaryCall<formsFormSubmissionApprovalServiceApi.CommentFormSubmissionApprovalRequest, formsFormSubmissionApprovalServiceApi.CommentFormSubmissionApprovalResponse>, done: sendUnaryData<formsFormSubmissionApprovalServiceApi.CommentFormSubmissionApprovalResponse>): void => {
    void this.workflow.commentFormSubmissionApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Delegates a form submission.
   */
  delegateFormSubmissionApproval = unary<formsFormSubmissionApprovalServiceApi.DelegateFormSubmissionApprovalRequest, formsFormSubmissionApprovalServiceApi.DelegateFormSubmissionApprovalResponse>(
    (request) => this.workflow.delegateFormSubmissionApproval(request),
  );

  /**
   * Escalates a form submission.
   */
  escalateFormSubmission = unary<formsFormSubmissionApprovalServiceApi.EscalateFormSubmissionRequest, formsFormSubmissionApprovalServiceApi.EscalateFormSubmissionResponse>(
    (request) => this.workflow.escalateFormSubmission(request),
  );

  /**
   * Returns a form submission.
   */
  getFormSubmissionApprovalStatus = (call: ServerUnaryCall<formsFormSubmissionApprovalServiceApi.GetFormSubmissionApprovalStatusRequest, formsFormSubmissionApprovalServiceApi.GetFormSubmissionApprovalStatusResponse>, done: sendUnaryData<formsFormSubmissionApprovalServiceApi.GetFormSubmissionApprovalStatusResponse>): void => {
    void this.workflow.getFormSubmissionApprovalStatus(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists form submissions a page at a time.
   */
  listPendingFormSubmissions = unary<formsFormSubmissionApprovalServiceApi.ListPendingFormSubmissionsRequest, formsFormSubmissionApprovalServiceApi.ListPendingFormSubmissionsResponse>(
    (request) => this.workflow.listPendingFormSubmissions(request),
  );

  /**
   * Recalls a form submission.
   */
  recallFormSubmission = unary<formsFormSubmissionApprovalServiceApi.RecallFormSubmissionRequest, formsFormSubmissionApprovalServiceApi.RecallFormSubmissionResponse>(
    (request) => this.workflow.recallFormSubmission(request),
  );

  /**
   * Rejects a form submission.
   */
  rejectFormSubmission = (call: ServerUnaryCall<formsFormSubmissionApprovalServiceApi.RejectFormSubmissionRequest, formsFormSubmissionApprovalServiceApi.RejectFormSubmissionResponse>, done: sendUnaryData<formsFormSubmissionApprovalServiceApi.RejectFormSubmissionResponse>): void => {
    void this.workflow.rejectFormSubmission(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Submits a form submission.
   */
  submitFormSubmission = unary<formsFormSubmissionApprovalServiceApi.SubmitFormSubmissionRequest, formsFormSubmissionApprovalServiceApi.SubmitFormSubmissionResponse>(
    (request) => this.workflow.submitFormSubmission(request),
  );
}

export function implementation(handler: FormSubmissionApprovalHandler): formsFormSubmissionApprovalServiceApi.FormSubmissionApprovalServiceServer {
  return {
    approveFormSubmission: handler.approveFormSubmission,
    commentFormSubmissionApproval: handler.commentFormSubmissionApproval,
    delegateFormSubmissionApproval: handler.delegateFormSubmissionApproval,
    escalateFormSubmission: handler.escalateFormSubmission,
    getFormSubmissionApprovalStatus: handler.getFormSubmissionApprovalStatus,
    listPendingFormSubmissions: handler.listPendingFormSubmissions,
    recallFormSubmission: handler.recallFormSubmission,
    rejectFormSubmission: handler.rejectFormSubmission,
    submitFormSubmission: handler.submitFormSubmission,
  };
}
