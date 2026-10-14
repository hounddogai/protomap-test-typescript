/**
 * Checks handoffs against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as chatChatBotCalculationServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_bot_calculation_service.js";
import * as chatChatBotValidationServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_bot_validation_service.js";
import * as chatChatRoomCalculationServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_calculation_service.js";
import * as chatChatRoomValidationServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_validation_service.js";
import * as chatHandoffCalculationServiceApi from "../../../../../.cache/proto/acme/chat/v1/handoff_calculation_service.js";
import * as chatHandoffValidationServiceApi from "../../../../../.cache/proto/acme/chat/v1/handoff_validation_service.js";
import * as communityBadgeCalculationServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_calculation_service.js";
import * as concessionsConcessionStandServiceApi from "../../../../../.cache/proto/acme/concessions/v1/concession_stand_service.js";
import * as featureflagsFeatureFlagValidationServiceApi from "../../../../../.cache/proto/acme/featureflags/v1/feature_flag_validation_service.js";
import * as personalizationProfileServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_service.js";
import * as pipelinesPipelineServiceApi from "../../../../../.cache/proto/acme/pipelines/v1/pipeline_service.js";
import * as showsShowServiceApi from "../../../../../.cache/proto/acme/shows/v1/show_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
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
import { toHandoffRecord } from "../../data/records.js";
import { ChatRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate handoff operations and persist audit data.
 */
