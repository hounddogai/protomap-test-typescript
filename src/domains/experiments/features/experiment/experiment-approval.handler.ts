/**
 * Routes experiments through approval, with escalation and delegation.
 */

import * as experimentsExperimentApprovalServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_approval_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { ExperimentApprovalWorkflow } from "./experiment-approval.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ExperimentApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class ExperimentApprovalHandler {
  constructor(@inject(ExperimentApprovalWorkflow) private readonly workflow: ExperimentApprovalWorkflow) {}

  /**
   * Approves an experiment.
   */
  approveExperiment = unary<experimentsExperimentApprovalServiceApi.ApproveExperimentRequest, experimentsExperimentApprovalServiceApi.ApproveExperimentResponse>(
    (request) => this.workflow.approveExperiment(request),
  );

  /**
   * Comments an experiment.
   */
  commentExperimentApproval = (call: ServerUnaryCall<experimentsExperimentApprovalServiceApi.CommentExperimentApprovalRequest, experimentsExperimentApprovalServiceApi.CommentExperimentApprovalResponse>, done: sendUnaryData<experimentsExperimentApprovalServiceApi.CommentExperimentApprovalResponse>): void => {
    void this.workflow.commentExperimentApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Delegates an experiment.
   */
  delegateExperimentApproval = unary<experimentsExperimentApprovalServiceApi.DelegateExperimentApprovalRequest, experimentsExperimentApprovalServiceApi.DelegateExperimentApprovalResponse>(
    (request) => this.workflow.delegateExperimentApproval(request),
  );

  /**
   * Escalates an experiment.
   */
  escalateExperiment = unary<experimentsExperimentApprovalServiceApi.EscalateExperimentRequest, experimentsExperimentApprovalServiceApi.EscalateExperimentResponse>(
    (request) => this.workflow.escalateExperiment(request),
  );

  /**
   * Returns an experiment.
   */
  getExperimentApprovalStatus = (call: ServerUnaryCall<experimentsExperimentApprovalServiceApi.GetExperimentApprovalStatusRequest, experimentsExperimentApprovalServiceApi.GetExperimentApprovalStatusResponse>, done: sendUnaryData<experimentsExperimentApprovalServiceApi.GetExperimentApprovalStatusResponse>): void => {
    void this.workflow.getExperimentApprovalStatus(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists experiments a page at a time.
   */
  listPendingExperiments = unary<experimentsExperimentApprovalServiceApi.ListPendingExperimentsRequest, experimentsExperimentApprovalServiceApi.ListPendingExperimentsResponse>(
    (request) => this.workflow.listPendingExperiments(request),
  );

  /**
   * Recalls an experiment.
   */
  recallExperiment = unary<experimentsExperimentApprovalServiceApi.RecallExperimentRequest, experimentsExperimentApprovalServiceApi.RecallExperimentResponse>(
    (request) => this.workflow.recallExperiment(request),
  );

  /**
   * Rejects an experiment.
   */
  rejectExperiment = (call: ServerUnaryCall<experimentsExperimentApprovalServiceApi.RejectExperimentRequest, experimentsExperimentApprovalServiceApi.RejectExperimentResponse>, done: sendUnaryData<experimentsExperimentApprovalServiceApi.RejectExperimentResponse>): void => {
    void this.workflow.rejectExperiment(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Submits an experiment.
   */
  submitExperiment = unary<experimentsExperimentApprovalServiceApi.SubmitExperimentRequest, experimentsExperimentApprovalServiceApi.SubmitExperimentResponse>(
    (request) => this.workflow.submitExperiment(request),
  );
}

export function implementation(handler: ExperimentApprovalHandler): experimentsExperimentApprovalServiceApi.ExperimentApprovalServiceServer {
  return {
    approveExperiment: handler.approveExperiment,
    commentExperimentApproval: handler.commentExperimentApproval,
    delegateExperimentApproval: handler.delegateExperimentApproval,
    escalateExperiment: handler.escalateExperiment,
    getExperimentApprovalStatus: handler.getExperimentApprovalStatus,
    listPendingExperiments: handler.listPendingExperiments,
    recallExperiment: handler.recallExperiment,
    rejectExperiment: handler.rejectExperiment,
    submitExperiment: handler.submitExperiment,
  };
}
