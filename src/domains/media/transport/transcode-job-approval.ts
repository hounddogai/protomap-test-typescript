/**
 * Routes transcode jobs through approval, with escalation and delegation.
 */

import * as mediaTranscodeJobApprovalServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_approval_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { TranscodeJobApprovalWorkflow } from "../application/transcode-job-approval.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for TranscodeJobApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class TranscodeJobApprovalHandler {
  constructor(@inject(TranscodeJobApprovalWorkflow) private readonly workflow: TranscodeJobApprovalWorkflow) {}

  /**
   * Approves a transcode job.
   */
  approveTranscodeJob = (call: ServerUnaryCall<mediaTranscodeJobApprovalServiceApi.ApproveTranscodeJobRequest, mediaTranscodeJobApprovalServiceApi.ApproveTranscodeJobResponse>, done: sendUnaryData<mediaTranscodeJobApprovalServiceApi.ApproveTranscodeJobResponse>): void => {
    void this.workflow.approveTranscodeJob(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Comments a transcode job.
   */
  commentTranscodeJobApproval = unary<mediaTranscodeJobApprovalServiceApi.CommentTranscodeJobApprovalRequest, mediaTranscodeJobApprovalServiceApi.CommentTranscodeJobApprovalResponse>(
    (request) => this.workflow.commentTranscodeJobApproval(request),
  );

  /**
   * Delegates a transcode job.
   */
  delegateTranscodeJobApproval = unary<mediaTranscodeJobApprovalServiceApi.DelegateTranscodeJobApprovalRequest, mediaTranscodeJobApprovalServiceApi.DelegateTranscodeJobApprovalResponse>(
    (request) => this.workflow.delegateTranscodeJobApproval(request),
  );

  /**
   * Escalates a transcode job.
   */
  escalateTranscodeJob = (call: ServerUnaryCall<mediaTranscodeJobApprovalServiceApi.EscalateTranscodeJobRequest, mediaTranscodeJobApprovalServiceApi.EscalateTranscodeJobResponse>, done: sendUnaryData<mediaTranscodeJobApprovalServiceApi.EscalateTranscodeJobResponse>): void => {
    void this.workflow.escalateTranscodeJob(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a transcode job.
   */
  getTranscodeJobApprovalStatus = unary<mediaTranscodeJobApprovalServiceApi.GetTranscodeJobApprovalStatusRequest, mediaTranscodeJobApprovalServiceApi.GetTranscodeJobApprovalStatusResponse>(
    (request) => this.workflow.getTranscodeJobApprovalStatus(request),
  );

  /**
   * Lists transcode jobs a page at a time.
   */
  listPendingTranscodeJobs = unary<mediaTranscodeJobApprovalServiceApi.ListPendingTranscodeJobsRequest, mediaTranscodeJobApprovalServiceApi.ListPendingTranscodeJobsResponse>(
    (request) => this.workflow.listPendingTranscodeJobs(request),
  );

  /**
   * Recalls a transcode job.
   */
  recallTranscodeJob = (call: ServerUnaryCall<mediaTranscodeJobApprovalServiceApi.RecallTranscodeJobRequest, mediaTranscodeJobApprovalServiceApi.RecallTranscodeJobResponse>, done: sendUnaryData<mediaTranscodeJobApprovalServiceApi.RecallTranscodeJobResponse>): void => {
    void this.workflow.recallTranscodeJob(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Rejects a transcode job.
   */
  rejectTranscodeJob = unary<mediaTranscodeJobApprovalServiceApi.RejectTranscodeJobRequest, mediaTranscodeJobApprovalServiceApi.RejectTranscodeJobResponse>(
    (request) => this.workflow.rejectTranscodeJob(request),
  );

  /**
   * Submits a transcode job.
   */
  submitTranscodeJob = unary<mediaTranscodeJobApprovalServiceApi.SubmitTranscodeJobRequest, mediaTranscodeJobApprovalServiceApi.SubmitTranscodeJobResponse>(
    (request) => this.workflow.submitTranscodeJob(request),
  );
}

export function implementation(handler: TranscodeJobApprovalHandler): mediaTranscodeJobApprovalServiceApi.TranscodeJobApprovalServiceServer {
  return {
    approveTranscodeJob: handler.approveTranscodeJob,
    commentTranscodeJobApproval: handler.commentTranscodeJobApproval,
    delegateTranscodeJobApproval: handler.delegateTranscodeJobApproval,
    escalateTranscodeJob: handler.escalateTranscodeJob,
    getTranscodeJobApprovalStatus: handler.getTranscodeJobApprovalStatus,
    listPendingTranscodeJobs: handler.listPendingTranscodeJobs,
    recallTranscodeJob: handler.recallTranscodeJob,
    rejectTranscodeJob: handler.rejectTranscodeJob,
    submitTranscodeJob: handler.submitTranscodeJob,
  };
}
