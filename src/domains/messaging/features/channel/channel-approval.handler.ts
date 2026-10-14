/**
 * Routes channels through approval, with escalation and delegation.
 */

import * as messagingChannelApprovalServiceApi from "../../../../../.cache/proto/acme/messaging/v1/channel_approval_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { ChannelApprovalWorkflow } from "./channel-approval.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ChannelApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class ChannelApprovalHandler {
  constructor(@inject(ChannelApprovalWorkflow) private readonly workflow: ChannelApprovalWorkflow) {}

  /**
   * Approves a channel.
   */
  approveChannel = unary<messagingChannelApprovalServiceApi.ApproveChannelRequest, messagingChannelApprovalServiceApi.ApproveChannelResponse>(
    (request) => this.workflow.approveChannel(request),
  );

  /**
   * Delegates a channel.
   */
  delegateChannelApproval = (call: ServerUnaryCall<messagingChannelApprovalServiceApi.DelegateChannelApprovalRequest, messagingChannelApprovalServiceApi.DelegateChannelApprovalResponse>, done: sendUnaryData<messagingChannelApprovalServiceApi.DelegateChannelApprovalResponse>): void => {
    void this.workflow.delegateChannelApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Escalates a channel.
   */
  escalateChannel = unary<messagingChannelApprovalServiceApi.EscalateChannelRequest, messagingChannelApprovalServiceApi.EscalateChannelResponse>(
    (request) => this.workflow.escalateChannel(request),
  );

  /**
   * Returns a channel.
   */
  getChannelApprovalStatus = unary<messagingChannelApprovalServiceApi.GetChannelApprovalStatusRequest, messagingChannelApprovalServiceApi.GetChannelApprovalStatusResponse>(
    (request) => this.workflow.getChannelApprovalStatus(request),
  );

  /**
   * Recalls a channel.
   */
  recallChannel = (call: ServerUnaryCall<messagingChannelApprovalServiceApi.RecallChannelRequest, messagingChannelApprovalServiceApi.RecallChannelResponse>, done: sendUnaryData<messagingChannelApprovalServiceApi.RecallChannelResponse>): void => {
    void this.workflow.recallChannel(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Rejects a channel.
   */
  rejectChannel = unary<messagingChannelApprovalServiceApi.RejectChannelRequest, messagingChannelApprovalServiceApi.RejectChannelResponse>(
    (request) => this.workflow.rejectChannel(request),
  );

  /**
   * Submits a channel.
   */
  submitChannel = unary<messagingChannelApprovalServiceApi.SubmitChannelRequest, messagingChannelApprovalServiceApi.SubmitChannelResponse>(
    (request) => this.workflow.submitChannel(request),
  );
}

export function implementation(handler: ChannelApprovalHandler): messagingChannelApprovalServiceApi.ChannelApprovalServiceServer {
  return {
    approveChannel: handler.approveChannel,
    delegateChannelApproval: handler.delegateChannelApproval,
    escalateChannel: handler.escalateChannel,
    getChannelApprovalStatus: handler.getChannelApprovalStatus,
    recallChannel: handler.recallChannel,
    rejectChannel: handler.rejectChannel,
    submitChannel: handler.submitChannel,
  };
}
