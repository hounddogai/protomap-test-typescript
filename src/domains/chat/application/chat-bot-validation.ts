/**
 * Checks chat bots against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as chatChatBotCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_calculation_service.js";
import * as chatChatBotValidationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_validation_service.js";
import * as chatChatRoomCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_calculation_service.js";
import * as chatChatRoomValidationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_validation_service.js";
import * as chatHandoffCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_calculation_service.js";
import * as communityForumValidationServiceApi from "../../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as documentsDocumentQueryServiceApi from "../../../../.cache/proto/acme/documents/v1/document_query_service.js";
import * as experimentsVariantQueryServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_query_service.js";
import * as localizationLocaleQueryServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_query_service.js";
import * as webhooksWebhookSecretCalculationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_secret_calculation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
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
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toChatBotRecord } from "../data/records.js";
import { ChatRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate chat bot operations and persist audit data.
 */
@injectable()
export class ChatBotValidationWorkflow {
  constructor(
    @inject(ChatRepository) private readonly repository: ChatRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.ChatBotCalculationService") private readonly chatChatBotCalculationClient: chatChatBotCalculationServiceApi.ChatBotCalculationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomCalculationService") private readonly chatChatRoomCalculationClient: chatChatRoomCalculationServiceApi.ChatRoomCalculationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomValidationService") private readonly chatChatRoomValidationClient: chatChatRoomValidationServiceApi.ChatRoomValidationServiceClient,
    @inject("grpc:acme.chat.v1.HandoffCalculationService") private readonly chatHandoffCalculationClient: chatHandoffCalculationServiceApi.HandoffCalculationServiceClient,
    @inject("grpc:acme.community.v1.ForumValidationService") private readonly communityForumValidationClient: communityForumValidationServiceApi.ForumValidationServiceClient,
    @inject("grpc:acme.documents.v1.DocumentQueryService") private readonly documentsDocumentQueryClient: documentsDocumentQueryServiceApi.DocumentQueryServiceClient,
    @inject("grpc:acme.experiments.v1.VariantQueryService") private readonly experimentsVariantQueryClient: experimentsVariantQueryServiceApi.VariantQueryServiceClient,
    @inject("grpc:acme.localization.v1.LocaleQueryService") private readonly localizationLocaleQueryClient: localizationLocaleQueryServiceApi.LocaleQueryServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretCalculationService") private readonly webhooksWebhookSecretCalculationClient: webhooksWebhookSecretCalculationServiceApi.WebhookSecretCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a chat bot.
   */
  async checkChatBotEligibility(req: chatChatBotValidationServiceApi.CheckChatBotEligibilityRequest): Promise<chatChatBotValidationServiceApi.CheckChatBotEligibilityResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "CheckChatBotEligibility", req);
    this.logger.info("check_chat_bot_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = documentsDocumentQueryServiceApi.SuggestDocumentsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.chatBot?.audit?.createdAt,
        ownerId: (req?.chatBot?.chatBotId ?? ""),
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.documents.v1.SuggestDocumentsRequest",
      value: Buffer.from(documentsDocumentQueryServiceApi.SuggestDocumentsRequest.encode(request1).finish()),
    });
    const unpacked1 = documentsDocumentQueryServiceApi.SuggestDocumentsRequest.decode(envelope1.value);
    const invoke1: Unary<documentsDocumentQueryServiceApi.SuggestDocumentsRequest, documentsDocumentQueryServiceApi.SuggestDocumentsResponse> =
      (input, done) => this.documentsDocumentQueryClient.suggestDocuments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<documentsDocumentQueryServiceApi.SuggestDocumentsRequest, documentsDocumentQueryServiceApi.SuggestDocumentsResponse>(invoke1, unpacked1);
    const request2 = chatChatRoomCalculationServiceApi.CompareChatRoomOptionsRequest.fromPartial({
      chatRoom: { audit: { etag: (req?.chatBot?.audit?.etag ?? "") } },
      context: req?.context,
    });
    const client2 = this.clients.get<chatChatRoomCalculationServiceApi.ChatRoomCalculationServiceClient>("acme.chat.v1.ChatRoomCalculationService");
    const invoke2: Unary<chatChatRoomCalculationServiceApi.CompareChatRoomOptionsRequest, chatChatRoomCalculationServiceApi.CompareChatRoomOptionsResponse> =
      (input, done) => client2.compareChatRoomOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatChatRoomCalculationServiceApi.CompareChatRoomOptionsRequest, chatChatRoomCalculationServiceApi.CompareChatRoomOptionsResponse>(invoke2, request2);
    const request3 = chatChatRoomValidationServiceApi.ValidateChatRoomRequest.fromPartial({
      chatRoom: {
        locator: { $case: "address", address: {
          recipient: ((reply2?.chatRoom?.locator?.$case === "address" ? reply2?.chatRoom?.locator.address : undefined)?.recipient ?? ""),
        } },
        audit: {
          etag: (reply2?.chatRoom?.audit?.etag ?? ""),
          updatedAt: req?.chatBot?.audit?.updatedAt,
        },
        components: { primary: {
          description: (reply2?.chatRoom?.components?.["primary"]?.description ?? ""),
        } },
      },
      context: req?.context,
    });
    const invoke3: Unary<chatChatRoomValidationServiceApi.ValidateChatRoomRequest, chatChatRoomValidationServiceApi.ValidateChatRoomResponse> =
      (input, done) => this.chatChatRoomValidationClient.validateChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port3: RequestPort<chatChatRoomValidationServiceApi.ValidateChatRoomRequest, chatChatRoomValidationServiceApi.ValidateChatRoomResponse> = new GrpcAdapter(invoke3);
    const reply3 = await port3.execute(request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotValidationServiceApi.CheckChatBotEligibilityResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      chatChatBotValidationServiceApi.CheckChatBotEligibilityResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      chatChatBotValidationServiceApi.CheckChatBotEligibilityResponse.fromPartial({
        chatBot: { owner: { displayName: (reply3?.chatRoom?.owner?.displayName ?? "") } },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      chatChatBotValidationServiceApi.CheckChatBotEligibilityResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          name: (req?.chatBot?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a chat bot.
   */
  async explainChatBotDecision(req: chatChatBotValidationServiceApi.ExplainChatBotDecisionRequest): Promise<chatChatBotValidationServiceApi.ExplainChatBotDecisionResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "ExplainChatBotDecision", req);
    this.logger.info("explain_chat_bot_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.details?.contact?.phone ?? "") } },
      webhookSecret: {
        contact: {
          email: (req?.chatBot?.owner?.email ?? ""),
          preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
        },
        limits: [{
          amount: (req?.chatBot?.action?.$case === "discount" ? req?.chatBot?.action.discount : undefined)?.amount,
        }],
      },
    });
    const invoke1: Unary<webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest, webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationResponse> =
      (input, done) => this.webhooksWebhookSecretCalculationClient.explainWebhookSecretCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest, webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationResponse>(invoke1, request1));
    const request2 = chatHandoffCalculationServiceApi.EstimateHandoffRequest.fromPartial({
      context: req?.context,
      handoff: { comments: [{ createdAt: reply1?.webhookSecret?.audit?.createdAt }] },
    });
    const invoke2: Unary<chatHandoffCalculationServiceApi.EstimateHandoffRequest, chatHandoffCalculationServiceApi.EstimateHandoffResponse> =
      (input, done) => this.chatHandoffCalculationClient.estimateHandoff(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("ExplainChatBotDecision.EstimateHandoff", () => call<chatHandoffCalculationServiceApi.EstimateHandoffRequest, chatHandoffCalculationServiceApi.EstimateHandoffResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotValidationServiceApi.ExplainChatBotDecisionResponse.fromPartial({
        outcome: { status: (reply1?.outcome?.status ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      chatChatBotValidationServiceApi.ExplainChatBotDecisionResponse.fromPartial({ chatBot: { audit: { updatedAt: reply2?.handoff?.audit?.updatedAt } } }),
      chatChatBotValidationServiceApi.ExplainChatBotDecisionResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          description: (req?.chatBot?.description ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a chat bot.
   */
  async getChatBotRules(req: chatChatBotValidationServiceApi.GetChatBotRulesRequest): Promise<chatChatBotValidationServiceApi.GetChatBotRulesResponse> {
    validateContext(req.context);
    if (!req.chatBotId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_bot_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetChatBotRules", req);
    this.logger.info("get_chat_bot_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = documentsDocumentQueryServiceApi.ResolveDocumentsRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<documentsDocumentQueryServiceApi.ResolveDocumentsRequest, documentsDocumentQueryServiceApi.ResolveDocumentsResponse> =
      (input, done) => this.documentsDocumentQueryClient.resolveDocuments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    return mergeResponses(
      chatChatBotValidationServiceApi.GetChatBotRulesResponse.fromPartial({
        result: {
          referenceIds: (reply1?.result?.referenceIds ?? []),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      chatChatBotValidationServiceApi.GetChatBotRulesResponse.fromPartial({ chatBot: { chatBotId: (req?.chatBotId ?? "") } }),
    );
  }

  /**
   * Lints a chat bot.
   */
  async lintChatBots(req: chatChatBotValidationServiceApi.LintChatBotsRequest): Promise<chatChatBotValidationServiceApi.LintChatBotsResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "LintChatBots", req);
    this.logger.info("lint_chat_bots", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomValidationServiceApi.LintChatRoomsRequest.fromPartial({
      chatRoom: {
        audit: {
          createdBy: (req?.chatBot?.audit?.createdBy ?? ""),
          etag: (req?.chatBot?.audit?.etag ?? ""),
          updatedAt: req?.chatBot?.audit?.updatedAt,
        },
        owner: { displayName: (req?.chatBot?.owner?.displayName ?? "") },
      },
      context: req?.context,
    });
    const reply1 = await this.workQueue.enqueue<chatChatRoomValidationServiceApi.LintChatRoomsRequest, chatChatRoomValidationServiceApi.LintChatRoomsResponse>(
      "acme.chat.v1.ChatBotValidationService/LintChatBots:0", request1,
    );
    const tasks2: Array<() => Promise<chatChatBotCalculationServiceApi.ExplainChatBotCalculationResponse>> = [];
    for (const item of (req?.chatBot?.conditions ?? [])) {
      tasks2.push(async () => {
        const request2 = chatChatBotCalculationServiceApi.ExplainChatBotCalculationRequest.fromPartial({
          chatBot: {
            conditions: [{
              attribute: (item?.attribute ?? ""),
              negate: (item?.negate ?? false),
              operator: (item?.operator ?? ""),
              value: (item?.value ?? ""),
            }],
          },
          context: req?.context,
        });
        const invoke2: Unary<chatChatBotCalculationServiceApi.ExplainChatBotCalculationRequest, chatChatBotCalculationServiceApi.ExplainChatBotCalculationResponse> =
          (input, done) => this.chatChatBotCalculationClient.explainChatBotCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<chatChatBotCalculationServiceApi.ExplainChatBotCalculationRequest, chatChatBotCalculationServiceApi.ExplainChatBotCalculationResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? chatChatBotCalculationServiceApi.ExplainChatBotCalculationResponse.fromPartial({});
    const request3 = chatChatRoomValidationServiceApi.ValidateChatRoomRequest.fromPartial({
      chatRoom: {
        audit: { updatedAt: reply2?.chatBot?.audit?.updatedAt },
        components: { primary: {
          componentId: (reply1?.chatRoom?.components?.["primary"]?.componentId ?? ""),
        } },
      },
      context: req?.context,
    });
    const invoke3: Unary<chatChatRoomValidationServiceApi.ValidateChatRoomRequest, chatChatRoomValidationServiceApi.ValidateChatRoomResponse> =
      (input, done) => this.chatChatRoomValidationClient.validateChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await inRequest(req.context!, () => call<chatChatRoomValidationServiceApi.ValidateChatRoomRequest, chatChatRoomValidationServiceApi.ValidateChatRoomResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotValidationServiceApi.LintChatBotsResponse.fromPartial({
        chatBot: {
          description: (reply1?.chatRoom?.components?.["primary"]?.description ?? ""),
        },
        result: { message: (reply1?.outcome?.message ?? "") },
      }),
      chatChatBotValidationServiceApi.LintChatBotsResponse.fromPartial({
        chatBot: {
          description: (reply3?.chatRoom?.components?.["primary"]?.description ?? ""),
        },
      }),
      chatChatBotValidationServiceApi.LintChatBotsResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          effective: req?.chatBot?.effective,
        },
      }),
    );
  }

  /**
   * Normalizes a chat bot.
   */
  async normalizeChatBot(req: chatChatBotValidationServiceApi.NormalizeChatBotRequest): Promise<chatChatBotValidationServiceApi.NormalizeChatBotResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "NormalizeChatBot", req);
    this.logger.info("normalize_chat_bot", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomValidationServiceApi.ValidateChatRoomRequest.fromPartial({
      chatRoom: { audit: { etag: (req?.chatBot?.audit?.etag ?? "") } },
      context: req?.context,
      details: { contact: { name: req?.details?.contact?.name } },
    });
    const invoke1: Unary<chatChatRoomValidationServiceApi.ValidateChatRoomRequest, chatChatRoomValidationServiceApi.ValidateChatRoomResponse> =
      (input, done) => this.chatChatRoomValidationClient.validateChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<chatChatRoomValidationServiceApi.ValidateChatRoomResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = chatChatRoomValidationServiceApi.LintChatRoomsRequest.fromPartial({
      chatRoom: { dimensions: { length: (reply1?.chatRoom?.dimensions?.length ?? 0) } },
      context: req?.context,
    });
    const invoke2: Unary<chatChatRoomValidationServiceApi.LintChatRoomsRequest, chatChatRoomValidationServiceApi.LintChatRoomsResponse> =
      (input, done) => this.chatChatRoomValidationClient.lintChatRooms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotValidationServiceApi.NormalizeChatBotResponse.fromPartial({ outcome: { status: (reply1?.outcome?.status ?? "") } }),
      chatChatBotValidationServiceApi.NormalizeChatBotResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      chatChatBotValidationServiceApi.NormalizeChatBotResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          version: (req?.chatBot?.version ?? 0),
        },
      }),
    );
  }

  /**
   * Previews a chat bot.
   */
  async previewChatBot(req: chatChatBotValidationServiceApi.PreviewChatBotRequest): Promise<chatChatBotValidationServiceApi.PreviewChatBotResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "PreviewChatBot", req);
    this.logger.info("preview_chat_bot", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantQueryServiceApi.SuggestVariantsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.chatBot?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.chatBot?.parameters ?? {}))),
        ownerId: (req?.chatBot?.chatBotId ?? ""),
      },
    });
    const invoke1: Unary<experimentsVariantQueryServiceApi.SuggestVariantsRequest, experimentsVariantQueryServiceApi.SuggestVariantsResponse> =
      (input, done) => this.experimentsVariantQueryClient.suggestVariants(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = chatChatRoomValidationServiceApi.LintChatRoomsRequest.fromPartial({
      chatRoom: {
        owner: {
          displayName: (req?.chatBot?.owner?.displayName ?? ""),
          email: (req?.chatBot?.owner?.email ?? ""),
        },
      },
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.contact?.email ?? ""),
          preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const method2 = "lintChatRooms" as const;
    const invoke2: Unary<chatChatRoomValidationServiceApi.LintChatRoomsRequest, chatChatRoomValidationServiceApi.LintChatRoomsResponse> =
      (input, done) => this.chatChatRoomValidationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatChatRoomValidationServiceApi.LintChatRoomsRequest, chatChatRoomValidationServiceApi.LintChatRoomsResponse>(invoke2, request2);
    const request3 = chatHandoffCalculationServiceApi.EstimateHandoffRequest.fromPartial({
      context: req?.context,
      handoff: {
        assignee: { displayName: (req?.chatBot?.owner?.displayName ?? "") },
        origin: { $case: "customer", customer: { displayName: (reply2?.chatRoom?.owner?.displayName ?? "") } },
        requester: { email: (reply2?.chatRoom?.owner?.email ?? "") },
      },
    });
    const proxy3 = forwarding(this.chatHandoffCalculationClient);
    const invoke3: Unary<chatHandoffCalculationServiceApi.EstimateHandoffRequest, chatHandoffCalculationServiceApi.EstimateHandoffResponse> =
      (input, done) => proxy3.estimateHandoff(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<chatHandoffCalculationServiceApi.EstimateHandoffRequest, chatHandoffCalculationServiceApi.EstimateHandoffResponse>(invoke3, request3);
    const request4 = chatChatRoomValidationServiceApi.CheckChatRoomEligibilityRequest.fromPartial({
      chatRoom: {
        audit: { updatedAt: reply2?.chatRoom?.audit?.updatedAt },
        dimensions: { width: (reply2?.chatRoom?.dimensions?.width ?? 0) },
      },
      context: req?.context,
      details: {
        contact: { preferredChannel: (req?.details?.contact?.preferredChannel ?? "") },
      },
    });
    const invoke4: Unary<chatChatRoomValidationServiceApi.CheckChatRoomEligibilityRequest, chatChatRoomValidationServiceApi.CheckChatRoomEligibilityResponse> =
      (input, done) => this.chatChatRoomValidationClient.checkChatRoomEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<chatChatRoomValidationServiceApi.CheckChatRoomEligibilityRequest, chatChatRoomValidationServiceApi.CheckChatRoomEligibilityResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotValidationServiceApi.PreviewChatBotResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      chatChatBotValidationServiceApi.PreviewChatBotResponse.fromPartial({
        chatBot: { audit: { createdAt: reply2?.chatRoom?.audit?.createdAt } },
        result: { message: (reply2?.outcome?.message ?? "") },
      }),
      chatChatBotValidationServiceApi.PreviewChatBotResponse.fromPartial({ chatBot: { audit: { updatedAt: reply3?.handoff?.audit?.updatedAt } } }),
      chatChatBotValidationServiceApi.PreviewChatBotResponse.fromPartial({ outcome: { status: (reply4?.result?.status ?? "") } }),
      chatChatBotValidationServiceApi.PreviewChatBotResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          description: (req?.chatBot?.description ?? ""),
        },
      }),
    );
  }

  /**
   * Scores a chat bot.
   */
  async scoreChatBot(req: chatChatBotValidationServiceApi.ScoreChatBotRequest): Promise<chatChatBotValidationServiceApi.ScoreChatBotResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "ScoreChatBot", req);
    this.logger.info("score_chat_bot", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationLocaleQueryServiceApi.ResolveLocalesRequest.fromPartial({ context: req?.context });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<localizationLocaleQueryServiceApi.ResolveLocalesRequest, localizationLocaleQueryServiceApi.ResolveLocalesResponse> =
      (input, done) => this.localizationLocaleQueryClient.resolveLocales(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationLocaleQueryServiceApi.ResolveLocalesRequest, localizationLocaleQueryServiceApi.ResolveLocalesResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = chatHandoffCalculationServiceApi.EstimateHandoffRequest.fromPartial({
      context: input2?.context,
      details: {
        destination: { recipient: (input2?.details?.destination?.recipient ?? "") },
      },
      handoff: { assignee: { email: (input2?.chatBot?.owner?.email ?? "") } },
    });
    const invoke2: Unary<chatHandoffCalculationServiceApi.EstimateHandoffRequest, chatHandoffCalculationServiceApi.EstimateHandoffResponse> =
      (input, done) => this.chatHandoffCalculationClient.estimateHandoff(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatHandoffCalculationServiceApi.EstimateHandoffRequest, chatHandoffCalculationServiceApi.EstimateHandoffResponse>(invoke2, request2);
    const request3 = communityForumValidationServiceApi.CheckForumEligibilityRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            audit: { createdBy: (req?.chatBot?.audit?.createdBy ?? "") },
            manager: { userId: (reply2?.handoff?.assignee?.userId ?? "") },
          }],
        }],
      },
    });
    const cloned3: communityForumValidationServiceApi.CheckForumEligibilityRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<communityForumValidationServiceApi.CheckForumEligibilityRequest, communityForumValidationServiceApi.CheckForumEligibilityResponse> =
      (input, done) => this.communityForumValidationClient.checkForumEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<communityForumValidationServiceApi.CheckForumEligibilityRequest, communityForumValidationServiceApi.CheckForumEligibilityResponse>(invoke3, cloned3);
    const request4 = chatChatRoomValidationServiceApi.ValidateChatRoomRequest.fromPartial({
      chatRoom: {
        locator: { $case: "address", address: {
          locality: (reply3?.forum?.location?.locality ?? ""),
          postalCode: (req?.details?.destination?.postalCode ?? ""),
        } },
        audit: { etag: (req?.chatBot?.audit?.etag ?? "") },
        owner: {
          displayName: ((reply2?.handoff?.origin?.$case === "customer" ? reply2?.handoff?.origin.customer : undefined)?.displayName ?? ""),
        },
      },
      context: req?.context,
    });
    const decoded4 = chatChatRoomValidationServiceApi.ValidateChatRoomRequest.fromJSON(
      JSON.parse(JSON.stringify(chatChatRoomValidationServiceApi.ValidateChatRoomRequest.toJSON(request4))),
    );
    const invoke4: Unary<chatChatRoomValidationServiceApi.ValidateChatRoomRequest, chatChatRoomValidationServiceApi.ValidateChatRoomResponse> =
      (input, done) => this.chatChatRoomValidationClient.validateChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<chatChatRoomValidationServiceApi.ValidateChatRoomRequest, chatChatRoomValidationServiceApi.ValidateChatRoomResponse>(invoke4, decoded4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotValidationServiceApi.ScoreChatBotResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      chatChatBotValidationServiceApi.ScoreChatBotResponse.fromPartial({
        chatBot: { audit: { createdBy: (reply2?.handoff?.audit?.createdBy ?? "") } },
      }),
      chatChatBotValidationServiceApi.ScoreChatBotResponse.fromPartial({ chatBot: { audit: { createdAt: reply3?.forum?.audit?.createdAt } } }),
      chatChatBotValidationServiceApi.ScoreChatBotResponse.fromPartial({
        chatBot: {
          audit: {
            createdBy: (reply4?.chatRoom?.audit?.createdBy ?? ""),
            updatedBy: (reply4?.chatRoom?.audit?.updatedBy ?? ""),
          },
        },
      }),
      chatChatBotValidationServiceApi.ScoreChatBotResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          parameters: (req?.chatBot?.parameters ?? {}),
        },
      }),
    );
  }

  /**
   * Validates a chat bot.
   */
  async validateChatBot(req: chatChatBotValidationServiceApi.ValidateChatBotRequest): Promise<chatChatBotValidationServiceApi.ValidateChatBotResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "ValidateChatBot", req);
    this.logger.info("validate_chat_bot", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatBotCalculationServiceApi.EstimateChatBotRequest.fromPartial({
      chatBot: {
        audit: {
          createdAt: req?.chatBot?.audit?.createdAt,
          updatedAt: req?.chatBot?.audit?.updatedAt,
        },
        action: { $case: "discount", discount: {
          amount: (req?.chatBot?.action?.$case === "discount" ? req?.chatBot?.action.discount : undefined)?.amount,
        } },
      },
      context: req?.context,
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.chat.v1.EstimateChatBotRequest",
      value: Buffer.from(chatChatBotCalculationServiceApi.EstimateChatBotRequest.encode(request1).finish()),
    });
    const unpacked1 = chatChatBotCalculationServiceApi.EstimateChatBotRequest.decode(envelope1.value);
    const invoke1: Unary<chatChatBotCalculationServiceApi.EstimateChatBotRequest, chatChatBotCalculationServiceApi.EstimateChatBotResponse> =
      (input, done) => this.chatChatBotCalculationClient.estimateChatBot(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatBotCalculationServiceApi.EstimateChatBotRequest, chatChatBotCalculationServiceApi.EstimateChatBotResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotValidationServiceApi.ValidateChatBotResponse.fromPartial({
        chatBot: { version: (reply1?.chatBot?.version ?? 0) },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      chatChatBotValidationServiceApi.ValidateChatBotResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          priority: (req?.chatBot?.priority ?? 0),
        },
      }),
    );
  }
}
