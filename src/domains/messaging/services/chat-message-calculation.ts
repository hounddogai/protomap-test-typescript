/**
 * Computes the figures of a chat message, such as totals, taxes, and estimates. Remote work stays behind typed client
 * ports.
 */

import * as authorizationAccessPolicyValidationServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_validation_service.js";
import * as contentArticleServiceApi from "../../../../.cache/proto/acme/content/v1/article_service.js";
import * as contentArticleValidationServiceApi from "../../../../.cache/proto/acme/content/v1/article_validation_service.js";
import * as experimentsExposureCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_calculation_service.js";
import * as experimentsExposureValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_validation_service.js";
import * as identityUserServiceApi from "../../../../.cache/proto/acme/identity/v1/user_service.js";
import * as ledgerLedgerAccountServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_service.js";
import * as messagingChatMessageCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_calculation_service.js";
import * as messagingConversationCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_calculation_service.js";
import * as notificationsDeliveryAttemptValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_validation_service.js";
import * as notificationsNotificationSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_sync_service.js";
import * as secretsSecretQueryServiceApi from "../../../../.cache/proto/acme/secrets/v1/secret_query_service.js";
import * as yardsYardCalculationServiceApi from "../../../../.cache/proto/acme/yards/v1/yard_calculation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  operation,
  retry,
  type RequestPort,
  type Unary,
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toChatMessageRecord } from "../data/records.js";
import { MessagingRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate chat message operations and persist audit data.
 */
@injectable()
export class ChatMessageCalculationWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyValidationService") private readonly authorizationAccessPolicyValidationClient: authorizationAccessPolicyValidationServiceApi.AccessPolicyValidationServiceClient,
    @inject("grpc:acme.content.v1.ArticleService") private readonly contentArticleClient: contentArticleServiceApi.ArticleServiceClient,
    @inject("grpc:acme.content.v1.ArticleValidationService") private readonly contentArticleValidationClient: contentArticleValidationServiceApi.ArticleValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureCalculationService") private readonly experimentsExposureCalculationClient: experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureValidationService") private readonly experimentsExposureValidationClient: experimentsExposureValidationServiceApi.ExposureValidationServiceClient,
    @inject("grpc:acme.identity.v1.UserService") private readonly identityUserClient: identityUserServiceApi.UserServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountService") private readonly ledgerLedgerAccountClient: ledgerLedgerAccountServiceApi.LedgerAccountServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationCalculationService") private readonly messagingConversationCalculationClient: messagingConversationCalculationServiceApi.ConversationCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptValidationService") private readonly notificationsDeliveryAttemptValidationClient: notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationSyncService") private readonly notificationsNotificationSyncClient: notificationsNotificationSyncServiceApi.NotificationSyncServiceClient,
    @inject("grpc:acme.secrets.v1.SecretQueryService") private readonly secretsSecretQueryClient: secretsSecretQueryServiceApi.SecretQueryServiceClient,
    @inject("grpc:acme.yards.v1.YardCalculationService") private readonly yardsYardCalculationClient: yardsYardCalculationServiceApi.YardCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a chat message.
   */
  async calculateChatMessage(req: messagingChatMessageCalculationServiceApi.CalculateChatMessageRequest): Promise<messagingChatMessageCalculationServiceApi.CalculateChatMessageResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "CalculateChatMessage", req);
    this.logger.info("calculate_chat_message", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.chatMessage?.measurements ?? []).map(async (item) => {
      const request1 = identityUserServiceApi.SearchUsersRequest.fromPartial({
        context: req?.context,
        filter: {
          createdAfter: item?.observedAt,
          ownerId: (req?.chatMessage?.chatMessageId ?? ""),
          region: (req?.details?.destination?.region ?? ""),
        },
      });
      const invoke1: Unary<identityUserServiceApi.SearchUsersRequest, identityUserServiceApi.SearchUsersResponse> =
        (input, done) => this.identityUserClient.searchUsers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<identityUserServiceApi.SearchUsersRequest, identityUserServiceApi.SearchUsersResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? identityUserServiceApi.SearchUsersResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return messagingChatMessageCalculationServiceApi.CalculateChatMessageResponse.fromPartial({
      chatMessage: {
        attributes: (req?.chatMessage?.attributes ?? {}),
        chatMessageId: (req?.chatMessageId ?? ""),
      },
    });
  }

  /**
   * Compares a chat message.
   */
  async compareChatMessageOptions(req: messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsRequest): Promise<messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "CompareChatMessageOptions", req);
    this.logger.info("compare_chat_message_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationCalculationServiceApi.SimulateConversationRequest.fromPartial({
      context: req?.context,
      conversation: {
        origin: { $case: "customer", customer: { displayName: (req?.chatMessage?.subject?.displayName ?? "") } },
      },
    });
    const proxy1 = forwarding(this.messagingConversationCalculationClient);
    const invoke1: Unary<messagingConversationCalculationServiceApi.SimulateConversationRequest, messagingConversationCalculationServiceApi.SimulateConversationResponse> =
      (input, done) => proxy1.simulateConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingConversationCalculationServiceApi.SimulateConversationRequest, messagingConversationCalculationServiceApi.SimulateConversationResponse>(invoke1, request1);
    const settled2 = await Promise.allSettled((req?.chatMessage?.measurements ?? []).map(async (item) => {
      const request2 = experimentsExposureCalculationServiceApi.SimulateExposureRequest.fromPartial({
        context: req?.context,
        exposure: {
          measurements: [{
            observedAt: item?.observedAt,
            unit: (item?.unit ?? ""),
            value: (item?.value ?? 0),
          }],
        },
      });
      const invoke2: Unary<experimentsExposureCalculationServiceApi.SimulateExposureRequest, experimentsExposureCalculationServiceApi.SimulateExposureResponse> =
        (input, done) => this.experimentsExposureCalculationClient.simulateExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<experimentsExposureCalculationServiceApi.SimulateExposureRequest, experimentsExposureCalculationServiceApi.SimulateExposureResponse>(invoke2, request2);
      return reply2;
    }));
    const results2: experimentsExposureCalculationServiceApi.SimulateExposureResponse[] = [];
    for (const result of settled2) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results2.push(result.value);
    }
    const reply2 = results2.at(-1) ?? experimentsExposureCalculationServiceApi.SimulateExposureResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsResponse.fromPartial({
        chatMessage: {
          chatMessageId: (req?.chatMessageId ?? ""),
          subject: req?.chatMessage?.subject,
        },
      }),
    );
  }

  /**
   * Estimates a chat message.
   */
  async estimateChatMessage(req: messagingChatMessageCalculationServiceApi.EstimateChatMessageRequest): Promise<messagingChatMessageCalculationServiceApi.EstimateChatMessageResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "EstimateChatMessage", req);
    this.logger.info("estimate_chat_message", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<notificationsNotificationSyncServiceApi.SyncNotificationsResponse>> = [];
    for (const item of (req?.chatMessage?.measurements ?? [])) {
      tasks1.push(async () => {
        const request1 = notificationsNotificationSyncServiceApi.SyncNotificationsRequest.fromPartial({
          context: req?.context,
          notification: {
            origin: { $case: "customer", customer: { displayName: (req?.chatMessage?.subject?.displayName ?? "") } },
            history: [{ changedAt: item?.observedAt }],
          },
          reason: (req?.reason ?? ""),
        });
        const invoke1: Unary<notificationsNotificationSyncServiceApi.SyncNotificationsRequest, notificationsNotificationSyncServiceApi.SyncNotificationsResponse> =
          (input, done) => this.notificationsNotificationSyncClient.syncNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<notificationsNotificationSyncServiceApi.SyncNotificationsRequest, notificationsNotificationSyncServiceApi.SyncNotificationsResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? notificationsNotificationSyncServiceApi.SyncNotificationsResponse.fromPartial({});
    const request2 = messagingConversationCalculationServiceApi.QuoteConversationRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { recipient: (req?.details?.destination?.recipient ?? "") },
      },
    });
    const invoke2: Unary<messagingConversationCalculationServiceApi.QuoteConversationRequest, messagingConversationCalculationServiceApi.QuoteConversationResponse> =
      (input, done) => this.messagingConversationCalculationClient.quoteConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingConversationCalculationServiceApi.QuoteConversationRequest, messagingConversationCalculationServiceApi.QuoteConversationResponse>(invoke2, request2);
    const request3 = yardsYardCalculationServiceApi.CompareYardOptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { lines: (req?.details?.destination?.lines ?? []).map((value) => value) },
      },
      yard: { owner: { email: (reply2?.conversation?.requester?.email ?? "") } },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<yardsYardCalculationServiceApi.CompareYardOptionsRequest, yardsYardCalculationServiceApi.CompareYardOptionsResponse> =
      (input, done) => this.yardsYardCalculationClient.compareYardOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<yardsYardCalculationServiceApi.CompareYardOptionsRequest, yardsYardCalculationServiceApi.CompareYardOptionsResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.details?.destination?.countryCode ?? "") });
    return mergeResponses(
      messagingChatMessageCalculationServiceApi.EstimateChatMessageResponse.fromPartial({ breakdown: { currencyCode: (reply2?.breakdown?.currencyCode ?? "") } }),
      messagingChatMessageCalculationServiceApi.EstimateChatMessageResponse.fromPartial({
        chatMessage: { subject: { displayName: (reply3?.yard?.owner?.displayName ?? "") } },
        result: { referenceIds: (reply3?.result?.referenceIds ?? []) },
      }),
      messagingChatMessageCalculationServiceApi.EstimateChatMessageResponse.fromPartial({
        chatMessage: {
          chatMessageId: (req?.chatMessageId ?? ""),
          sequence: (req?.chatMessage?.sequence ?? 0),
        },
      }),
    );
  }

  /**
   * Explains a chat message.
   */
  async explainChatMessageCalculation(req: messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationRequest): Promise<messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "ExplainChatMessageCalculation", req);
    this.logger.info("explain_chat_message_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = notificationsDeliveryAttemptValidationServiceApi.ExplainDeliveryAttemptDecisionRequest.fromPartial({
      context: input1?.context,
      deliveryAttempt: { occurredAt: input1?.chatMessage?.occurredAt },
      details: {
        contact: {
          email: (input1?.details?.contact?.email ?? ""),
          name: input1?.details?.contact?.name,
        },
        locale: (input1?.details?.locale ?? ""),
      },
    });
    const invoke1: Unary<notificationsDeliveryAttemptValidationServiceApi.ExplainDeliveryAttemptDecisionRequest, notificationsDeliveryAttemptValidationServiceApi.ExplainDeliveryAttemptDecisionResponse> =
      (input, done) => this.notificationsDeliveryAttemptValidationClient.explainDeliveryAttemptDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptValidationServiceApi.ExplainDeliveryAttemptDecisionRequest, notificationsDeliveryAttemptValidationServiceApi.ExplainDeliveryAttemptDecisionResponse>(invoke1, request1);
    const results2 = await Promise.all((req?.chatMessage?.measurements ?? []).map(async (item) => {
      const request2 = messagingConversationCalculationServiceApi.CompareConversationOptionsRequest.fromPartial({
        context: req?.context,
        conversation: {
          origin: { $case: "customer", customer: { displayName: (reply1?.deliveryAttempt?.subject?.displayName ?? "") } },
          requester: { phone: (req?.details?.contact?.phone ?? "") },
          sla: { dueAt: item?.observedAt },
        },
      });
      const invoke2: Unary<messagingConversationCalculationServiceApi.CompareConversationOptionsRequest, messagingConversationCalculationServiceApi.CompareConversationOptionsResponse> =
        (input, done) => this.messagingConversationCalculationClient.compareConversationOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<messagingConversationCalculationServiceApi.CompareConversationOptionsRequest, messagingConversationCalculationServiceApi.CompareConversationOptionsResponse>(invoke2, request2);
      return reply2;
    }));
    const reply2 = results2.at(-1) ?? messagingConversationCalculationServiceApi.CompareConversationOptionsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationResponse.fromPartial({ outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) } }),
      messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationResponse.fromPartial({
        chatMessage: {
          chatMessageId: (req?.chatMessageId ?? ""),
          sequence: (req?.chatMessage?.sequence ?? 0),
        },
      }),
    );
  }

  /**
   * Returns a chat message.
   */
  async getChatMessageRates(req: messagingChatMessageCalculationServiceApi.GetChatMessageRatesRequest): Promise<messagingChatMessageCalculationServiceApi.GetChatMessageRatesResponse> {
    validateContext(req.context);
    if (!req.chatMessageId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_message_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetChatMessageRates", req);
    this.logger.info("get_chat_message_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = authorizationAccessPolicyValidationServiceApi.ExplainAccessPolicyDecisionRequest.fromPartial({
      accessPolicy: {
        audit: { createdAt: req?.context?.deadline },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
    });
    const cloned1: authorizationAccessPolicyValidationServiceApi.ExplainAccessPolicyDecisionRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<authorizationAccessPolicyValidationServiceApi.ExplainAccessPolicyDecisionRequest, authorizationAccessPolicyValidationServiceApi.ExplainAccessPolicyDecisionResponse> =
      (input, done) => this.authorizationAccessPolicyValidationClient.explainAccessPolicyDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<authorizationAccessPolicyValidationServiceApi.ExplainAccessPolicyDecisionRequest, authorizationAccessPolicyValidationServiceApi.ExplainAccessPolicyDecisionResponse>(invoke1, cloned1);
    return mergeResponses(
      messagingChatMessageCalculationServiceApi.GetChatMessageRatesResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      messagingChatMessageCalculationServiceApi.GetChatMessageRatesResponse.fromPartial({ chatMessage: { chatMessageId: (req?.chatMessageId ?? "") } }),
    );
  }

  /**
   * Quotes a chat message.
   */
  async quoteChatMessage(req: messagingChatMessageCalculationServiceApi.QuoteChatMessageRequest): Promise<messagingChatMessageCalculationServiceApi.QuoteChatMessageResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "QuoteChatMessage", req);
    this.logger.info("quote_chat_message", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          locality: (req?.details?.destination?.locality ?? ""),
          recipient: (req?.details?.destination?.recipient ?? ""),
        },
      },
    });
    const decoded1 = authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyRequest.fromJSON(
      JSON.parse(JSON.stringify(authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyRequest.toJSON(request1))),
    );
    const invoke1: Unary<authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyRequest, authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyResponse> =
      (input, done) => this.authorizationAccessPolicyValidationClient.scoreAccessPolicy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyRequest, authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyResponse>(invoke1, decoded1);
    const request2 = ledgerLedgerAccountServiceApi.CloneLedgerAccountRequest.fromPartial({
      context: req?.context,
      ledgerAccount: {
        limits: [{
          amount: (reply1?.accessPolicy?.action?.$case === "discount" ? reply1?.accessPolicy?.action.discount : undefined)?.amount,
        }],
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.ledger.v1.CloneLedgerAccountRequest",
      value: Buffer.from(ledgerLedgerAccountServiceApi.CloneLedgerAccountRequest.encode(request2).finish()),
    });
    const unpacked2 = ledgerLedgerAccountServiceApi.CloneLedgerAccountRequest.decode(envelope2.value);
    const invoke2: Unary<ledgerLedgerAccountServiceApi.CloneLedgerAccountRequest, ledgerLedgerAccountServiceApi.CloneLedgerAccountResponse> =
      (input, done) => this.ledgerLedgerAccountClient.cloneLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<ledgerLedgerAccountServiceApi.CloneLedgerAccountRequest, ledgerLedgerAccountServiceApi.CloneLedgerAccountResponse>(invoke2, unpacked2);
    const settled3 = await Promise.allSettled((req?.chatMessage?.measurements ?? []).map(async (item) => {
      const request3 = secretsSecretQueryServiceApi.FindSecretsRequest.fromPartial({
        context: req?.context,
        filter: {
          createdAfter: item?.observedAt,
          labels: Object.fromEntries(Object.entries((reply2?.ledgerAccount?.labels ?? {}))),
          region: (req?.details?.destination?.region ?? ""),
        },
      });
      const invoke3: Unary<secretsSecretQueryServiceApi.FindSecretsRequest, secretsSecretQueryServiceApi.FindSecretsResponse> =
        (input, done) => this.secretsSecretQueryClient.findSecrets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<secretsSecretQueryServiceApi.FindSecretsRequest, secretsSecretQueryServiceApi.FindSecretsResponse>(invoke3, request3);
      return reply3;
    }));
    const results3: secretsSecretQueryServiceApi.FindSecretsResponse[] = [];
    for (const result of settled3) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results3.push(result.value);
    }
    const reply3 = results3.at(-1) ?? secretsSecretQueryServiceApi.FindSecretsResponse.fromPartial({});
    let selected4_1: string | undefined;
    switch (reply2?.ledgerAccount?.funding?.$case) {
      case "card":
        selected4_1 = ((reply2?.ledgerAccount?.funding?.$case === "card" ? reply2?.ledgerAccount?.funding.card : undefined)?.last4 ?? "");
        break;
      default:
        selected4_1 = "";
    }
    let selected4_2: string | undefined;
    switch (reply2?.ledgerAccount?.funding?.$case) {
      case "card":
        selected4_2 = ((reply2?.ledgerAccount?.funding?.$case === "card" ? reply2?.ledgerAccount?.funding.card : undefined)?.network ?? "");
        break;
      default:
        selected4_2 = "";
    }
    const request4 = contentArticleValidationServiceApi.ExplainArticleDecisionRequest.fromPartial({
      article: {
        settlement: { $case: "card", card: {
          last4: (selected4_1 ?? ""),
          network: (selected4_2 ?? ""),
        } },
      },
      context: req?.context,
      details: { contact: { email: (reply2?.ledgerAccount?.contact?.email ?? "") } },
    });
    const invoke4: Unary<contentArticleValidationServiceApi.ExplainArticleDecisionRequest, contentArticleValidationServiceApi.ExplainArticleDecisionResponse> =
      (input, done) => this.contentArticleValidationClient.explainArticleDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<contentArticleValidationServiceApi.ExplainArticleDecisionRequest, contentArticleValidationServiceApi.ExplainArticleDecisionResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageCalculationServiceApi.QuoteChatMessageResponse.fromPartial({
        breakdown: { total: reply1?.breakdown?.total },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      messagingChatMessageCalculationServiceApi.QuoteChatMessageResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      messagingChatMessageCalculationServiceApi.QuoteChatMessageResponse.fromPartial({ breakdown: { total: reply4?.article?.total } }),
      messagingChatMessageCalculationServiceApi.QuoteChatMessageResponse.fromPartial({
        chatMessage: {
          attributes: (req?.chatMessage?.attributes ?? {}),
          chatMessageId: (req?.chatMessageId ?? ""),
        },
      }),
    );
  }

  /**
   * Recalculates a chat message.
   */
  async recalculateChatMessages(req: messagingChatMessageCalculationServiceApi.RecalculateChatMessagesRequest): Promise<messagingChatMessageCalculationServiceApi.RecalculateChatMessagesResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "RecalculateChatMessages", req);
    this.logger.info("recalculate_chat_messages", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ledgerLedgerAccountServiceApi.CreateLedgerAccountRequest.fromPartial({
      context: req?.context,
      ledgerAccount: {
        currencyCode: (req?.details?.currencyCode ?? ""),
        holder: { displayName: (req?.chatMessage?.subject?.displayName ?? "") },
      },
    });
    const invoke1: Unary<ledgerLedgerAccountServiceApi.CreateLedgerAccountRequest, ledgerLedgerAccountServiceApi.CreateLedgerAccountResponse> =
      (input, done) => this.ledgerLedgerAccountClient.createLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<ledgerLedgerAccountServiceApi.CreateLedgerAccountRequest, ledgerLedgerAccountServiceApi.CreateLedgerAccountResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = contentArticleServiceApi.UpdateArticleRequest.fromPartial({
      article: {
        audit: { updatedAt: reply1?.ledgerAccount?.audit?.updatedAt },
        settlement: { $case: "bank", bank: {
          bic: ((reply1?.ledgerAccount?.funding?.$case === "bank" ? reply1?.ledgerAccount?.funding.bank : undefined)?.bic ?? ""),
        } },
        billingAddress: { recipient: (req?.details?.destination?.recipient ?? "") },
      },
      context: req?.context,
    });
    const invoke2: Unary<contentArticleServiceApi.UpdateArticleRequest, contentArticleServiceApi.UpdateArticleResponse> =
      (input, done) => this.contentArticleClient.updateArticle(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<contentArticleServiceApi.UpdateArticleRequest, contentArticleServiceApi.UpdateArticleResponse>(invoke2, request2));
    let selected3_2: string | undefined;
    switch (reply2?.article?.settlement?.$case) {
      case "card":
        selected3_2 = ((reply2?.article?.settlement?.$case === "card" ? reply2?.article?.settlement.card : undefined)?.network ?? "");
        break;
      default:
        selected3_2 = "";
    }
    let selected3_3: string | undefined;
    switch (reply1?.ledgerAccount?.funding?.$case) {
      case "card":
        selected3_3 = ((reply1?.ledgerAccount?.funding?.$case === "card" ? reply1?.ledgerAccount?.funding.card : undefined)?.token ?? "");
        break;
      default:
        selected3_3 = "";
    }
    const request3 = ledgerLedgerAccountServiceApi.CloneLedgerAccountRequest.fromPartial({
      context: req?.context,
      ledgerAccount: {
        audit: { updatedAt: reply2?.article?.audit?.updatedAt },
        funding: { $case: "card", card: {
          network: (selected3_2 ?? ""),
          token: (selected3_3 ?? ""),
        } },
        holder: { postingBatchId: (reply1?.ledgerAccount?.holder?.postingBatchId ?? "") },
      },
    });
    const invoke3: Unary<ledgerLedgerAccountServiceApi.CloneLedgerAccountRequest, ledgerLedgerAccountServiceApi.CloneLedgerAccountResponse> =
      (input, done) => this.ledgerLedgerAccountClient.cloneLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<ledgerLedgerAccountServiceApi.CloneLedgerAccountRequest, ledgerLedgerAccountServiceApi.CloneLedgerAccountResponse>(invoke3, request3);
    const tasks4: Array<() => Promise<experimentsExposureValidationServiceApi.ValidateExposureResponse>> = [];
    for (const item of (req?.chatMessage?.measurements ?? [])) {
      tasks4.push(async () => {
        const request4 = experimentsExposureValidationServiceApi.ValidateExposureRequest.fromPartial({
          context: req?.context,
          exposure: { measurements: [{ observedAt: item?.observedAt }] },
        });
        const invoke4: Unary<experimentsExposureValidationServiceApi.ValidateExposureRequest, experimentsExposureValidationServiceApi.ValidateExposureResponse> =
          (input, done) => this.experimentsExposureValidationClient.validateExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply4 = await call<experimentsExposureValidationServiceApi.ValidateExposureRequest, experimentsExposureValidationServiceApi.ValidateExposureResponse>(invoke4, request4);
        return reply4;
      });
    }
    const results4 = await Promise.all(tasks4.map((task) => task()));
    const reply4 = results4.at(-1) ?? experimentsExposureValidationServiceApi.ValidateExposureResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageCalculationServiceApi.RecalculateChatMessagesResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      messagingChatMessageCalculationServiceApi.RecalculateChatMessagesResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      messagingChatMessageCalculationServiceApi.RecalculateChatMessagesResponse.fromPartial({
        chatMessage: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          subject: { displayName: (reply3?.ledgerAccount?.holder?.displayName ?? "") },
        },
      }),
      messagingChatMessageCalculationServiceApi.RecalculateChatMessagesResponse.fromPartial({
        chatMessage: {
          chatMessageId: (req?.chatMessageId ?? ""),
          source: (req?.chatMessage?.source ?? ""),
        },
      }),
    );
  }

  /**
   * Simulates a chat message.
   */
  async simulateChatMessage(req: messagingChatMessageCalculationServiceApi.SimulateChatMessageRequest): Promise<messagingChatMessageCalculationServiceApi.SimulateChatMessageResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "SimulateChatMessage", req);
    this.logger.info("simulate_chat_message", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationCalculationServiceApi.CompareConversationOptionsRequest.fromPartial({
      context: req?.context,
      conversation: {
        assignee: { displayName: (req?.chatMessage?.subject?.displayName ?? "") },
      },
    });
    const invoke1: Unary<messagingConversationCalculationServiceApi.CompareConversationOptionsRequest, messagingConversationCalculationServiceApi.CompareConversationOptionsResponse> =
      (input, done) => this.messagingConversationCalculationClient.compareConversationOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = messagingConversationCalculationServiceApi.RecalculateConversationsRequest.fromPartial({
      context: req?.context,
      conversation: {
        assignee: { email: (reply1?.conversation?.assignee?.email ?? "") },
        origin: { $case: "customer", customer: { displayName: (reply1?.conversation?.assignee?.displayName ?? "") } },
        requester: {
          preferredChannel: (reply1?.conversation?.requester?.preferredChannel ?? ""),
        },
        sla: { breached: (reply1?.conversation?.sla?.breached ?? false) },
      },
    });
    const reply2 = await this.workQueue.enqueue<messagingConversationCalculationServiceApi.RecalculateConversationsRequest, messagingConversationCalculationServiceApi.RecalculateConversationsResponse>(
      "acme.messaging.v1.ChatMessageCalculationService/SimulateChatMessage:1", request2,
    );
    const results3 = await Promise.all((req?.chatMessage?.measurements ?? []).map(async (item) => {
      const request3 = messagingConversationCalculationServiceApi.SimulateConversationRequest.fromPartial({
        context: req?.context,
        conversation: { audit: { createdAt: item?.observedAt } },
      });
      const invoke3: Unary<messagingConversationCalculationServiceApi.SimulateConversationRequest, messagingConversationCalculationServiceApi.SimulateConversationResponse> =
        (input, done) => this.messagingConversationCalculationClient.simulateConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<messagingConversationCalculationServiceApi.SimulateConversationRequest, messagingConversationCalculationServiceApi.SimulateConversationResponse>(invoke3, request3);
      return reply3;
    }));
    const reply3 = results3.at(-1) ?? messagingConversationCalculationServiceApi.SimulateConversationResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageCalculationServiceApi.SimulateChatMessageResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      messagingChatMessageCalculationServiceApi.SimulateChatMessageResponse.fromPartial({
        chatMessage: {
          subject: {
            channelId: ((reply2?.conversation?.origin?.$case === "customer" ? reply2?.conversation?.origin.customer : undefined)?.channelId ?? ""),
          },
        },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      messagingChatMessageCalculationServiceApi.SimulateChatMessageResponse.fromPartial({
        chatMessage: {
          chatMessageId: (req?.chatMessageId ?? ""),
          source: (req?.chatMessage?.source ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for ChatMessageCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class ChatMessageCalculationHandler {
  constructor(@inject(ChatMessageCalculationWorkflow) private readonly workflow: ChatMessageCalculationWorkflow) {}

  /**
   * Calculates a chat message.
   */
  calculateChatMessage = unary<messagingChatMessageCalculationServiceApi.CalculateChatMessageRequest, messagingChatMessageCalculationServiceApi.CalculateChatMessageResponse>(
    (request) => this.workflow.calculateChatMessage(request),
  );

  /**
   * Compares a chat message.
   */
  compareChatMessageOptions = unary<messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsRequest, messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsResponse>(
    (request) => this.workflow.compareChatMessageOptions(request),
  );

  /**
   * Estimates a chat message.
   */
  estimateChatMessage = (call: ServerUnaryCall<messagingChatMessageCalculationServiceApi.EstimateChatMessageRequest, messagingChatMessageCalculationServiceApi.EstimateChatMessageResponse>, done: sendUnaryData<messagingChatMessageCalculationServiceApi.EstimateChatMessageResponse>): void => {
    void this.workflow.estimateChatMessage(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Explains a chat message.
   */
  explainChatMessageCalculation = unary<messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationRequest, messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationResponse>(
    (request) => this.workflow.explainChatMessageCalculation(request),
  );

  /**
   * Returns a chat message.
   */
  getChatMessageRates = unary<messagingChatMessageCalculationServiceApi.GetChatMessageRatesRequest, messagingChatMessageCalculationServiceApi.GetChatMessageRatesResponse>(
    (request) => this.workflow.getChatMessageRates(request),
  );

  /**
   * Quotes a chat message.
   */
  quoteChatMessage = (call: ServerUnaryCall<messagingChatMessageCalculationServiceApi.QuoteChatMessageRequest, messagingChatMessageCalculationServiceApi.QuoteChatMessageResponse>, done: sendUnaryData<messagingChatMessageCalculationServiceApi.QuoteChatMessageResponse>): void => {
    void this.workflow.quoteChatMessage(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Recalculates a chat message.
   */
  recalculateChatMessages = unary<messagingChatMessageCalculationServiceApi.RecalculateChatMessagesRequest, messagingChatMessageCalculationServiceApi.RecalculateChatMessagesResponse>(
    (request) => this.workflow.recalculateChatMessages(request),
  );

  /**
   * Simulates a chat message.
   */
  simulateChatMessage = unary<messagingChatMessageCalculationServiceApi.SimulateChatMessageRequest, messagingChatMessageCalculationServiceApi.SimulateChatMessageResponse>(
    (request) => this.workflow.simulateChatMessage(request),
  );
}

export function implementation(handler: ChatMessageCalculationHandler): messagingChatMessageCalculationServiceApi.ChatMessageCalculationServiceServer {
  return {
    calculateChatMessage: handler.calculateChatMessage,
    compareChatMessageOptions: handler.compareChatMessageOptions,
    estimateChatMessage: handler.estimateChatMessage,
    explainChatMessageCalculation: handler.explainChatMessageCalculation,
    getChatMessageRates: handler.getChatMessageRates,
    quoteChatMessage: handler.quoteChatMessage,
    recalculateChatMessages: handler.recalculateChatMessages,
    simulateChatMessage: handler.simulateChatMessage,
  };
}
