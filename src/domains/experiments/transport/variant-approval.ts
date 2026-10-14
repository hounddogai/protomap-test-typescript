/**
 * Routes variants through approval, with escalation and delegation.
 */

import * as experimentsVariantApprovalServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_approval_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { VariantApprovalWorkflow } from "../application/variant-approval.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for VariantApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class VariantApprovalHandler {
  constructor(@inject(VariantApprovalWorkflow) private readonly workflow: VariantApprovalWorkflow) {}

  /**
   * Approves a variant.
   */
  approveVariant = (call: ServerUnaryCall<experimentsVariantApprovalServiceApi.ApproveVariantRequest, experimentsVariantApprovalServiceApi.ApproveVariantResponse>, done: sendUnaryData<experimentsVariantApprovalServiceApi.ApproveVariantResponse>): void => {
    void this.workflow.approveVariant(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Comments a variant.
   */
  commentVariantApproval = unary<experimentsVariantApprovalServiceApi.CommentVariantApprovalRequest, experimentsVariantApprovalServiceApi.CommentVariantApprovalResponse>(
    (request) => this.workflow.commentVariantApproval(request),
  );

  /**
   * Delegates a variant.
   */
  delegateVariantApproval = unary<experimentsVariantApprovalServiceApi.DelegateVariantApprovalRequest, experimentsVariantApprovalServiceApi.DelegateVariantApprovalResponse>(
    (request) => this.workflow.delegateVariantApproval(request),
  );

  /**
   * Returns a variant.
   */
  getVariantApprovalStatus = (call: ServerUnaryCall<experimentsVariantApprovalServiceApi.GetVariantApprovalStatusRequest, experimentsVariantApprovalServiceApi.GetVariantApprovalStatusResponse>, done: sendUnaryData<experimentsVariantApprovalServiceApi.GetVariantApprovalStatusResponse>): void => {
    void this.workflow.getVariantApprovalStatus(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists variants a page at a time.
   */
  listPendingVariants = unary<experimentsVariantApprovalServiceApi.ListPendingVariantsRequest, experimentsVariantApprovalServiceApi.ListPendingVariantsResponse>(
    (request) => this.workflow.listPendingVariants(request),
  );

  /**
   * Submits a variant.
   */
  submitVariant = unary<experimentsVariantApprovalServiceApi.SubmitVariantRequest, experimentsVariantApprovalServiceApi.SubmitVariantResponse>(
    (request) => this.workflow.submitVariant(request),
  );
}

export function implementation(handler: VariantApprovalHandler): experimentsVariantApprovalServiceApi.VariantApprovalServiceServer {
  return {
    approveVariant: handler.approveVariant,
    commentVariantApproval: handler.commentVariantApproval,
    delegateVariantApproval: handler.delegateVariantApproval,
    getVariantApprovalStatus: handler.getVariantApprovalStatus,
    listPendingVariants: handler.listPendingVariants,
    submitVariant: handler.submitVariant,
  };
}
