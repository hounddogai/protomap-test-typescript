/**
 * Checks participants against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as anomaliesAnomalyServiceApi from "../../../../.cache/proto/acme/anomalies/v1/anomaly_service.js";
import * as chatHandoffCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_calculation_service.js";
import * as ledgerLedgerAccountServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_service.js";
import * as mediaMediaAssetValidationServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_validation_service.js";
import * as messagingChannelValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_validation_service.js";
import * as messagingChatMessageValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_validation_service.js";
import * as messagingConversationValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_validation_service.js";
import * as messagingParticipantCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/participant_calculation_service.js";
import * as messagingParticipantValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/participant_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, promised, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toParticipantRecord } from "../data/records.js";
import { MessagingRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate participant operations and persist audit data.
 */
@injectable()
export class ParticipantValidationWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.anomalies.v1.AnomalyService") private readonly anomaliesAnomalyClient: anomaliesAnomalyServiceApi.AnomalyServiceClient,
    @inject("grpc:acme.chat.v1.HandoffCalculationService") private readonly chatHandoffCalculationClient: chatHandoffCalculationServiceApi.HandoffCalculationServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountService") private readonly ledgerLedgerAccountClient: ledgerLedgerAccountServiceApi.LedgerAccountServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetValidationService") private readonly mediaMediaAssetValidationClient: mediaMediaAssetValidationServiceApi.MediaAssetValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelValidationService") private readonly messagingChannelValidationClient: messagingChannelValidationServiceApi.ChannelValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageValidationService") private readonly messagingChatMessageValidationClient: messagingChatMessageValidationServiceApi.ChatMessageValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationValidationService") private readonly messagingConversationValidationClient: messagingConversationValidationServiceApi.ConversationValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantCalculationService") private readonly messagingParticipantCalculationClient: messagingParticipantCalculationServiceApi.ParticipantCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a participant.
   */
  async checkParticipantEligibility(req: messagingParticipantValidationServiceApi.CheckParticipantEligibilityRequest): Promise<messagingParticipantValidationServiceApi.CheckParticipantEligibilityResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "CheckParticipantEligibility", req);
    this.logger.info("check_participant_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChannelValidationServiceApi.PreviewChannelRequest.fromPartial({
      channel: {
        locator: { $case: "address", address: { recipient: (req?.participant?.primaryAddress?.recipient ?? "") } },
        audit: { createdAt: req?.participant?.audit?.createdAt },
        owner: {
          email: (req?.participant?.relationshipManager?.email ?? ""),
          userId: (req?.participant?.relationshipManager?.userId ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke1: Unary<messagingChannelValidationServiceApi.PreviewChannelRequest, messagingChannelValidationServiceApi.PreviewChannelResponse> =
      (input, done) => this.messagingChannelValidationClient.previewChannel(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<messagingChannelValidationServiceApi.PreviewChannelRequest, messagingChannelValidationServiceApi.PreviewChannelResponse>(invoke1, request1));
    const request2 = messagingParticipantCalculationServiceApi.RecalculateParticipantsRequest.fromPartial({
      context: req?.context,
      participant: {
        identityDocument: { $case: "passport", passport: {
          issuingCountry: ((req?.participant?.identityDocument?.$case === "nationalId" ? req?.participant?.identityDocument.nationalId : undefined)?.issuingCountry ?? ""),
        } },
        primaryAddress: {
          recipient: (req?.participant?.primaryAddress?.recipient ?? ""),
          region: ((reply1?.channel?.locator?.$case === "address" ? reply1?.channel?.locator.address : undefined)?.region ?? ""),
        },
      },
    });
    const invoke2: Unary<messagingParticipantCalculationServiceApi.RecalculateParticipantsRequest, messagingParticipantCalculationServiceApi.RecalculateParticipantsResponse> =
      (input, done) => this.messagingParticipantCalculationClient.recalculateParticipants(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<messagingParticipantCalculationServiceApi.RecalculateParticipantsResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = chatHandoffCalculationServiceApi.CompareHandoffOptionsRequest.fromPartial({
      context: req?.context,
      handoff: {
        assignee: { email: (reply1?.channel?.owner?.email ?? "") },
        audit: { createdBy: (reply2?.participant?.audit?.createdBy ?? "") },
      },
    });
    const invoke3: Unary<chatHandoffCalculationServiceApi.CompareHandoffOptionsRequest, chatHandoffCalculationServiceApi.CompareHandoffOptionsResponse> =
      (input, done) => this.chatHandoffCalculationClient.compareHandoffOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantValidationServiceApi.CheckParticipantEligibilityResponse.fromPartial({
        participant: {
          audit: { createdAt: reply1?.channel?.audit?.createdAt },
          primaryAddress: {
            lines: ((reply1?.channel?.locator?.$case === "address" ? reply1?.channel?.locator.address : undefined)?.lines ?? []),
          },
        },
      }),
      messagingParticipantValidationServiceApi.CheckParticipantEligibilityResponse.fromPartial({
        participant: {
          preferences: { language: (reply2?.participant?.preferences?.language ?? "") },
          relationshipManager: { email: (reply2?.participant?.relationshipManager?.email ?? "") },
        },
      }),
      messagingParticipantValidationServiceApi.CheckParticipantEligibilityResponse.fromPartial({
        participant: {
          relationshipManager: { email: (reply3?.handoff?.requester?.email ?? "") },
        },
      }),
      messagingParticipantValidationServiceApi.CheckParticipantEligibilityResponse.fromPartial({
        participant: {
          attributes: (req?.participant?.attributes ?? {}),
          participantId: (req?.participantId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a participant.
   */
  async getParticipantRules(req: messagingParticipantValidationServiceApi.GetParticipantRulesRequest): Promise<messagingParticipantValidationServiceApi.GetParticipantRulesResponse> {
    validateContext(req.context);
    if (!req.participantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "participant_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetParticipantRules", req);
    this.logger.info("get_participant_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = anomaliesAnomalyServiceApi.SearchAnomaliesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        ownerId: (req?.participantId ?? ""),
      },
    });
    const invoke1: Unary<anomaliesAnomalyServiceApi.SearchAnomaliesRequest, anomaliesAnomalyServiceApi.SearchAnomaliesResponse> =
      (input, done) => this.anomaliesAnomalyClient.searchAnomalies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    return mergeResponses(
      messagingParticipantValidationServiceApi.GetParticipantRulesResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      messagingParticipantValidationServiceApi.GetParticipantRulesResponse.fromPartial({ participant: { participantId: (req?.participantId ?? "") } }),
    );
  }

  /**
   * Lints a participant.
   */
  async lintParticipants(req: messagingParticipantValidationServiceApi.LintParticipantsRequest): Promise<messagingParticipantValidationServiceApi.LintParticipantsResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "LintParticipants", req);
    this.logger.info("lint_participants", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageValidationServiceApi.PreviewChatMessageRequest.fromPartial({
      chatMessage: {
        subject: {
          displayName: (req?.participant?.relationshipManager?.displayName ?? ""),
        },
      },
      context: req?.context,
      details: {
        contact: {
          email: (req?.participant?.contact?.email ?? ""),
          phone: (req?.participant?.contact?.phone ?? ""),
        },
      },
    });
    const method1 = "previewChatMessage" as const;
    const invoke1: Unary<messagingChatMessageValidationServiceApi.PreviewChatMessageRequest, messagingChatMessageValidationServiceApi.PreviewChatMessageResponse> =
      (input, done) => this.messagingChatMessageValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChatMessageValidationServiceApi.PreviewChatMessageRequest, messagingChatMessageValidationServiceApi.PreviewChatMessageResponse>(invoke1, request1);
    const request2 = messagingChannelValidationServiceApi.ValidateChannelRequest.fromPartial({
      channel: {
        locator: { $case: "address", address: { region: (req?.participant?.primaryAddress?.region ?? "") } },
      },
      context: req?.context,
    });
    const proxy2 = forwarding(this.messagingChannelValidationClient);
    const invoke2: Unary<messagingChannelValidationServiceApi.ValidateChannelRequest, messagingChannelValidationServiceApi.ValidateChannelResponse> =
      (input, done) => proxy2.validateChannel(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingChannelValidationServiceApi.ValidateChannelRequest, messagingChannelValidationServiceApi.ValidateChannelResponse>(invoke2, request2);
    const request3 = messagingParticipantCalculationServiceApi.CalculateParticipantRequest.fromPartial({
      context: req?.context,
      participant: { contact: { email: (reply2?.channel?.owner?.email ?? "") } },
    });
    const invoke3: Unary<messagingParticipantCalculationServiceApi.CalculateParticipantRequest, messagingParticipantCalculationServiceApi.CalculateParticipantResponse> =
      (input, done) => this.messagingParticipantCalculationClient.calculateParticipant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<messagingParticipantCalculationServiceApi.CalculateParticipantRequest, messagingParticipantCalculationServiceApi.CalculateParticipantResponse>(invoke3, request3);
    const request4 = mediaMediaAssetValidationServiceApi.PreviewMediaAssetRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        locator: { $case: "address", address: { recipient: (req?.participant?.primaryAddress?.recipient ?? "") } },
        audit: { updatedBy: (reply3?.participant?.audit?.updatedBy ?? "") },
        dimensions: { width: (reply2?.channel?.dimensions?.width ?? 0) },
      },
    });
    const { context: scope4, ...payload4 } = request4;
    const spread4 = { ...payload4, context: scope4 ?
      { ...scope4, baggage: { ...scope4.baggage } } : undefined };
    const invoke4: Unary<mediaMediaAssetValidationServiceApi.PreviewMediaAssetRequest, mediaMediaAssetValidationServiceApi.PreviewMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetValidationClient.previewMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<mediaMediaAssetValidationServiceApi.PreviewMediaAssetRequest, mediaMediaAssetValidationServiceApi.PreviewMediaAssetResponse>(invoke4, spread4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantValidationServiceApi.LintParticipantsResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      messagingParticipantValidationServiceApi.LintParticipantsResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      messagingParticipantValidationServiceApi.LintParticipantsResponse.fromPartial({ participant: { primaryAddress: reply3?.participant?.primaryAddress } }),
      messagingParticipantValidationServiceApi.LintParticipantsResponse.fromPartial({
        outcome: { message: (reply4?.outcome?.message ?? "") },
        participant: {
          primaryAddress: {
            locality: ((reply4?.mediaAsset?.locator?.$case === "address" ? reply4?.mediaAsset?.locator.address : undefined)?.locality ?? ""),
          },
        },
      }),
      messagingParticipantValidationServiceApi.LintParticipantsResponse.fromPartial({
        participant: {
          contact: req?.details?.contact,
          participantId: (req?.participantId ?? ""),
        },
      }),
    );
  }

  /**
   * Normalizes a participant.
   */
  async normalizeParticipant(req: messagingParticipantValidationServiceApi.NormalizeParticipantRequest): Promise<messagingParticipantValidationServiceApi.NormalizeParticipantResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "NormalizeParticipant", req);
    this.logger.info("normalize_participant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = messagingChannelValidationServiceApi.PreviewChannelRequest.fromPartial({
      channel: {
        locator: { $case: "address", address: {
          lines: (input1?.participant?.primaryAddress?.lines ?? []).map((value) => value),
        } },
      },
      context: input1?.context,
      details: { contact: { name: input1?.details?.contact?.name } },
    });
    const invoke1: Unary<messagingChannelValidationServiceApi.PreviewChannelRequest, messagingChannelValidationServiceApi.PreviewChannelResponse> =
      (input, done) => this.messagingChannelValidationClient.previewChannel(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChannelValidationServiceApi.PreviewChannelRequest, messagingChannelValidationServiceApi.PreviewChannelResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantValidationServiceApi.NormalizeParticipantResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      messagingParticipantValidationServiceApi.NormalizeParticipantResponse.fromPartial({
        participant: {
          participantId: (req?.participantId ?? ""),
          status: req?.participant?.status,
        },
      }),
    );
  }

  /**
   * Previews a participant.
   */
  async previewParticipant(req: messagingParticipantValidationServiceApi.PreviewParticipantRequest): Promise<messagingParticipantValidationServiceApi.PreviewParticipantResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "PreviewParticipant", req);
    this.logger.info("preview_participant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationValidationServiceApi.LintConversationsRequest.fromPartial({
      context: req?.context,
      conversation: {
        comments: [{ createdAt: req?.participant?.audit?.createdAt }],
        requester: { name: req?.details?.contact?.name },
      },
    });
    const cloned1: messagingConversationValidationServiceApi.LintConversationsRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<messagingConversationValidationServiceApi.LintConversationsRequest, messagingConversationValidationServiceApi.LintConversationsResponse> =
      (input, done) => this.messagingConversationValidationClient.lintConversations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingConversationValidationServiceApi.LintConversationsRequest, messagingConversationValidationServiceApi.LintConversationsResponse>(invoke1, cloned1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantValidationServiceApi.PreviewParticipantResponse.fromPartial({ outcome: { status: (reply1?.outcome?.status ?? "") } }),
      messagingParticipantValidationServiceApi.PreviewParticipantResponse.fromPartial({
        participant: {
          participantId: (req?.participantId ?? ""),
          relationshipManager: req?.participant?.relationshipManager,
        },
      }),
    );
  }

  /**
   * Scores a participant.
   */
  async scoreParticipant(req: messagingParticipantValidationServiceApi.ScoreParticipantRequest): Promise<messagingParticipantValidationServiceApi.ScoreParticipantResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "ScoreParticipant", req);
    this.logger.info("score_participant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ledgerLedgerAccountServiceApi.ListLedgerAccountsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: (req?.participant?.identityDocument?.$case === "passport" ? req?.participant?.identityDocument.passport : undefined)?.expiresAt,
        labels: Object.fromEntries(Object.entries((req?.participant?.attributes ?? {}))),
        ownerId: (req?.participant?.relationshipManager?.userId ?? ""),
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const decoded1 = ledgerLedgerAccountServiceApi.ListLedgerAccountsRequest.fromJSON(
      JSON.parse(JSON.stringify(ledgerLedgerAccountServiceApi.ListLedgerAccountsRequest.toJSON(request1))),
    );
    const invoke1: Unary<ledgerLedgerAccountServiceApi.ListLedgerAccountsRequest, ledgerLedgerAccountServiceApi.ListLedgerAccountsResponse> =
      (input, done) => this.ledgerLedgerAccountClient.listLedgerAccounts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<ledgerLedgerAccountServiceApi.ListLedgerAccountsRequest, ledgerLedgerAccountServiceApi.ListLedgerAccountsResponse>(invoke1, decoded1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantValidationServiceApi.ScoreParticipantResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      messagingParticipantValidationServiceApi.ScoreParticipantResponse.fromPartial({
        breakdown: { currencyCode: (req?.details?.currencyCode ?? "") },
        participant: { participantId: (req?.participantId ?? "") },
      }),
    );
  }

  /**
   * Validates a participant.
   */
  async validateParticipant(req: messagingParticipantValidationServiceApi.ValidateParticipantRequest): Promise<messagingParticipantValidationServiceApi.ValidateParticipantResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "ValidateParticipant", req);
    this.logger.info("validate_participant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingParticipantCalculationServiceApi.ExplainParticipantCalculationRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.participant?.contact?.phone ?? "") } },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.messaging.v1.ExplainParticipantCalculationRequest",
      value: Buffer.from(messagingParticipantCalculationServiceApi.ExplainParticipantCalculationRequest.encode(request1).finish()),
    });
    const unpacked1 = messagingParticipantCalculationServiceApi.ExplainParticipantCalculationRequest.decode(envelope1.value);
    const invoke1: Unary<messagingParticipantCalculationServiceApi.ExplainParticipantCalculationRequest, messagingParticipantCalculationServiceApi.ExplainParticipantCalculationResponse> =
      (input, done) => this.messagingParticipantCalculationClient.explainParticipantCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingParticipantCalculationServiceApi.ExplainParticipantCalculationRequest, messagingParticipantCalculationServiceApi.ExplainParticipantCalculationResponse>(invoke1, unpacked1);
    const request2 = messagingChannelValidationServiceApi.ExplainChannelDecisionRequest.fromPartial({
      channel: {
        owner: {
          displayName: (req?.participant?.relationshipManager?.displayName ?? ""),
        },
      },
      context: req?.context,
    });
    const client2 = this.clients.get<messagingChannelValidationServiceApi.ChannelValidationServiceClient>("acme.messaging.v1.ChannelValidationService");
    const invoke2: Unary<messagingChannelValidationServiceApi.ExplainChannelDecisionRequest, messagingChannelValidationServiceApi.ExplainChannelDecisionResponse> =
      (input, done) => client2.explainChannelDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingChannelValidationServiceApi.ExplainChannelDecisionRequest, messagingChannelValidationServiceApi.ExplainChannelDecisionResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantValidationServiceApi.ValidateParticipantResponse.fromPartial({
        participant: {
          audit: { etag: (reply1?.participant?.audit?.etag ?? "") },
          contact: { name: reply1?.participant?.name },
        },
      }),
      messagingParticipantValidationServiceApi.ValidateParticipantResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          message: (reply2?.outcome?.message ?? ""),
        },
      }),
      messagingParticipantValidationServiceApi.ValidateParticipantResponse.fromPartial({
        participant: {
          participantId: (req?.participantId ?? ""),
          primaryAddress: req?.participant?.primaryAddress,
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for ParticipantValidationService; workflows own validation and database transactions.
 */
@injectable()
export class ParticipantValidationHandler {
  constructor(@inject(ParticipantValidationWorkflow) private readonly workflow: ParticipantValidationWorkflow) {}

  /**
   * Checks a participant.
   */
  checkParticipantEligibility = unary<messagingParticipantValidationServiceApi.CheckParticipantEligibilityRequest, messagingParticipantValidationServiceApi.CheckParticipantEligibilityResponse>(
    (request) => this.workflow.checkParticipantEligibility(request),
  );

  /**
   * Returns a participant.
   */
  getParticipantRules = unary<messagingParticipantValidationServiceApi.GetParticipantRulesRequest, messagingParticipantValidationServiceApi.GetParticipantRulesResponse>(
    (request) => this.workflow.getParticipantRules(request),
  );

  /**
   * Lints a participant.
   */
  lintParticipants = (call: ServerUnaryCall<messagingParticipantValidationServiceApi.LintParticipantsRequest, messagingParticipantValidationServiceApi.LintParticipantsResponse>, done: sendUnaryData<messagingParticipantValidationServiceApi.LintParticipantsResponse>): void => {
    void this.workflow.lintParticipants(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Normalizes a participant.
   */
  normalizeParticipant = unary<messagingParticipantValidationServiceApi.NormalizeParticipantRequest, messagingParticipantValidationServiceApi.NormalizeParticipantResponse>(
    (request) => this.workflow.normalizeParticipant(request),
  );

  /**
   * Previews a participant.
   */
  previewParticipant = unary<messagingParticipantValidationServiceApi.PreviewParticipantRequest, messagingParticipantValidationServiceApi.PreviewParticipantResponse>(
    (request) => this.workflow.previewParticipant(request),
  );

  /**
   * Scores a participant.
   */
  scoreParticipant = (call: ServerUnaryCall<messagingParticipantValidationServiceApi.ScoreParticipantRequest, messagingParticipantValidationServiceApi.ScoreParticipantResponse>, done: sendUnaryData<messagingParticipantValidationServiceApi.ScoreParticipantResponse>): void => {
    void this.workflow.scoreParticipant(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Validates a participant.
   */
  validateParticipant = unary<messagingParticipantValidationServiceApi.ValidateParticipantRequest, messagingParticipantValidationServiceApi.ValidateParticipantResponse>(
    (request) => this.workflow.validateParticipant(request),
  );
}

export function implementation(handler: ParticipantValidationHandler): messagingParticipantValidationServiceApi.ParticipantValidationServiceServer {
  return {
    checkParticipantEligibility: handler.checkParticipantEligibility,
    getParticipantRules: handler.getParticipantRules,
    lintParticipants: handler.lintParticipants,
    normalizeParticipant: handler.normalizeParticipant,
    previewParticipant: handler.previewParticipant,
    scoreParticipant: handler.scoreParticipant,
    validateParticipant: handler.validateParticipant,
  };
}
