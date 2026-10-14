/**
 * Routes affinities through approval, with escalation and delegation.
 */

import * as personalizationAffinityApprovalServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_approval_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { AffinityApprovalWorkflow } from "./affinity-approval.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for AffinityApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class AffinityApprovalHandler {
  constructor(@inject(AffinityApprovalWorkflow) private readonly workflow: AffinityApprovalWorkflow) {}

  /**
   * Approves an affinity.
   */
  approveAffinity = unary<personalizationAffinityApprovalServiceApi.ApproveAffinityRequest, personalizationAffinityApprovalServiceApi.ApproveAffinityResponse>(
    (request) => this.workflow.approveAffinity(request),
  );

  /**
   * Comments an affinity.
   */
  commentAffinityApproval = (call: ServerUnaryCall<personalizationAffinityApprovalServiceApi.CommentAffinityApprovalRequest, personalizationAffinityApprovalServiceApi.CommentAffinityApprovalResponse>, done: sendUnaryData<personalizationAffinityApprovalServiceApi.CommentAffinityApprovalResponse>): void => {
    void this.workflow.commentAffinityApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Delegates an affinity.
   */
  delegateAffinityApproval = unary<personalizationAffinityApprovalServiceApi.DelegateAffinityApprovalRequest, personalizationAffinityApprovalServiceApi.DelegateAffinityApprovalResponse>(
    (request) => this.workflow.delegateAffinityApproval(request),
  );

  /**
   * Escalates an affinity.
   */
  escalateAffinity = unary<personalizationAffinityApprovalServiceApi.EscalateAffinityRequest, personalizationAffinityApprovalServiceApi.EscalateAffinityResponse>(
    (request) => this.workflow.escalateAffinity(request),
  );

  /**
   * Returns an affinity.
   */
  getAffinityApprovalStatus = (call: ServerUnaryCall<personalizationAffinityApprovalServiceApi.GetAffinityApprovalStatusRequest, personalizationAffinityApprovalServiceApi.GetAffinityApprovalStatusResponse>, done: sendUnaryData<personalizationAffinityApprovalServiceApi.GetAffinityApprovalStatusResponse>): void => {
    void this.workflow.getAffinityApprovalStatus(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists affinities a page at a time.
   */
  listPendingAffinities = unary<personalizationAffinityApprovalServiceApi.ListPendingAffinitiesRequest, personalizationAffinityApprovalServiceApi.ListPendingAffinitiesResponse>(
    (request) => this.workflow.listPendingAffinities(request),
  );

  /**
   * Recalls an affinity.
   */
  recallAffinity = unary<personalizationAffinityApprovalServiceApi.RecallAffinityRequest, personalizationAffinityApprovalServiceApi.RecallAffinityResponse>(
    (request) => this.workflow.recallAffinity(request),
  );

  /**
   * Rejects an affinity.
   */
  rejectAffinity = (call: ServerUnaryCall<personalizationAffinityApprovalServiceApi.RejectAffinityRequest, personalizationAffinityApprovalServiceApi.RejectAffinityResponse>, done: sendUnaryData<personalizationAffinityApprovalServiceApi.RejectAffinityResponse>): void => {
    void this.workflow.rejectAffinity(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Submits an affinity.
   */
  submitAffinity = unary<personalizationAffinityApprovalServiceApi.SubmitAffinityRequest, personalizationAffinityApprovalServiceApi.SubmitAffinityResponse>(
    (request) => this.workflow.submitAffinity(request),
  );
}

export function implementation(handler: AffinityApprovalHandler): personalizationAffinityApprovalServiceApi.AffinityApprovalServiceServer {
  return {
    approveAffinity: handler.approveAffinity,
    commentAffinityApproval: handler.commentAffinityApproval,
    delegateAffinityApproval: handler.delegateAffinityApproval,
    escalateAffinity: handler.escalateAffinity,
    getAffinityApprovalStatus: handler.getAffinityApprovalStatus,
    listPendingAffinities: handler.listPendingAffinities,
    recallAffinity: handler.recallAffinity,
    rejectAffinity: handler.rejectAffinity,
    submitAffinity: handler.submitAffinity,
  };
}
