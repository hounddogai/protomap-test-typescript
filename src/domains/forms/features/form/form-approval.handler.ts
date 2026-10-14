/**
 * Routes forms through approval, with escalation and delegation.
 */

import * as formsFormApprovalServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_approval_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { FormApprovalWorkflow } from "./form-approval.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for FormApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class FormApprovalHandler {
  constructor(@inject(FormApprovalWorkflow) private readonly workflow: FormApprovalWorkflow) {}

  /**
   * Approves a form.
   */
  approveForm = unary<formsFormApprovalServiceApi.ApproveFormRequest, formsFormApprovalServiceApi.ApproveFormResponse>(
    (request) => this.workflow.approveForm(request),
  );

  /**
   * Comments a form.
   */
  commentFormApproval = (call: ServerUnaryCall<formsFormApprovalServiceApi.CommentFormApprovalRequest, formsFormApprovalServiceApi.CommentFormApprovalResponse>, done: sendUnaryData<formsFormApprovalServiceApi.CommentFormApprovalResponse>): void => {
    void this.workflow.commentFormApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Delegates a form.
   */
  delegateFormApproval = unary<formsFormApprovalServiceApi.DelegateFormApprovalRequest, formsFormApprovalServiceApi.DelegateFormApprovalResponse>(
    (request) => this.workflow.delegateFormApproval(request),
  );

  /**
   * Escalates a form.
   */
  escalateForm = unary<formsFormApprovalServiceApi.EscalateFormRequest, formsFormApprovalServiceApi.EscalateFormResponse>(
    (request) => this.workflow.escalateForm(request),
  );

  /**
   * Returns a form.
   */
  getFormApprovalStatus = (call: ServerUnaryCall<formsFormApprovalServiceApi.GetFormApprovalStatusRequest, formsFormApprovalServiceApi.GetFormApprovalStatusResponse>, done: sendUnaryData<formsFormApprovalServiceApi.GetFormApprovalStatusResponse>): void => {
    void this.workflow.getFormApprovalStatus(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists forms a page at a time.
   */
  listPendingForms = unary<formsFormApprovalServiceApi.ListPendingFormsRequest, formsFormApprovalServiceApi.ListPendingFormsResponse>(
    (request) => this.workflow.listPendingForms(request),
  );

  /**
   * Recalls a form.
   */
  recallForm = unary<formsFormApprovalServiceApi.RecallFormRequest, formsFormApprovalServiceApi.RecallFormResponse>(
    (request) => this.workflow.recallForm(request),
  );

  /**
   * Rejects a form.
   */
  rejectForm = (call: ServerUnaryCall<formsFormApprovalServiceApi.RejectFormRequest, formsFormApprovalServiceApi.RejectFormResponse>, done: sendUnaryData<formsFormApprovalServiceApi.RejectFormResponse>): void => {
    void this.workflow.rejectForm(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Submits a form.
   */
  submitForm = unary<formsFormApprovalServiceApi.SubmitFormRequest, formsFormApprovalServiceApi.SubmitFormResponse>(
    (request) => this.workflow.submitForm(request),
  );
}

export function implementation(handler: FormApprovalHandler): formsFormApprovalServiceApi.FormApprovalServiceServer {
  return {
    approveForm: handler.approveForm,
    commentFormApproval: handler.commentFormApproval,
    delegateFormApproval: handler.delegateFormApproval,
    escalateForm: handler.escalateForm,
    getFormApprovalStatus: handler.getFormApprovalStatus,
    listPendingForms: handler.listPendingForms,
    recallForm: handler.recallForm,
    rejectForm: handler.rejectForm,
    submitForm: handler.submitForm,
  };
}
