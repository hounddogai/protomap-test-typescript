/**
 * Keeps chat messages in step with the systems of record in other regions. Remote work stays behind typed client
 * ports.
 */

import * as authorizationAccessPolicyServiceApi from "../../../../../.cache/proto/acme/authorization/v1/access_policy_service.js";
import * as experimentsExperimentWorkflowServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_workflow_service.js";
import * as insurancePolicyServiceApi from "../../../../../.cache/proto/acme/insurance/v1/policy_service.js";
import * as messagingChannelCalculationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/channel_calculation_service.js";
import * as messagingChannelValidationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/channel_validation_service.js";
import * as messagingChatMessageSyncServiceApi from "../../../../../.cache/proto/acme/messaging/v1/chat_message_sync_service.js";
import * as messagingChatMessageValidationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/chat_message_validation_service.js";
import * as messagingParticipantCalculationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/participant_calculation_service.js";
import * as messagingParticipantValidationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/participant_validation_service.js";
import * as notificationsNotificationValidationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_validation_service.js";
import * as personalizationAffinityImportServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_import_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  operation,
  promised,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toChatMessageRecord } from "../../data/records.js";
import { MessagingRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate chat message operations and persist audit data.
 */
@injectable()
export class ChatMessageSyncWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyService") private readonly authorizationAccessPolicyClient: authorizationAccessPolicyServiceApi.AccessPolicyServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentWorkflowService") private readonly experimentsExperimentWorkflowClient: experimentsExperimentWorkflowServiceApi.ExperimentWorkflowServiceClient,
    @inject("grpc:acme.insurance.v1.PolicyService") private readonly insurancePolicyClient: insurancePolicyServiceApi.PolicyServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelCalculationService") private readonly messagingChannelCalculationClient: messagingChannelCalculationServiceApi.ChannelCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelValidationService") private readonly messagingChannelValidationClient: messagingChannelValidationServiceApi.ChannelValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageValidationService") private readonly messagingChatMessageValidationClient: messagingChatMessageValidationServiceApi.ChatMessageValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantCalculationService") private readonly messagingParticipantCalculationClient: messagingParticipantCalculationServiceApi.ParticipantCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantValidationService") private readonly messagingParticipantValidationClient: messagingParticipantValidationServiceApi.ParticipantValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationValidationService") private readonly notificationsNotificationValidationClient: notificationsNotificationValidationServiceApi.NotificationValidationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityImportService") private readonly personalizationAffinityImportClient: personalizationAffinityImportServiceApi.AffinityImportServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexValidationService") private readonly searchSearchIndexValidationClient: searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists chat messages a page at a time.
   */
  async listChatMessageConflicts(req: messagingChatMessageSyncServiceApi.ListChatMessageConflictsRequest): Promise<messagingChatMessageSyncServiceApi.ListChatMessageConflictsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListChatMessageConflicts", req);
    this.logger.info("list_chat_message_conflicts", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityImportServiceApi.ListAffinityImportsRequest.fromPartial({
      context: req?.context,
      filter: {
        ownerId: (req?.filter?.ownerId ?? ""),
        region: (req?.filter?.region ?? ""),
      },
      page: {
        pageSize: (req?.page?.pageSize ?? 0),
        pageToken: (req?.page?.pageToken ?? ""),
      },
    });
    const client1 = this.clients.get<personalizationAffinityImportServiceApi.AffinityImportServiceClient>("acme.personalization.v1.AffinityImportService");
    const invoke1: Unary<personalizationAffinityImportServiceApi.ListAffinityImportsRequest, personalizationAffinityImportServiceApi.ListAffinityImportsResponse> =
      (input, done) => client1.listAffinityImports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationAffinityImportServiceApi.ListAffinityImportsRequest, personalizationAffinityImportServiceApi.ListAffinityImportsResponse>(invoke1, request1);
    const request2 = notificationsNotificationValidationServiceApi.ScoreNotificationRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const invoke2: Unary<notificationsNotificationValidationServiceApi.ScoreNotificationRequest, notificationsNotificationValidationServiceApi.ScoreNotificationResponse> =
      (input, done) => this.notificationsNotificationValidationClient.scoreNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<notificationsNotificationValidationServiceApi.ScoreNotificationRequest, notificationsNotificationValidationServiceApi.ScoreNotificationResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      messagingChatMessageSyncServiceApi.ListChatMessageConflictsResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      messagingChatMessageSyncServiceApi.ListChatMessageConflictsResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
    );
  }

  /**
   * Pulls a chat message.
   */
  async pullChatMessages(req: messagingChatMessageSyncServiceApi.PullChatMessagesRequest): Promise<messagingChatMessageSyncServiceApi.PullChatMessagesResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "PullChatMessages", req);
    this.logger.info("pull_chat_messages", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = authorizationAccessPolicyServiceApi.CloneAccessPolicyRequest.fromPartial({
      accessPolicy: {
        owner: { displayName: (req?.chatMessage?.subject?.displayName ?? "") },
      },
      context: req?.context,
    });
    const invoke1: Unary<authorizationAccessPolicyServiceApi.CloneAccessPolicyRequest, authorizationAccessPolicyServiceApi.CloneAccessPolicyResponse> =
      (input, done) => this.authorizationAccessPolicyClient.cloneAccessPolicy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<authorizationAccessPolicyServiceApi.CloneAccessPolicyRequest, authorizationAccessPolicyServiceApi.CloneAccessPolicyResponse>(invoke1, request1));
    const request2 = messagingParticipantValidationServiceApi.ValidateParticipantRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (reply1?.accessPolicy?.owner?.email ?? "") } },
      participant: {
        relationshipManager: { userId: (reply1?.accessPolicy?.owner?.userId ?? "") },
      },
    });
    const invoke2: Unary<messagingParticipantValidationServiceApi.ValidateParticipantRequest, messagingParticipantValidationServiceApi.ValidateParticipantResponse> =
      (input, done) => this.messagingParticipantValidationClient.validateParticipant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("PullChatMessages.ValidateParticipant", () => call<messagingParticipantValidationServiceApi.ValidateParticipantRequest, messagingParticipantValidationServiceApi.ValidateParticipantResponse>(invoke2, request2));
    const request3 = experimentsExperimentWorkflowServiceApi.PauseExperimentWorkflowRequest.fromPartial({
      context: req?.context,
      experiment: {
        audit: { etag: (reply1?.accessPolicy?.audit?.etag ?? "") },
        organizer: { email: (reply2?.participant?.contact?.email ?? "") },
        participants: [{
          contact: {
            email: (reply2?.participant?.relationshipManager?.email ?? ""),
            phone: (reply2?.participant?.contact?.phone ?? ""),
          },
        }],
      },
    });
    const invoke3: Unary<experimentsExperimentWorkflowServiceApi.PauseExperimentWorkflowRequest, experimentsExperimentWorkflowServiceApi.PauseExperimentWorkflowResponse> =
      (input, done) => this.experimentsExperimentWorkflowClient.pauseExperimentWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageSyncServiceApi.PullChatMessagesResponse.fromPartial({
        chatMessage: {
          subject: { displayName: (reply1?.accessPolicy?.owner?.displayName ?? "") },
        },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      messagingChatMessageSyncServiceApi.PullChatMessagesResponse.fromPartial({
        outcome: {
          message: (reply2?.outcome?.message ?? ""),
          nextSteps: (reply2?.outcome?.nextSteps ?? []),
        },
      }),
      messagingChatMessageSyncServiceApi.PullChatMessagesResponse.fromPartial({ outcome: { effectiveAt: reply3?.outcome?.effectiveAt } }),
      messagingChatMessageSyncServiceApi.PullChatMessagesResponse.fromPartial({
        chatMessage: {
          chatMessageId: (req?.chatMessageId ?? ""),
          kind: (req?.chatMessage?.kind ?? ""),
        },
      }),
    );
  }

  /**
   * Pushs a chat message.
   */
  async pushChatMessage(req: messagingChatMessageSyncServiceApi.PushChatMessageRequest): Promise<messagingChatMessageSyncServiceApi.PushChatMessageResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "PushChatMessage", req);
    this.logger.info("push_chat_message", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.chatMessage?.measurements ?? []).map(async (item) => {
      const request1 = messagingParticipantValidationServiceApi.CheckParticipantEligibilityRequest.fromPartial({
        context: req?.context,
        participant: {
          identityDocument: { $case: "passport", passport: { expiresAt: item?.observedAt } },
          relationshipManager: { displayName: (req?.chatMessage?.subject?.displayName ?? "") },
        },
        reason: (req?.reason ?? ""),
      });
      const invoke1: Unary<messagingParticipantValidationServiceApi.CheckParticipantEligibilityRequest, messagingParticipantValidationServiceApi.CheckParticipantEligibilityResponse> =
        (input, done) => this.messagingParticipantValidationClient.checkParticipantEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<messagingParticipantValidationServiceApi.CheckParticipantEligibilityRequest, messagingParticipantValidationServiceApi.CheckParticipantEligibilityResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: messagingParticipantValidationServiceApi.CheckParticipantEligibilityResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? messagingParticipantValidationServiceApi.CheckParticipantEligibilityResponse.fromPartial({});
    const tasks2: Array<() => Promise<personalizationAffinityImportServiceApi.ListAffinityImportsResponse>> = [];
    for (const item of (req?.chatMessage?.measurements ?? [])) {
      tasks2.push(async () => {
        const request2 = personalizationAffinityImportServiceApi.ListAffinityImportsRequest.fromPartial({
          context: req?.context,
          filter: {
            createdAfter: item?.observedAt,
            ownerId: (req?.chatMessage?.correlationId ?? ""),
            region: (reply1?.participant?.primaryAddress?.region ?? ""),
          },
        });
        const invoke2: Unary<personalizationAffinityImportServiceApi.ListAffinityImportsRequest, personalizationAffinityImportServiceApi.ListAffinityImportsResponse> =
          (input, done) => this.personalizationAffinityImportClient.listAffinityImports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<personalizationAffinityImportServiceApi.ListAffinityImportsRequest, personalizationAffinityImportServiceApi.ListAffinityImportsResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? personalizationAffinityImportServiceApi.ListAffinityImportsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.details?.checksum ?? "") });
    return messagingChatMessageSyncServiceApi.PushChatMessageResponse.fromPartial({
      chatMessage: {
        attributes: (req?.chatMessage?.attributes ?? {}),
        chatMessageId: (req?.chatMessageId ?? ""),
      },
    });
  }

  /**
   * Reconciles a chat message.
   */
  async reconcileChatMessages(req: messagingChatMessageSyncServiceApi.ReconcileChatMessagesRequest): Promise<messagingChatMessageSyncServiceApi.ReconcileChatMessagesResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "ReconcileChatMessages", req);
    this.logger.info("reconcile_chat_messages", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingParticipantValidationServiceApi.CheckParticipantEligibilityRequest.fromPartial({
      context: req?.context,
      participant: {
        relationshipManager: { displayName: (req?.chatMessage?.subject?.displayName ?? "") },
      },
    });
    const reply1 = await this.workQueue.enqueue<messagingParticipantValidationServiceApi.CheckParticipantEligibilityRequest, messagingParticipantValidationServiceApi.CheckParticipantEligibilityResponse>(
      "acme.messaging.v1.ChatMessageSyncService/ReconcileChatMessages:0", request1,
    );
    const request2 = searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest.fromPartial({
      context: req?.context,
      searchIndex: {
        audit: { createdBy: (reply1?.participant?.audit?.createdBy ?? "") },
        owner: { userId: (reply1?.participant?.relationshipManager?.userId ?? "") },
      },
    });
    const invoke2: Unary<searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest, searchSearchIndexValidationServiceApi.NormalizeSearchIndexResponse> =
      (input, done) => this.searchSearchIndexValidationClient.normalizeSearchIndex(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest, searchSearchIndexValidationServiceApi.NormalizeSearchIndexResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageSyncServiceApi.ReconcileChatMessagesResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      messagingChatMessageSyncServiceApi.ReconcileChatMessagesResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          status: (reply2?.outcome?.status ?? ""),
        },
      }),
      messagingChatMessageSyncServiceApi.ReconcileChatMessagesResponse.fromPartial({
        chatMessage: {
          chatMessageId: (req?.chatMessageId ?? ""),
          correlationId: (req?.chatMessage?.correlationId ?? ""),
        },
      }),
    );
  }

  /**
   * Resolves a chat message.
   */
  async resolveChatMessageConflict(req: messagingChatMessageSyncServiceApi.ResolveChatMessageConflictRequest): Promise<messagingChatMessageSyncServiceApi.ResolveChatMessageConflictResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "ResolveChatMessageConflict", req);
    this.logger.info("resolve_chat_message_conflict", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChannelCalculationServiceApi.SimulateChannelRequest.fromPartial({
      channelId: (req?.chatMessage?.subject?.channelId ?? ""),
      context: req?.context,
    });
    const invoke1: Unary<messagingChannelCalculationServiceApi.SimulateChannelRequest, messagingChannelCalculationServiceApi.SimulateChannelResponse> =
      (input, done) => this.messagingChannelCalculationClient.simulateChannel(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<messagingChannelCalculationServiceApi.SimulateChannelResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageSyncServiceApi.ResolveChatMessageConflictResponse.fromPartial({ chatMessage: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      messagingChatMessageSyncServiceApi.ResolveChatMessageConflictResponse.fromPartial({
        chatMessage: {
          chatMessageId: (req?.chatMessageId ?? ""),
          kind: (req?.chatMessage?.kind ?? ""),
        },
      }),
    );
  }

  /**
   * Exchanges changes of chat messages with a peer.
   */
  async streamChatMessageChanges(req: messagingChatMessageSyncServiceApi.StreamChatMessageChangesRequest): Promise<messagingChatMessageSyncServiceApi.StreamChatMessageChangesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamChatMessageChanges", req);
    this.logger.info("stream_chat_message_changes", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all(((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.measurements ?? []).map(async (item) => {
      const request1 = messagingChannelValidationServiceApi.ExplainChannelDecisionRequest.fromPartial({
        channel: {
          audit: { createdAt: item?.observedAt },
          dimensions: { unit: (item?.unit ?? "") },
          owner: {
            displayName: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.subject?.displayName ?? ""),
          },
        },
        context: req?.context,
      });
      const invoke1: Unary<messagingChannelValidationServiceApi.ExplainChannelDecisionRequest, messagingChannelValidationServiceApi.ExplainChannelDecisionResponse> =
        (input, done) => this.messagingChannelValidationClient.explainChannelDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<messagingChannelValidationServiceApi.ExplainChannelDecisionRequest, messagingChannelValidationServiceApi.ExplainChannelDecisionResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? messagingChannelValidationServiceApi.ExplainChannelDecisionResponse.fromPartial({});
    const request2 = messagingParticipantCalculationServiceApi.CompareParticipantOptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: ((reply1?.channel?.locator?.$case === "address" ? reply1?.channel?.locator.address : undefined)?.lines ?? []).map((value) => value),
        },
      },
      participant: { audit: { updatedAt: reply1?.channel?.audit?.updatedAt } },
    });
    const invoke2: Unary<messagingParticipantCalculationServiceApi.CompareParticipantOptionsRequest, messagingParticipantCalculationServiceApi.CompareParticipantOptionsResponse> =
      (input, done) => this.messagingParticipantCalculationClient.compareParticipantOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionRequest.fromPartial({
      chatMessage: { subject: { displayName: (reply1?.channel?.owner?.displayName ?? "") } },
      context: req?.context,
      details: {
        contact: {
          email: (reply2?.participant?.relationshipManager?.email ?? ""),
          name: reply2?.participant?.contact?.name,
          preferredChannel: (reply2?.participant?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke3: Unary<messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionRequest, messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionResponse> =
      (input, done) => this.messagingChatMessageValidationClient.explainChatMessageDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke3 = promisify(invoke3);
    const reply3 = requireReply(await asyncInvoke3(request3));
    const request4 = insurancePolicyServiceApi.SearchPoliciesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.channel?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply3?.result?.details ?? {}))),
        ownerId: (reply3?.chatMessage?.chatMessageId ?? ""),
        region: (reply2?.participant?.primaryAddress?.region ?? ""),
      },
    });
    const method4 = "searchPolicies" as const;
    const invoke4: Unary<insurancePolicyServiceApi.SearchPoliciesRequest, insurancePolicyServiceApi.SearchPoliciesResponse> =
      (input, done) => this.insurancePolicyClient[method4](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<insurancePolicyServiceApi.SearchPoliciesRequest, insurancePolicyServiceApi.SearchPoliciesResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.cursor ?? "") });
    return mergeResponses(
      messagingChatMessageSyncServiceApi.StreamChatMessageChangesResponse.fromPartial({
        chatMessage: { correlationId: (reply2?.result?.correlationId ?? "") },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      messagingChatMessageSyncServiceApi.StreamChatMessageChangesResponse.fromPartial({ result: { details: (reply3?.result?.details ?? {}) } }),
      messagingChatMessageSyncServiceApi.StreamChatMessageChangesResponse.fromPartial({ result: { referenceIds: (reply4?.result?.referenceIds ?? []) } }),
      messagingChatMessageSyncServiceApi.StreamChatMessageChangesResponse.fromPartial({
        chatMessage: {
          sequence: ((req?.frame?.$case === "ack" ? req?.frame.ack : undefined)?.sequence ?? 0),
          source: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.source ?? ""),
        },
      }),
    );
  }

  /**
   * Syncs a chat message.
   */
  async syncChatMessages(req: messagingChatMessageSyncServiceApi.SyncChatMessagesRequest): Promise<messagingChatMessageSyncServiceApi.SyncChatMessagesResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "SyncChatMessages", req);
    this.logger.info("sync_chat_messages", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageValidationServiceApi.PreviewChatMessageRequest.fromPartial({
      chatMessage: { subject: { code: (req?.chatMessage?.subject?.code ?? "") } },
      context: req?.context,
    });
    const proxy1 = forwarding(this.messagingChatMessageValidationClient);
    const invoke1: Unary<messagingChatMessageValidationServiceApi.PreviewChatMessageRequest, messagingChatMessageValidationServiceApi.PreviewChatMessageResponse> =
      (input, done) => proxy1.previewChatMessage(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChatMessageValidationServiceApi.PreviewChatMessageRequest, messagingChatMessageValidationServiceApi.PreviewChatMessageResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageSyncServiceApi.SyncChatMessagesResponse.fromPartial({
        chatMessage: { correlationId: (reply1?.result?.correlationId ?? "") },
        result: { correlationId: (reply1?.chatMessage?.correlationId ?? "") },
      }),
      messagingChatMessageSyncServiceApi.SyncChatMessagesResponse.fromPartial({
        chatMessage: {
          attributes: (req?.chatMessage?.attributes ?? {}),
          chatMessageId: (req?.chatMessageId ?? ""),
        },
      }),
    );
  }
}
