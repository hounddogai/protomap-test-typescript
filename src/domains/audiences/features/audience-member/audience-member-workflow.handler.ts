/**
 * Runs the long-lived workflow that takes an audience member from start to finish.
 */

import * as audiencesAudienceMemberWorkflowServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_member_workflow_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { AudienceMemberWorkflowWorkflow } from "./audience-member-workflow.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for AudienceMemberWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class AudienceMemberWorkflowHandler {
  constructor(@inject(AudienceMemberWorkflowWorkflow) private readonly workflow: AudienceMemberWorkflowWorkflow) {}

  /**
   * Advances an audience member.
   */
  advanceAudienceMemberWorkflow = unary<audiencesAudienceMemberWorkflowServiceApi.AdvanceAudienceMemberWorkflowRequest, audiencesAudienceMemberWorkflowServiceApi.AdvanceAudienceMemberWorkflowResponse>(
    (request) => this.workflow.advanceAudienceMemberWorkflow(request),
  );

  /**
   * Cancels an audience member.
   */
  cancelAudienceMemberWorkflow = (call: ServerUnaryCall<audiencesAudienceMemberWorkflowServiceApi.CancelAudienceMemberWorkflowRequest, audiencesAudienceMemberWorkflowServiceApi.CancelAudienceMemberWorkflowResponse>, done: sendUnaryData<audiencesAudienceMemberWorkflowServiceApi.CancelAudienceMemberWorkflowResponse>): void => {
    void this.workflow.cancelAudienceMemberWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns an audience member.
   */
  inspectAudienceMemberWorkflow = unary<audiencesAudienceMemberWorkflowServiceApi.InspectAudienceMemberWorkflowRequest, audiencesAudienceMemberWorkflowServiceApi.InspectAudienceMemberWorkflowResponse>(
    (request) => this.workflow.inspectAudienceMemberWorkflow(request),
  );

  /**
   * Lists audience members a page at a time.
   */
  listAudienceMemberWorkflows = unary<audiencesAudienceMemberWorkflowServiceApi.ListAudienceMemberWorkflowsRequest, audiencesAudienceMemberWorkflowServiceApi.ListAudienceMemberWorkflowsResponse>(
    (request) => this.workflow.listAudienceMemberWorkflows(request),
  );

  /**
   * Pauses an audience member.
   */
  pauseAudienceMemberWorkflow = (call: ServerUnaryCall<audiencesAudienceMemberWorkflowServiceApi.PauseAudienceMemberWorkflowRequest, audiencesAudienceMemberWorkflowServiceApi.PauseAudienceMemberWorkflowResponse>, done: sendUnaryData<audiencesAudienceMemberWorkflowServiceApi.PauseAudienceMemberWorkflowResponse>): void => {
    void this.workflow.pauseAudienceMemberWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Resumes an audience member.
   */
  resumeAudienceMemberWorkflow = unary<audiencesAudienceMemberWorkflowServiceApi.ResumeAudienceMemberWorkflowRequest, audiencesAudienceMemberWorkflowServiceApi.ResumeAudienceMemberWorkflowResponse>(
    (request) => this.workflow.resumeAudienceMemberWorkflow(request),
  );

  /**
   * Retrys an audience member.
   */
  retryAudienceMemberWorkflow = unary<audiencesAudienceMemberWorkflowServiceApi.RetryAudienceMemberWorkflowRequest, audiencesAudienceMemberWorkflowServiceApi.RetryAudienceMemberWorkflowResponse>(
    (request) => this.workflow.retryAudienceMemberWorkflow(request),
  );

  /**
   * Signals an audience member.
   */
  signalAudienceMemberWorkflow = (call: ServerUnaryCall<audiencesAudienceMemberWorkflowServiceApi.SignalAudienceMemberWorkflowRequest, audiencesAudienceMemberWorkflowServiceApi.SignalAudienceMemberWorkflowResponse>, done: sendUnaryData<audiencesAudienceMemberWorkflowServiceApi.SignalAudienceMemberWorkflowResponse>): void => {
    void this.workflow.signalAudienceMemberWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Starts an audience member.
   */
  startAudienceMemberWorkflow = unary<audiencesAudienceMemberWorkflowServiceApi.StartAudienceMemberWorkflowRequest, audiencesAudienceMemberWorkflowServiceApi.StartAudienceMemberWorkflowResponse>(
    (request) => this.workflow.startAudienceMemberWorkflow(request),
  );
}

export function implementation(handler: AudienceMemberWorkflowHandler): audiencesAudienceMemberWorkflowServiceApi.AudienceMemberWorkflowServiceServer {
  return {
    advanceAudienceMemberWorkflow: handler.advanceAudienceMemberWorkflow,
    cancelAudienceMemberWorkflow: handler.cancelAudienceMemberWorkflow,
    inspectAudienceMemberWorkflow: handler.inspectAudienceMemberWorkflow,
    listAudienceMemberWorkflows: handler.listAudienceMemberWorkflows,
    pauseAudienceMemberWorkflow: handler.pauseAudienceMemberWorkflow,
    resumeAudienceMemberWorkflow: handler.resumeAudienceMemberWorkflow,
    retryAudienceMemberWorkflow: handler.retryAudienceMemberWorkflow,
    signalAudienceMemberWorkflow: handler.signalAudienceMemberWorkflow,
    startAudienceMemberWorkflow: handler.startAudienceMemberWorkflow,
  };
}
