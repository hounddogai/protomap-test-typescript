/**
 * Takes participants in bulk from partners and legacy systems. Remote work stays behind typed client ports.
 */

import * as experimentsExposureWorkflowServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_workflow_service.js";
import * as localizationTranslationJobWorkflowServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_workflow_service.js";
import * as messagingChannelValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_validation_service.js";
import * as messagingChatMessageSyncServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_sync_service.js";
import * as messagingConversationReportingServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_reporting_service.js";
import * as messagingParticipantCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/participant_calculation_service.js";
import * as messagingParticipantImportServiceApi from "../../../../.cache/proto/acme/messaging/v1/participant_import_service.js";
import * as messagingParticipantValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/participant_validation_service.js";
import * as notificationsNotificationCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_calculation_service.js";
import * as notificationsNotificationQueryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_query_service.js";
import * as notificationsNotificationTemplateHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_history_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import * as personalizationAffinityWorkflowServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_workflow_service.js";
import * as personalizationProfileServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_service.js";
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
import { collect, upload, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toParticipantRecord } from "../data/records.js";
import { MessagingRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate participant operations and persist audit data.
 */
@injectable()
export class ParticipantImportWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.experiments.v1.ExposureWorkflowService") private readonly experimentsExposureWorkflowClient: experimentsExposureWorkflowServiceApi.ExposureWorkflowServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobWorkflowService") private readonly localizationTranslationJobWorkflowClient: localizationTranslationJobWorkflowServiceApi.TranslationJobWorkflowServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelValidationService") private readonly messagingChannelValidationClient: messagingChannelValidationServiceApi.ChannelValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageSyncService") private readonly messagingChatMessageSyncClient: messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationReportingService") private readonly messagingConversationReportingClient: messagingConversationReportingServiceApi.ConversationReportingServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantCalculationService") private readonly messagingParticipantCalculationClient: messagingParticipantCalculationServiceApi.ParticipantCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantValidationService") private readonly messagingParticipantValidationClient: messagingParticipantValidationServiceApi.ParticipantValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationCalculationService") private readonly notificationsNotificationCalculationClient: notificationsNotificationCalculationServiceApi.NotificationCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationQueryService") private readonly notificationsNotificationQueryClient: notificationsNotificationQueryServiceApi.NotificationQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateHistoryService") private readonly notificationsNotificationTemplateHistoryClient: notificationsNotificationTemplateHistoryServiceApi.NotificationTemplateHistoryServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionSyncService") private readonly notificationsSubscriptionSyncClient: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityWorkflowService") private readonly personalizationAffinityWorkflowClient: personalizationAffinityWorkflowServiceApi.AffinityWorkflowServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileService") private readonly personalizationProfileClient: personalizationProfileServiceApi.ProfileServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Cancels a participant.
   */
  async cancelParticipantImport(req: messagingParticipantImportServiceApi.CancelParticipantImportRequest): Promise<messagingParticipantImportServiceApi.CancelParticipantImportResponse> {
    validateContext(req.context);
    if (!req.participantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "participant_id is required");
    }
    await this.repository.record(req.context.tenantId, "CancelParticipantImport", req);
    this.logger.info("cancel_participant_import", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobWorkflowServiceApi.RetryTranslationJobWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (req?.details?.newOwner?.email ?? "") } },
      translationJob: {
        origin: { $case: "customer", customer: { displayName: (req?.details?.newOwner?.displayName ?? "") } },
        requester: { email: (req?.details?.notifyContact?.email ?? "") },
      },
    });
    const cloned1: localizationTranslationJobWorkflowServiceApi.RetryTranslationJobWorkflowRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<localizationTranslationJobWorkflowServiceApi.RetryTranslationJobWorkflowRequest, localizationTranslationJobWorkflowServiceApi.RetryTranslationJobWorkflowResponse> =
      (input, done) => this.localizationTranslationJobWorkflowClient.retryTranslationJobWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationJobWorkflowServiceApi.RetryTranslationJobWorkflowRequest, localizationTranslationJobWorkflowServiceApi.RetryTranslationJobWorkflowResponse>(invoke1, cloned1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantImportServiceApi.CancelParticipantImportResponse.fromPartial({
        outcome: { status: (reply1?.outcome?.status ?? "") },
        result: { message: (reply1?.outcome?.message ?? "") },
      }),
      messagingParticipantImportServiceApi.CancelParticipantImportResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        participant: { participantId: (req?.participantId ?? "") },
      }),
    );
  }

  /**
   * Returns a participant.
   */
  async getParticipantImportStatus(req: messagingParticipantImportServiceApi.GetParticipantImportStatusRequest): Promise<messagingParticipantImportServiceApi.GetParticipantImportStatusResponse> {
    validateContext(req.context);
    if (!req.participantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "participant_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetParticipantImportStatus", req);
    this.logger.info("get_participant_import_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageSyncServiceApi.ResolveChatMessageConflictRequest.fromPartial({
      chatMessage: {
        correlationId: (req?.participantId ?? ""),
        occurredAt: req?.context?.deadline,
      },
      context: req?.context,
    });
    const decoded1 = messagingChatMessageSyncServiceApi.ResolveChatMessageConflictRequest.fromJSON(
      JSON.parse(JSON.stringify(messagingChatMessageSyncServiceApi.ResolveChatMessageConflictRequest.toJSON(request1))),
    );
    const invoke1: Unary<messagingChatMessageSyncServiceApi.ResolveChatMessageConflictRequest, messagingChatMessageSyncServiceApi.ResolveChatMessageConflictResponse> =
      (input, done) => this.messagingChatMessageSyncClient.resolveChatMessageConflict(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChatMessageSyncServiceApi.ResolveChatMessageConflictRequest, messagingChatMessageSyncServiceApi.ResolveChatMessageConflictResponse>(invoke1, decoded1);
    return mergeResponses(
      messagingParticipantImportServiceApi.GetParticipantImportStatusResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      messagingParticipantImportServiceApi.GetParticipantImportStatusResponse.fromPartial({ participant: { participantId: (req?.participantId ?? "") } }),
    );
  }

  /**
   * Takes a stream of participants and answers once at the end.
   */
  async importParticipants(req: messagingParticipantImportServiceApi.ImportParticipantsRequest): Promise<messagingParticipantImportServiceApi.ImportParticipantsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ImportParticipants", req);
    this.logger.info("import_participants", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureWorkflowServiceApi.ResumeExposureWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          email: ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.email ?? ""),
        },
      },
      exposure: {
        subject: {
          displayName: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.relationshipManager?.displayName ?? ""),
        },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.experiments.v1.ResumeExposureWorkflowRequest",
      value: Buffer.from(experimentsExposureWorkflowServiceApi.ResumeExposureWorkflowRequest.encode(request1).finish()),
    });
    const unpacked1 = experimentsExposureWorkflowServiceApi.ResumeExposureWorkflowRequest.decode(envelope1.value);
    const invoke1: Unary<experimentsExposureWorkflowServiceApi.ResumeExposureWorkflowRequest, experimentsExposureWorkflowServiceApi.ResumeExposureWorkflowResponse> =
      (input, done) => this.experimentsExposureWorkflowClient.resumeExposureWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExposureWorkflowServiceApi.ResumeExposureWorkflowRequest, experimentsExposureWorkflowServiceApi.ResumeExposureWorkflowResponse>(invoke1, unpacked1);
    let selected2_1: string | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected2_1 = ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.relationshipManager?.email ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = notificationsNotificationCalculationServiceApi.QuoteNotificationRequest.fromPartial({
      context: req?.context,
      notification: { requester: { email: (selected2_1 ?? "") } },
    });
    const invoke2: Unary<notificationsNotificationCalculationServiceApi.QuoteNotificationRequest, notificationsNotificationCalculationServiceApi.QuoteNotificationResponse> =
      (input, done) => this.notificationsNotificationCalculationClient.quoteNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationCalculationServiceApi.QuoteNotificationRequest, notificationsNotificationCalculationServiceApi.QuoteNotificationResponse>(invoke2, request2);
    const request3 = messagingChannelValidationServiceApi.CheckChannelEligibilityRequest.fromPartial({
      channel: {
        audit: {
          createdBy: (reply2?.notification?.audit?.createdBy ?? ""),
          etag: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.etag ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke3: Unary<messagingChannelValidationServiceApi.CheckChannelEligibilityRequest, messagingChannelValidationServiceApi.CheckChannelEligibilityResponse> =
      (input, done) => this.messagingChannelValidationClient.checkChannelEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port3: RequestPort<messagingChannelValidationServiceApi.CheckChannelEligibilityRequest, messagingChannelValidationServiceApi.CheckChannelEligibilityResponse> = new GrpcAdapter(invoke3);
    const reply3 = await port3.execute(request3);
    const request4 = notificationsNotificationQueryServiceApi.FindNotificationsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: (req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.createdAt,
        ownerId: ((reply2?.notification?.origin?.$case === "customer" ? reply2?.notification?.origin.customer : undefined)?.notificationTemplateId ?? ""),
        region: ((reply3?.channel?.locator?.$case === "address" ? reply3?.channel?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke4: Unary<notificationsNotificationQueryServiceApi.FindNotificationsRequest, notificationsNotificationQueryServiceApi.FindNotificationsResponse> =
      (input, done) => this.notificationsNotificationQueryClient.findNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await retry(() => call<notificationsNotificationQueryServiceApi.FindNotificationsRequest, notificationsNotificationQueryServiceApi.FindNotificationsResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.updatedBy ?? "") });
    return mergeResponses(
      messagingParticipantImportServiceApi.ImportParticipantsResponse.fromPartial({
        result: {
          message: (reply1?.outcome?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      messagingParticipantImportServiceApi.ImportParticipantsResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      messagingParticipantImportServiceApi.ImportParticipantsResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      messagingParticipantImportServiceApi.ImportParticipantsResponse.fromPartial({
        result: {
          correlationId: (reply4?.result?.correlationId ?? ""),
          details: (reply4?.result?.details ?? {}),
        },
      }),
    );
  }

  /**
   * Lists participants a page at a time.
   */
  async listParticipantImports(req: messagingParticipantImportServiceApi.ListParticipantImportsRequest): Promise<messagingParticipantImportServiceApi.ListParticipantImportsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListParticipantImports", req);
    this.logger.info("list_participant_imports", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingParticipantCalculationServiceApi.CalculateParticipantRequest.fromPartial({
      context: req?.context,
      participant: {
        primaryAddress: { region: (req?.filter?.region ?? "") },
        relationshipManager: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<messagingParticipantCalculationServiceApi.CalculateParticipantRequest, messagingParticipantCalculationServiceApi.CalculateParticipantResponse> =
      (input, done) => this.messagingParticipantCalculationClient.calculateParticipant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ListParticipantImports.CalculateParticipant", () => call<messagingParticipantCalculationServiceApi.CalculateParticipantRequest, messagingParticipantCalculationServiceApi.CalculateParticipantResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return messagingParticipantImportServiceApi.ListParticipantImportsResponse.fromPartial({
      participants: [{
        primaryAddress: { countryCode: (reply1?.participant?.primaryAddress?.countryCode ?? "") },
      }],
    });
  }

  /**
   * Maps a participant.
   */
  async mapParticipantImportColumns(req: messagingParticipantImportServiceApi.MapParticipantImportColumnsRequest): Promise<messagingParticipantImportServiceApi.MapParticipantImportColumnsResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "MapParticipantImportColumns", req);
    this.logger.info("map_participant_import_columns", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChannelValidationServiceApi.ExplainChannelDecisionRequest.fromPartial({
      channel: { audit: { updatedAt: req?.participant?.audit?.updatedAt } },
      context: req?.context,
      details: {
        contact: { preferredChannel: (req?.participant?.contact?.preferredChannel ?? "") },
      },
    });
    const invoke1: Unary<messagingChannelValidationServiceApi.ExplainChannelDecisionRequest, messagingChannelValidationServiceApi.ExplainChannelDecisionResponse> =
      (input, done) => this.messagingChannelValidationClient.explainChannelDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = notificationsNotificationTemplateHistoryServiceApi.ListNotificationTemplateVersionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.participant?.audit?.updatedAt,
        region: (req?.participant?.primaryAddress?.region ?? ""),
      },
    });
    const reply2 = await this.workQueue.enqueue<notificationsNotificationTemplateHistoryServiceApi.ListNotificationTemplateVersionsRequest, notificationsNotificationTemplateHistoryServiceApi.ListNotificationTemplateVersionsResponse>(
      "acme.messaging.v1.ParticipantImportService/MapParticipantImportColumns:1", request2,
    );
    const request3 = messagingChatMessageSyncServiceApi.PullChatMessagesRequest.fromPartial({
      chatMessage: {
        correlationId: (reply2?.result?.correlationId ?? ""),
        measurements: [{ unit: (reply1?.channel?.dimensions?.unit ?? "") }],
      },
      context: req?.context,
    });
    const invoke3: Unary<messagingChatMessageSyncServiceApi.PullChatMessagesRequest, messagingChatMessageSyncServiceApi.PullChatMessagesResponse> =
      (input, done) => this.messagingChatMessageSyncClient.pullChatMessages(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await inRequest(req.context!, () => call<messagingChatMessageSyncServiceApi.PullChatMessagesRequest, messagingChatMessageSyncServiceApi.PullChatMessagesResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantImportServiceApi.MapParticipantImportColumnsResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        participant: {
          relationshipManager: { userId: (reply1?.channel?.owner?.userId ?? "") },
        },
      }),
      messagingParticipantImportServiceApi.MapParticipantImportColumnsResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      messagingParticipantImportServiceApi.MapParticipantImportColumnsResponse.fromPartial({
        outcome: {
          message: (reply3?.outcome?.message ?? ""),
          status: (reply3?.result?.status ?? ""),
        },
      }),
      messagingParticipantImportServiceApi.MapParticipantImportColumnsResponse.fromPartial({
        participant: {
          name: req?.participant?.name,
          participantId: (req?.participantId ?? ""),
        },
      }),
    );
  }

  /**
   * Retrys a participant.
   */
  async retryParticipantImport(req: messagingParticipantImportServiceApi.RetryParticipantImportRequest): Promise<messagingParticipantImportServiceApi.RetryParticipantImportResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "RetryParticipantImport", req);
    this.logger.info("retry_participant_import", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationReportingServiceApi.ShareConversationReportRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (req?.details?.notify?.email ?? ""),
          name: req?.participant?.contact?.name,
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<messagingConversationReportingServiceApi.ShareConversationReportRequest, messagingConversationReportingServiceApi.ShareConversationReportResponse> =
      (input, done) => this.messagingConversationReportingClient.shareConversationReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<messagingConversationReportingServiceApi.ShareConversationReportResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = messagingChannelValidationServiceApi.ValidateChannelRequest.fromPartial({
      channel: {
        locator: { $case: "address", address: { locality: (req?.participant?.primaryAddress?.locality ?? "") } },
        audit: { updatedBy: (reply1?.conversation?.audit?.updatedBy ?? "") },
        owner: {
          email: (req?.participant?.relationshipManager?.email ?? ""),
          userId: (req?.participant?.relationshipManager?.userId ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke2: Unary<messagingChannelValidationServiceApi.ValidateChannelRequest, messagingChannelValidationServiceApi.ValidateChannelResponse> =
      (input, done) => this.messagingChannelValidationClient.validateChannel(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = localizationTranslationJobWorkflowServiceApi.RetryTranslationJobWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { phone: (req?.participant?.contact?.phone ?? "") } },
      translationJob: {
        audit: { updatedAt: req?.participant?.audit?.updatedAt },
        requester: {
          name: req?.details?.notify?.name,
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const invoke3: Unary<localizationTranslationJobWorkflowServiceApi.RetryTranslationJobWorkflowRequest, localizationTranslationJobWorkflowServiceApi.RetryTranslationJobWorkflowResponse> =
      (input, done) => this.localizationTranslationJobWorkflowClient.retryTranslationJobWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke3 = promisify(invoke3);
    const reply3 = requireReply(await asyncInvoke3(request3));
    const request4 = messagingParticipantValidationServiceApi.ValidateParticipantRequest.fromPartial({
      context: req?.context,
      participant: { contact: { phone: (req?.participant?.contact?.phone ?? "") } },
    });
    const method4 = "validateParticipant" as const;
    const invoke4: Unary<messagingParticipantValidationServiceApi.ValidateParticipantRequest, messagingParticipantValidationServiceApi.ValidateParticipantResponse> =
      (input, done) => this.messagingParticipantValidationClient[method4](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<messagingParticipantValidationServiceApi.ValidateParticipantRequest, messagingParticipantValidationServiceApi.ValidateParticipantResponse>(invoke4, request4);
    const request5 = personalizationProfileServiceApi.BatchCreateProfilesRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.context?.actor?.userId ?? ""),
        submittedBy: req?.details?.notify,
      } },
    });
    const reply5 = await upload<personalizationProfileServiceApi.BatchCreateProfilesRequest, personalizationProfileServiceApi.BatchCreateProfilesResponse>(
      (done) => this.personalizationProfileClient.batchCreateProfiles(metadataFor(request5.context), { deadline: Date.now() + 15_000 }, done), [request5],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantImportServiceApi.RetryParticipantImportResponse.fromPartial({ result: { message: (reply1?.outcome?.message ?? "") } }),
      messagingParticipantImportServiceApi.RetryParticipantImportResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        participant: {
          primaryAddress: {
            postalCode: ((reply2?.channel?.locator?.$case === "address" ? reply2?.channel?.locator.address : undefined)?.postalCode ?? ""),
          },
        },
      }),
      messagingParticipantImportServiceApi.RetryParticipantImportResponse.fromPartial({
        outcome: { nextSteps: (reply3?.outcome?.nextSteps ?? []) },
        result: { message: (reply3?.result?.message ?? "") },
      }),
      messagingParticipantImportServiceApi.RetryParticipantImportResponse.fromPartial({
        participant: {
          primaryAddress: { countryCode: (reply4?.participant?.primaryAddress?.countryCode ?? "") },
        },
      }),
      messagingParticipantImportServiceApi.RetryParticipantImportResponse.fromPartial({
        participant: {
          participantId: (req?.participantId ?? ""),
          relationshipManager: req?.participant?.relationshipManager,
        },
      }),
    );
  }

  /**
   * Validates a participant.
   */
  async validateParticipantImport(req: messagingParticipantImportServiceApi.ValidateParticipantImportRequest): Promise<messagingParticipantImportServiceApi.ValidateParticipantImportResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "ValidateParticipantImport", req);
    this.logger.info("validate_participant_import", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationReportingServiceApi.GenerateConversationReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const proxy1 = forwarding(this.messagingConversationReportingClient);
    const invoke1: Unary<messagingConversationReportingServiceApi.GenerateConversationReportRequest, messagingConversationReportingServiceApi.GenerateConversationReportResponse> =
      (input, done) => proxy1.generateConversationReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingConversationReportingServiceApi.GenerateConversationReportRequest, messagingConversationReportingServiceApi.GenerateConversationReportResponse>(invoke1, request1);
    const request2 = personalizationAffinityWorkflowServiceApi.ListAffinityWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.participant?.primaryAddress?.region ?? "") },
    });
    const invoke2: Unary<personalizationAffinityWorkflowServiceApi.ListAffinityWorkflowsRequest, personalizationAffinityWorkflowServiceApi.ListAffinityWorkflowsResponse> =
      (input, done) => this.personalizationAffinityWorkflowClient.listAffinityWorkflows(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationAffinityWorkflowServiceApi.ListAffinityWorkflowsRequest, personalizationAffinityWorkflowServiceApi.ListAffinityWorkflowsResponse>(invoke2, request2);
    const request3 = notificationsSubscriptionSyncServiceApi.StreamSubscriptionChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        action: { $case: "block", block: {
          notifyEmail: (req?.context?.actor?.email ?? ""),
          reason: (req?.reason ?? ""),
        } },
        effective: req?.participant?.preferences?.quietHours,
      } },
      context: req?.context,
    });
    const stream3 = this.notificationsSubscriptionSyncClient.streamSubscriptionChanges(metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const reading3 = collect(stream3);
    const writing3 = (async () => {
      await write(stream3, request3);
      stream3.end();
    })();
    const [messages3] = await Promise.all([reading3, writing3]);
    const reply3 = messages3.at(-1) ?? notificationsSubscriptionSyncServiceApi.StreamSubscriptionChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.details?.contact?.preferredChannel ?? "") });
    return mergeResponses(
      messagingParticipantImportServiceApi.ValidateParticipantImportResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      messagingParticipantImportServiceApi.ValidateParticipantImportResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      messagingParticipantImportServiceApi.ValidateParticipantImportResponse.fromPartial({
        participant: {
          attributes: (req?.participant?.attributes ?? {}),
          participantId: (req?.participantId ?? ""),
        },
      }),
    );
  }
}