@injectable()
export class HandoffValidationWorkflow {
  constructor(
    @inject(ChatRepository) private readonly repository: ChatRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.ChatBotCalculationService") private readonly chatChatBotCalculationClient: chatChatBotCalculationServiceApi.ChatBotCalculationServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotValidationService") private readonly chatChatBotValidationClient: chatChatBotValidationServiceApi.ChatBotValidationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomCalculationService") private readonly chatChatRoomCalculationClient: chatChatRoomCalculationServiceApi.ChatRoomCalculationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomValidationService") private readonly chatChatRoomValidationClient: chatChatRoomValidationServiceApi.ChatRoomValidationServiceClient,
    @inject("grpc:acme.chat.v1.HandoffCalculationService") private readonly chatHandoffCalculationClient: chatHandoffCalculationServiceApi.HandoffCalculationServiceClient,
    @inject("grpc:acme.community.v1.BadgeCalculationService") private readonly communityBadgeCalculationClient: communityBadgeCalculationServiceApi.BadgeCalculationServiceClient,
    @inject("grpc:acme.concessions.v1.ConcessionStandService") private readonly concessionsConcessionStandClient: concessionsConcessionStandServiceApi.ConcessionStandServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagValidationService") private readonly featureflagsFeatureFlagValidationClient: featureflagsFeatureFlagValidationServiceApi.FeatureFlagValidationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileService") private readonly personalizationProfileClient: personalizationProfileServiceApi.ProfileServiceClient,
    @inject("grpc:acme.pipelines.v1.PipelineService") private readonly pipelinesPipelineClient: pipelinesPipelineServiceApi.PipelineServiceClient,
    @inject("grpc:acme.shows.v1.ShowService") private readonly showsShowClient: showsShowServiceApi.ShowServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a handoff.
   */
  async checkHandoffEligibility(req: chatHandoffValidationServiceApi.CheckHandoffEligibilityRequest): Promise<chatHandoffValidationServiceApi.CheckHandoffEligibilityResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "CheckHandoffEligibility", req);
    this.logger.info("check_handoff_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatBotCalculationServiceApi.EstimateChatBotRequest.fromPartial({
      chatBot: { audit: { updatedAt: req?.handoff?.audit?.updatedAt } },
      context: req?.context,
    });
    const invoke1: Unary<chatChatBotCalculationServiceApi.EstimateChatBotRequest, chatChatBotCalculationServiceApi.EstimateChatBotResponse> =
      (input, done) => this.chatChatBotCalculationClient.estimateChatBot(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("CheckHandoffEligibility.EstimateChatBot", () => call<chatChatBotCalculationServiceApi.EstimateChatBotRequest, chatChatBotCalculationServiceApi.EstimateChatBotResponse>(invoke1, request1));
    const request2 = featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.handoff?.assignee?.email ?? "") } },
      featureFlag: {
        action: { $case: "discount", discount: {
          amount: (reply1?.chatBot?.action?.$case === "discount" ? reply1?.chatBot?.action.discount : undefined)?.amount,
        } },
        owner: { email: (req?.handoff?.requester?.email ?? "") },
      },
    });
    const invoke2: Unary<featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagRequest, featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagResponse> =
      (input, done) => this.featureflagsFeatureFlagValidationClient.normalizeFeatureFlag(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffValidationServiceApi.CheckHandoffEligibilityResponse.fromPartial({
        handoff: {
          assignee: { userId: (reply1?.chatBot?.owner?.userId ?? "") },
          audit: { updatedAt: reply1?.chatBot?.audit?.updatedAt },
        },
      }),
      chatHandoffValidationServiceApi.CheckHandoffEligibilityResponse.fromPartial({
        outcome: {
          effectiveAt: reply2?.outcome?.effectiveAt,
          status: (reply2?.result?.status ?? ""),
        },
      }),
      chatHandoffValidationServiceApi.CheckHandoffEligibilityResponse.fromPartial({
        handoff: {
          handoffId: (req?.handoffId ?? ""),
          requester: req?.handoff?.requester,
        },
      }),
    );
  }

  /**
   * Explains a handoff.
   */
  async explainHandoffDecision(req: chatHandoffValidationServiceApi.ExplainHandoffDecisionRequest): Promise<chatHandoffValidationServiceApi.ExplainHandoffDecisionResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "ExplainHandoffDecision", req);
    this.logger.info("explain_handoff_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomCalculationServiceApi.QuoteChatRoomRequest.fromPartial({
      chatRoom: {
        audit: { createdAt: req?.handoff?.audit?.createdAt },
        owner: { userId: (req?.handoff?.assignee?.userId ?? "") },
      },
      context: req?.context,
    });
    const reply1 = await this.workQueue.enqueue<chatChatRoomCalculationServiceApi.QuoteChatRoomRequest, chatChatRoomCalculationServiceApi.QuoteChatRoomResponse>(
      "acme.chat.v1.HandoffValidationService/ExplainHandoffDecision:0", request1,
    );
    let selected2_1: string | undefined;
    switch (req?.handoff?.origin?.$case) {
      case "customer":
        selected2_1 = ((req?.handoff?.origin?.$case === "customer" ? req?.handoff?.origin.customer : undefined)?.displayName ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = chatChatRoomValidationServiceApi.NormalizeChatRoomRequest.fromPartial({
      chatRoom: {
        owner: {
          displayName: (selected2_1 ?? ""),
          userId: (reply1?.chatRoom?.owner?.userId ?? ""),
        },
      },
      context: req?.context,
      details: { contact: { email: (req?.handoff?.requester?.email ?? "") } },
    });
    const invoke2: Unary<chatChatRoomValidationServiceApi.NormalizeChatRoomRequest, chatChatRoomValidationServiceApi.NormalizeChatRoomResponse> =
      (input, done) => this.chatChatRoomValidationClient.normalizeChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatChatRoomValidationServiceApi.NormalizeChatRoomRequest, chatChatRoomValidationServiceApi.NormalizeChatRoomResponse>(invoke2, request2);
    const request3 = chatChatRoomCalculationServiceApi.CalculateChatRoomRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          postalCode: ((reply1?.chatRoom?.locator?.$case === "address" ? reply1?.chatRoom?.locator.address : undefined)?.postalCode ?? ""),
        },
      },
    });
    const invoke3: Unary<chatChatRoomCalculationServiceApi.CalculateChatRoomRequest, chatChatRoomCalculationServiceApi.CalculateChatRoomResponse> =
      (input, done) => this.chatChatRoomCalculationClient.calculateChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<chatChatRoomCalculationServiceApi.CalculateChatRoomResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request4 = chatChatRoomValidationServiceApi.ExplainChatRoomDecisionRequest.fromPartial({
      chatRoom: {
        audit: { createdAt: req?.handoff?.audit?.createdAt },
        components: { primary: {
          componentId: (reply3?.chatRoom?.components?.["primary"]?.componentId ?? ""),
        } },
        owner: { email: (req?.handoff?.requester?.email ?? "") },
      },
      context: req?.context,
    });
    const invoke4: Unary<chatChatRoomValidationServiceApi.ExplainChatRoomDecisionRequest, chatChatRoomValidationServiceApi.ExplainChatRoomDecisionResponse> =
      (input, done) => this.chatChatRoomValidationClient.explainChatRoomDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send4 = promised(invoke4);
    const reply4 = await send4(request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffValidationServiceApi.ExplainHandoffDecisionResponse.fromPartial({
        handoff: { audit: { updatedBy: (reply1?.chatRoom?.audit?.updatedBy ?? "") } },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      chatHandoffValidationServiceApi.ExplainHandoffDecisionResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          message: (reply2?.outcome?.message ?? ""),
        },
      }),
      chatHandoffValidationServiceApi.ExplainHandoffDecisionResponse.fromPartial({
        handoff: { audit: { updatedBy: (reply3?.chatRoom?.audit?.updatedBy ?? "") } },
      }),
      chatHandoffValidationServiceApi.ExplainHandoffDecisionResponse.fromPartial({
        outcome: { referenceId: (reply4?.outcome?.referenceId ?? "") },
        result: { message: (reply4?.outcome?.message ?? "") },
      }),
      chatHandoffValidationServiceApi.ExplainHandoffDecisionResponse.fromPartial({
        handoff: {
          customFields: (req?.handoff?.customFields ?? {}),
          handoffId: (req?.handoffId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a handoff.
   */
  async getHandoffRules(req: chatHandoffValidationServiceApi.GetHandoffRulesRequest): Promise<chatHandoffValidationServiceApi.GetHandoffRulesResponse> {
    validateContext(req.context);
    if (!req.handoffId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "handoff_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetHandoffRules", req);
    this.logger.info("get_handoff_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileServiceApi.CloneProfileRequest.fromPartial({
      context: req?.context,
      profile: { relationshipManager: { email: (req?.context?.actor?.email ?? "") } },
    });
    const invoke1: Unary<personalizationProfileServiceApi.CloneProfileRequest, personalizationProfileServiceApi.CloneProfileResponse> =
      (input, done) => this.personalizationProfileClient.cloneProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    return mergeResponses(
      chatHandoffValidationServiceApi.GetHandoffRulesResponse.fromPartial({
        handoff: {
          assignee: { email: (reply1?.profile?.relationshipManager?.email ?? "") },
        },
      }),
      chatHandoffValidationServiceApi.GetHandoffRulesResponse.fromPartial({ handoff: { handoffId: (req?.handoffId ?? "") } }),
    );
  }

  /**
   * Lints a handoff.
   */
  async lintHandoffs(req: chatHandoffValidationServiceApi.LintHandoffsRequest): Promise<chatHandoffValidationServiceApi.LintHandoffsResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "LintHandoffs", req);
    this.logger.info("lint_handoffs", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.handoff?.comments ?? []).map(async (item) => {
      const request1 = chatChatRoomValidationServiceApi.LintChatRoomsRequest.fromPartial({
        chatRoom: {
          audit: {
            createdAt: item?.createdAt,
            updatedBy: (req?.handoff?.audit?.updatedBy ?? ""),
          },
          owner: { email: (req?.handoff?.requester?.email ?? "") },
        },
        context: req?.context,
        details: { contact: { email: (item?.authorEmail ?? "") } },
      });
      const invoke1: Unary<chatChatRoomValidationServiceApi.LintChatRoomsRequest, chatChatRoomValidationServiceApi.LintChatRoomsResponse> =
        (input, done) => this.chatChatRoomValidationClient.lintChatRooms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<chatChatRoomValidationServiceApi.LintChatRoomsRequest, chatChatRoomValidationServiceApi.LintChatRoomsResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? chatChatRoomValidationServiceApi.LintChatRoomsResponse.fromPartial({});
    const settled2 = await Promise.allSettled((req?.handoff?.comments ?? []).map(async (item) => {
      const request2 = chatChatRoomCalculationServiceApi.CompareChatRoomOptionsRequest.fromPartial({
        chatRoom: {
          audit: { createdAt: item?.createdAt },
          owner: { email: (item?.authorEmail ?? "") },
        },
        context: req?.context,
      });
      const invoke2: Unary<chatChatRoomCalculationServiceApi.CompareChatRoomOptionsRequest, chatChatRoomCalculationServiceApi.CompareChatRoomOptionsResponse> =
        (input, done) => this.chatChatRoomCalculationClient.compareChatRoomOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<chatChatRoomCalculationServiceApi.CompareChatRoomOptionsRequest, chatChatRoomCalculationServiceApi.CompareChatRoomOptionsResponse>(invoke2, request2);
      return reply2;
    }));
    const results2: chatChatRoomCalculationServiceApi.CompareChatRoomOptionsResponse[] = [];
    for (const result of settled2) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results2.push(result.value);
    }
    const reply2 = results2.at(-1) ?? chatChatRoomCalculationServiceApi.CompareChatRoomOptionsResponse.fromPartial({});
    const request3 = chatChatRoomCalculationServiceApi.QuoteChatRoomRequest.fromPartial({
      chatRoom: {
        components: { primary: {
          description: (reply2?.chatRoom?.components?.["primary"]?.description ?? ""),
        } },
        owner: { displayName: (reply1?.chatRoom?.owner?.displayName ?? "") },
      },
      context: req?.context,
      details: {
        destination: {
          countryCode: ((reply1?.chatRoom?.locator?.$case === "address" ? reply1?.chatRoom?.locator.address : undefined)?.countryCode ?? ""),
        },
      },
    });
    const method3 = "quoteChatRoom" as const;
    const invoke3: Unary<chatChatRoomCalculationServiceApi.QuoteChatRoomRequest, chatChatRoomCalculationServiceApi.QuoteChatRoomResponse> =
      (input, done) => this.chatChatRoomCalculationClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<chatChatRoomCalculationServiceApi.QuoteChatRoomRequest, chatChatRoomCalculationServiceApi.QuoteChatRoomResponse>(invoke3, request3);
    const request4 = chatChatBotCalculationServiceApi.CompareChatBotOptionsRequest.fromPartial({
      chatBot: {
        owner: {
          displayName: ((req?.handoff?.origin?.$case === "customer" ? req?.handoff?.origin.customer : undefined)?.displayName ?? ""),
        },
      },
      context: req?.context,
    });
    const proxy4 = forwarding(this.chatChatBotCalculationClient);
    const invoke4: Unary<chatChatBotCalculationServiceApi.CompareChatBotOptionsRequest, chatChatBotCalculationServiceApi.CompareChatBotOptionsResponse> =
      (input, done) => proxy4.compareChatBotOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<chatChatBotCalculationServiceApi.CompareChatBotOptionsRequest, chatChatBotCalculationServiceApi.CompareChatBotOptionsResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffValidationServiceApi.LintHandoffsResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
      chatHandoffValidationServiceApi.LintHandoffsResponse.fromPartial({
        handoff: { priority: (reply4?.chatBot?.priority ?? 0) },
        result: { status: (reply4?.result?.status ?? "") },
      }),
      chatHandoffValidationServiceApi.LintHandoffsResponse.fromPartial({
        handoff: {
          handoffId: (req?.handoffId ?? ""),
          subject: (req?.handoff?.subject ?? ""),
        },
      }),
    );
  }

  /**
   * Normalizes a handoff.
   */
  async normalizeHandoff(req: chatHandoffValidationServiceApi.NormalizeHandoffRequest): Promise<chatHandoffValidationServiceApi.NormalizeHandoffResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "NormalizeHandoff", req);
    this.logger.info("normalize_handoff", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatHandoffCalculationServiceApi.GetHandoffRatesRequest.fromPartial({
      context: req?.context,
      handoffId: (req?.handoffId ?? ""),
    });
    const invoke1: Unary<chatHandoffCalculationServiceApi.GetHandoffRatesRequest, chatHandoffCalculationServiceApi.GetHandoffRatesResponse> =
      (input, done) => this.chatHandoffCalculationClient.getHandoffRates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatHandoffCalculationServiceApi.GetHandoffRatesRequest, chatHandoffCalculationServiceApi.GetHandoffRatesResponse>(invoke1, request1);
    const request2 = communityBadgeCalculationServiceApi.ExplainBadgeCalculationRequest.fromPartial({
      badge: {
        owner: {
          displayName: ((reply1?.handoff?.origin?.$case === "customer" ? reply1?.handoff?.origin.customer : undefined)?.displayName ?? ""),
        },
      },
      context: req?.context,
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<communityBadgeCalculationServiceApi.ExplainBadgeCalculationRequest, communityBadgeCalculationServiceApi.ExplainBadgeCalculationResponse> =
      (input, done) => this.communityBadgeCalculationClient.explainBadgeCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityBadgeCalculationServiceApi.ExplainBadgeCalculationRequest, communityBadgeCalculationServiceApi.ExplainBadgeCalculationResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffValidationServiceApi.NormalizeHandoffResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      chatHandoffValidationServiceApi.NormalizeHandoffResponse.fromPartial({
        handoff: { comments: [{ createdAt: reply2?.badge?.audit?.createdAt }] },
      }),
      chatHandoffValidationServiceApi.NormalizeHandoffResponse.fromPartial({
        handoff: {
          handoffId: (req?.handoffId ?? ""),
          priority: (req?.handoff?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Previews a handoff.
   */
  async previewHandoff(req: chatHandoffValidationServiceApi.PreviewHandoffRequest): Promise<chatHandoffValidationServiceApi.PreviewHandoffResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "PreviewHandoff", req);
    this.logger.info("preview_handoff", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = chatChatBotCalculationServiceApi.RecalculateChatBotsRequest.fromPartial({
      chatBot: {
        audit: { createdAt: input1?.handoff?.audit?.createdAt },
        owner: {
          displayName: (input1?.handoff?.assignee?.displayName ?? ""),
          email: (input1?.handoff?.requester?.email ?? ""),
          userId: (input1?.handoff?.assignee?.userId ?? ""),
        },
      },
      context: input1?.context,
    });
    const invoke1: Unary<chatChatBotCalculationServiceApi.RecalculateChatBotsRequest, chatChatBotCalculationServiceApi.RecalculateChatBotsResponse> =
      (input, done) => this.chatChatBotCalculationClient.recalculateChatBots(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatBotCalculationServiceApi.RecalculateChatBotsRequest, chatChatBotCalculationServiceApi.RecalculateChatBotsResponse>(invoke1, request1);
    const tasks2: Array<() => Promise<chatChatBotValidationServiceApi.CheckChatBotEligibilityResponse>> = [];
    for (const item of (req?.handoff?.comments ?? [])) {
      tasks2.push(async () => {
        const request2 = chatChatBotValidationServiceApi.CheckChatBotEligibilityRequest.fromPartial({
          chatBot: {
            audit: { createdAt: item?.createdAt },
            owner: {
              displayName: ((req?.handoff?.origin?.$case === "customer" ? req?.handoff?.origin.customer : undefined)?.displayName ?? ""),
              email: (item?.authorEmail ?? ""),
              userId: (reply1?.chatBot?.owner?.userId ?? ""),
            },
          },
          context: req?.context,
        });
        const invoke2: Unary<chatChatBotValidationServiceApi.CheckChatBotEligibilityRequest, chatChatBotValidationServiceApi.CheckChatBotEligibilityResponse> =
          (input, done) => this.chatChatBotValidationClient.checkChatBotEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<chatChatBotValidationServiceApi.CheckChatBotEligibilityRequest, chatChatBotValidationServiceApi.CheckChatBotEligibilityResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? chatChatBotValidationServiceApi.CheckChatBotEligibilityResponse.fromPartial({});
    const request3 = chatChatRoomCalculationServiceApi.CompareChatRoomOptionsRequest.fromPartial({
      chatRoom: {
        audit: { updatedBy: (reply2?.chatBot?.audit?.updatedBy ?? "") },
        owner: { email: (reply2?.chatBot?.owner?.email ?? "") },
      },
      context: req?.context,
    });
    const cloned3: chatChatRoomCalculationServiceApi.CompareChatRoomOptionsRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<chatChatRoomCalculationServiceApi.CompareChatRoomOptionsRequest, chatChatRoomCalculationServiceApi.CompareChatRoomOptionsResponse> =
      (input, done) => this.chatChatRoomCalculationClient.compareChatRoomOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<chatChatRoomCalculationServiceApi.CompareChatRoomOptionsRequest, chatChatRoomCalculationServiceApi.CompareChatRoomOptionsResponse>(invoke3, cloned3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffValidationServiceApi.PreviewHandoffResponse.fromPartial({
        handoff: { audit: { updatedBy: (reply1?.chatBot?.audit?.updatedBy ?? "") } },
      }),
      chatHandoffValidationServiceApi.PreviewHandoffResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      chatHandoffValidationServiceApi.PreviewHandoffResponse.fromPartial({
        handoff: {
          handoffId: (req?.handoffId ?? ""),
          requester: req?.handoff?.requester,
        },
      }),
    );
  }

  /**
   * Scores a handoff.
   */
  async scoreHandoff(req: chatHandoffValidationServiceApi.ScoreHandoffRequest): Promise<chatHandoffValidationServiceApi.ScoreHandoffResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "ScoreHandoff", req);
    this.logger.info("score_handoff", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.handoff?.history ?? []).map(async (item) => {
      const request1 = pipelinesPipelineServiceApi.SearchPipelinesRequest.fromPartial({
        context: req?.context,
        filter: {
          createdAfter: item?.changedAt,
          labels: Object.fromEntries(Object.entries((req?.handoff?.customFields ?? {}))),
          ownerId: ((req?.handoff?.origin?.$case === "customer" ? req?.handoff?.origin.customer : undefined)?.chatRoomId ?? ""),
          region: (req?.details?.destination?.region ?? ""),
        },
      });
      const invoke1: Unary<pipelinesPipelineServiceApi.SearchPipelinesRequest, pipelinesPipelineServiceApi.SearchPipelinesResponse> =
        (input, done) => this.pipelinesPipelineClient.searchPipelines(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<pipelinesPipelineServiceApi.SearchPipelinesRequest, pipelinesPipelineServiceApi.SearchPipelinesResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? pipelinesPipelineServiceApi.SearchPipelinesResponse.fromPartial({});
    const request2 = chatChatBotCalculationServiceApi.EstimateChatBotRequest.fromPartial({
      chatBot: { owner: { email: (req?.handoff?.requester?.email ?? "") } },
      context: req?.context,
      details: {
        destination: { postalCode: (req?.details?.destination?.postalCode ?? "") },
      },
    });
    const decoded2 = chatChatBotCalculationServiceApi.EstimateChatBotRequest.fromJSON(
      JSON.parse(JSON.stringify(chatChatBotCalculationServiceApi.EstimateChatBotRequest.toJSON(request2))),
    );
    const invoke2: Unary<chatChatBotCalculationServiceApi.EstimateChatBotRequest, chatChatBotCalculationServiceApi.EstimateChatBotResponse> =
      (input, done) => this.chatChatBotCalculationClient.estimateChatBot(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatChatBotCalculationServiceApi.EstimateChatBotRequest, chatChatBotCalculationServiceApi.EstimateChatBotResponse>(invoke2, decoded2);
    const request3 = chatChatRoomCalculationServiceApi.EstimateChatRoomRequest.fromPartial({
      chatRoom: {
        locator: { $case: "address", address: { region: (req?.details?.destination?.region ?? "") } },
        audit: { updatedBy: (reply2?.chatBot?.audit?.updatedBy ?? "") },
        chatRoomId: ((req?.handoff?.origin?.$case === "customer" ? req?.handoff?.origin.customer : undefined)?.chatRoomId ?? ""),
      },
      context: req?.context,
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.chat.v1.EstimateChatRoomRequest",
      value: Buffer.from(chatChatRoomCalculationServiceApi.EstimateChatRoomRequest.encode(request3).finish()),
    });
    const unpacked3 = chatChatRoomCalculationServiceApi.EstimateChatRoomRequest.decode(envelope3.value);
    const invoke3: Unary<chatChatRoomCalculationServiceApi.EstimateChatRoomRequest, chatChatRoomCalculationServiceApi.EstimateChatRoomResponse> =
      (input, done) => this.chatChatRoomCalculationClient.estimateChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<chatChatRoomCalculationServiceApi.EstimateChatRoomRequest, chatChatRoomCalculationServiceApi.EstimateChatRoomResponse>(invoke3, unpacked3);
    const request4 = concessionsConcessionStandServiceApi.CloneConcessionStandRequest.fromPartial({
      concessionStand: { owner: { email: (reply2?.chatBot?.owner?.email ?? "") } },
      context: req?.context,
    });
    const client4 = this.clients.get<concessionsConcessionStandServiceApi.ConcessionStandServiceClient>("acme.concessions.v1.ConcessionStandService");
    const invoke4: Unary<concessionsConcessionStandServiceApi.CloneConcessionStandRequest, concessionsConcessionStandServiceApi.CloneConcessionStandResponse> =
      (input, done) => client4.cloneConcessionStand(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<concessionsConcessionStandServiceApi.CloneConcessionStandRequest, concessionsConcessionStandServiceApi.CloneConcessionStandResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffValidationServiceApi.ScoreHandoffResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      chatHandoffValidationServiceApi.ScoreHandoffResponse.fromPartial({
        handoff: { requester: { email: (reply3?.chatRoom?.owner?.email ?? "") } },
        result: { message: (reply3?.result?.message ?? "") },
      }),
      chatHandoffValidationServiceApi.ScoreHandoffResponse.fromPartial({ result: { status: (reply4?.result?.status ?? "") } }),
      chatHandoffValidationServiceApi.ScoreHandoffResponse.fromPartial({
        handoff: {
          customFields: (req?.handoff?.customFields ?? {}),
          handoffId: (req?.handoffId ?? ""),
        },
      }),
    );
  }

  /**
   * Validates a handoff.
   */
  async validateHandoff(req: chatHandoffValidationServiceApi.ValidateHandoffRequest): Promise<chatHandoffValidationServiceApi.ValidateHandoffResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "ValidateHandoff", req);
    this.logger.info("validate_handoff", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomValidationServiceApi.PreviewChatRoomRequest.fromPartial({
      chatRoom: {
        audit: { createdAt: req?.handoff?.audit?.createdAt },
        owner: { email: (req?.details?.contact?.email ?? "") },
      },
      context: req?.context,
      details: {
        contact: { preferredChannel: (req?.handoff?.requester?.preferredChannel ?? "") },
      },
    });
    const invoke1: Unary<chatChatRoomValidationServiceApi.PreviewChatRoomRequest, chatChatRoomValidationServiceApi.PreviewChatRoomResponse> =
      (input, done) => this.chatChatRoomValidationClient.previewChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<chatChatRoomValidationServiceApi.PreviewChatRoomRequest, chatChatRoomValidationServiceApi.PreviewChatRoomResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = showsShowServiceApi.CloneShowRequest.fromPartial({
      context: req?.context,
      show: {
        organizer: {
          displayName: ((req?.handoff?.origin?.$case === "customer" ? req?.handoff?.origin.customer : undefined)?.displayName ?? ""),
          email: (req?.handoff?.requester?.email ?? ""),
        },
        participants: [{
          contact: {
            email: (req?.handoff?.assignee?.email ?? ""),
            preferredChannel: (req?.handoff?.requester?.preferredChannel ?? ""),
          },
        }],
      },
    });
    const invoke2: Unary<showsShowServiceApi.CloneShowRequest, showsShowServiceApi.CloneShowResponse> =
      (input, done) => this.showsShowClient.cloneShow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<showsShowServiceApi.CloneShowRequest, showsShowServiceApi.CloneShowResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffValidationServiceApi.ValidateHandoffResponse.fromPartial({ outcome: { message: (reply1?.outcome?.message ?? "") } }),
      chatHandoffValidationServiceApi.ValidateHandoffResponse.fromPartial({
        handoff: { assignee: { userId: (reply2?.show?.organizer?.userId ?? "") } },
      }),
      chatHandoffValidationServiceApi.ValidateHandoffResponse.fromPartial({
        handoff: {
          handoffId: (req?.handoffId ?? ""),
          requester: req?.handoff?.requester,
        },
      }),
    );
  }
}
