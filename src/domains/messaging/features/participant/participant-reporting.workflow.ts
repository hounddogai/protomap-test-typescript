/**
 * Builds and schedules reports about participants. Remote work stays behind typed client ports.
 */

import * as boxofficeBoxOfficeSaleCalculationServiceApi from "../../../../../.cache/proto/acme/boxoffice/v1/box_office_sale_calculation_service.js";
import * as chatHandoffSyncServiceApi from "../../../../../.cache/proto/acme/chat/v1/handoff_sync_service.js";
import * as communityModerationApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/moderation_approval_service.js";
import * as experimentsExposureApprovalServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_approval_service.js";
import * as featureflagsFeatureFlagServiceApi from "../../../../../.cache/proto/acme/featureflags/v1/feature_flag_service.js";
import * as labelingLabelingTaskServiceApi from "../../../../../.cache/proto/acme/labeling/v1/labeling_task_service.js";
import * as merchandisingCollectionServiceApi from "../../../../../.cache/proto/acme/merchandising/v1/collection_service.js";
import * as messagingChatMessageQueryServiceApi from "../../../../../.cache/proto/acme/messaging/v1/chat_message_query_service.js";
import * as messagingChatMessageSyncServiceApi from "../../../../../.cache/proto/acme/messaging/v1/chat_message_sync_service.js";
import * as messagingChatMessageValidationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/chat_message_validation_service.js";
import * as messagingConversationReportingServiceApi from "../../../../../.cache/proto/acme/messaging/v1/conversation_reporting_service.js";
import * as messagingParticipantImportServiceApi from "../../../../../.cache/proto/acme/messaging/v1/participant_import_service.js";
import * as messagingParticipantReportingServiceApi from "../../../../../.cache/proto/acme/messaging/v1/participant_reporting_service.js";
import * as messagingParticipantSyncServiceApi from "../../../../../.cache/proto/acme/messaging/v1/participant_sync_service.js";
import * as notificationsDeliveryAttemptCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_calculation_service.js";
import * as notificationsNotificationNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_notification_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  metadataFor,
  operation,
  promised,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../../platform/rpc.js";
import { collect, write } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { MessagingRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate participant operations and persist audit data.
 */
@injectable()
export class ParticipantReportingWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.boxoffice.v1.BoxOfficeSaleCalculationService") private readonly boxofficeBoxOfficeSaleCalculationClient: boxofficeBoxOfficeSaleCalculationServiceApi.BoxOfficeSaleCalculationServiceClient,
    @inject("grpc:acme.chat.v1.HandoffSyncService") private readonly chatHandoffSyncClient: chatHandoffSyncServiceApi.HandoffSyncServiceClient,
    @inject("grpc:acme.community.v1.ModerationApprovalService") private readonly communityModerationApprovalClient: communityModerationApprovalServiceApi.ModerationApprovalServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureApprovalService") private readonly experimentsExposureApprovalClient: experimentsExposureApprovalServiceApi.ExposureApprovalServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagService") private readonly featureflagsFeatureFlagClient: featureflagsFeatureFlagServiceApi.FeatureFlagServiceClient,
    @inject("grpc:acme.labeling.v1.LabelingTaskService") private readonly labelingLabelingTaskClient: labelingLabelingTaskServiceApi.LabelingTaskServiceClient,
    @inject("grpc:acme.merchandising.v1.CollectionService") private readonly merchandisingCollectionClient: merchandisingCollectionServiceApi.CollectionServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageQueryService") private readonly messagingChatMessageQueryClient: messagingChatMessageQueryServiceApi.ChatMessageQueryServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageSyncService") private readonly messagingChatMessageSyncClient: messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageValidationService") private readonly messagingChatMessageValidationClient: messagingChatMessageValidationServiceApi.ChatMessageValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationReportingService") private readonly messagingConversationReportingClient: messagingConversationReportingServiceApi.ConversationReportingServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantImportService") private readonly messagingParticipantImportClient: messagingParticipantImportServiceApi.ParticipantImportServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantSyncService") private readonly messagingParticipantSyncClient: messagingParticipantSyncServiceApi.ParticipantSyncServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptCalculationService") private readonly notificationsDeliveryAttemptCalculationClient: notificationsDeliveryAttemptCalculationServiceApi.DeliveryAttemptCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationNotificationService") private readonly notificationsNotificationNotificationClient: notificationsNotificationNotificationServiceApi.NotificationNotificationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Counts participants by status.
   */
  async countParticipantTotals(req: messagingParticipantReportingServiceApi.CountParticipantTotalsRequest): Promise<messagingParticipantReportingServiceApi.CountParticipantTotalsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountParticipantTotals", req);
    this.logger.info("count_participant_totals", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageQueryServiceApi.SummarizeChatMessagesRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<messagingChatMessageQueryServiceApi.SummarizeChatMessagesRequest, messagingChatMessageQueryServiceApi.SummarizeChatMessagesResponse> =
      (input, done) => this.messagingChatMessageQueryClient.summarizeChatMessages(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChatMessageQueryServiceApi.SummarizeChatMessagesRequest, messagingChatMessageQueryServiceApi.SummarizeChatMessagesResponse>(invoke1, spread1);
    const request2 = chatHandoffSyncServiceApi.StreamHandoffChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        assignee: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
        subject: (req?.context?.actor?.userId ?? ""),
      } },
      context: req?.context,
    });
    const stream2 = this.chatHandoffSyncClient.streamHandoffChanges(metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const reading2 = collect(stream2);
    const writing2 = (async () => {
      await write(stream2, request2);
      stream2.end();
    })();
    const [messages2] = await Promise.all([reading2, writing2]);
    const reply2 = messages2.at(-1) ?? chatHandoffSyncServiceApi.StreamHandoffChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return messagingParticipantReportingServiceApi.CountParticipantTotalsResponse.fromPartial({
      result: {
        details: (reply1?.result?.details ?? {}),
        status: (reply1?.result?.status ?? ""),
      },
    });
  }

  /**
   * Deletes a participant.
   */
  async deleteParticipantReport(req: messagingParticipantReportingServiceApi.DeleteParticipantReportRequest): Promise<messagingParticipantReportingServiceApi.DeleteParticipantReportResponse> {
    validateContext(req.context);
    if (!req.participantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "participant_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeleteParticipantReport", req);
    this.logger.info("delete_participant_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = notificationsDeliveryAttemptCalculationServiceApi.EstimateDeliveryAttemptRequest.fromPartial({
      context: input1?.context,
      deliveryAttempt: { measurements: [{ observedAt: input1?.context?.deadline }] },
      reason: (input1?.reason ?? ""),
    });
    const invoke1: Unary<notificationsDeliveryAttemptCalculationServiceApi.EstimateDeliveryAttemptRequest, notificationsDeliveryAttemptCalculationServiceApi.EstimateDeliveryAttemptResponse> =
      (input, done) => this.notificationsDeliveryAttemptCalculationClient.estimateDeliveryAttempt(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptCalculationServiceApi.EstimateDeliveryAttemptRequest, notificationsDeliveryAttemptCalculationServiceApi.EstimateDeliveryAttemptResponse>(invoke1, request1);
    const request2 = messagingParticipantImportServiceApi.ListParticipantImportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.deliveryAttempt?.occurredAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (reply1?.deliveryAttempt?.subject?.notificationTemplateId ?? ""),
      },
    });
    const cloned2: messagingParticipantImportServiceApi.ListParticipantImportsRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<messagingParticipantImportServiceApi.ListParticipantImportsRequest, messagingParticipantImportServiceApi.ListParticipantImportsResponse> =
      (input, done) => this.messagingParticipantImportClient.listParticipantImports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingParticipantImportServiceApi.ListParticipantImportsRequest, messagingParticipantImportServiceApi.ListParticipantImportsResponse>(invoke2, cloned2);
    const request3 = messagingConversationReportingServiceApi.ScheduleConversationReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((reply1?.deliveryAttempt?.attributes ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const decoded3 = messagingConversationReportingServiceApi.ScheduleConversationReportRequest.fromJSON(
      JSON.parse(JSON.stringify(messagingConversationReportingServiceApi.ScheduleConversationReportRequest.toJSON(request3))),
    );
    const invoke3: Unary<messagingConversationReportingServiceApi.ScheduleConversationReportRequest, messagingConversationReportingServiceApi.ScheduleConversationReportResponse> =
      (input, done) => this.messagingConversationReportingClient.scheduleConversationReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<messagingConversationReportingServiceApi.ScheduleConversationReportRequest, messagingConversationReportingServiceApi.ScheduleConversationReportResponse>(invoke3, decoded3);
    this.logger.info("local_audit", { value: (req?.etag ?? "") });
    return mergeResponses(
      messagingParticipantReportingServiceApi.DeleteParticipantReportResponse.fromPartial({
        result: {
          correlationId: (reply1?.deliveryAttempt?.correlationId ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      messagingParticipantReportingServiceApi.DeleteParticipantReportResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      messagingParticipantReportingServiceApi.DeleteParticipantReportResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
    );
  }

  /**
   * Returns a participant.
   */
  async fetchParticipantReport(req: messagingParticipantReportingServiceApi.FetchParticipantReportRequest): Promise<messagingParticipantReportingServiceApi.FetchParticipantReportResponse> {
    validateContext(req.context);
    if (!req.participantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "participant_id is required");
    }
    await this.repository.record(req.context.tenantId, "FetchParticipantReport", req);
    this.logger.info("fetch_participant_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagServiceApi.CreateFeatureFlagRequest.fromPartial({
      context: req?.context,
      featureFlag: { owner: { email: (req?.context?.actor?.email ?? "") } },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.featureflags.v1.CreateFeatureFlagRequest",
      value: Buffer.from(featureflagsFeatureFlagServiceApi.CreateFeatureFlagRequest.encode(request1).finish()),
    });
    const unpacked1 = featureflagsFeatureFlagServiceApi.CreateFeatureFlagRequest.decode(envelope1.value);
    const invoke1: Unary<featureflagsFeatureFlagServiceApi.CreateFeatureFlagRequest, featureflagsFeatureFlagServiceApi.CreateFeatureFlagResponse> =
      (input, done) => this.featureflagsFeatureFlagClient.createFeatureFlag(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<featureflagsFeatureFlagServiceApi.CreateFeatureFlagRequest, featureflagsFeatureFlagServiceApi.CreateFeatureFlagResponse>(invoke1, unpacked1);
    const request2 = notificationsNotificationNotificationServiceApi.StreamNotificationNoticesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.featureFlag?.audit?.updatedAt,
        ownerId: (reply1?.featureFlag?.owner?.userId ?? ""),
      },
      since: reply1?.featureFlag?.audit?.createdAt,
      subscriber: { email: (reply1?.featureFlag?.owner?.email ?? "") },
    });
    const stream2 = this.notificationsNotificationNotificationClient.streamNotificationNotices(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? notificationsNotificationNotificationServiceApi.StreamNotificationNoticesResponse.fromPartial({});
    return mergeResponses(
      messagingParticipantReportingServiceApi.FetchParticipantReportResponse.fromPartial({
        participant: { audit: { createdAt: reply1?.featureFlag?.audit?.createdAt } },
      }),
      messagingParticipantReportingServiceApi.FetchParticipantReportResponse.fromPartial({ participant: { participantId: (req?.participantId ?? "") } }),
    );
  }

  /**
   * Generates a participant.
   */
  async generateParticipantReport(req: messagingParticipantReportingServiceApi.GenerateParticipantReportRequest): Promise<messagingParticipantReportingServiceApi.GenerateParticipantReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "GenerateParticipantReport", req);
    this.logger.info("generate_participant_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingParticipantImportServiceApi.ValidateParticipantImportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      participant: { relationshipManager: { userId: (req?.context?.actor?.userId ?? "") } },
      participantId: (req?.participantId ?? ""),
      reason: (req?.reason ?? ""),
    });
    const client1 = this.clients.get<messagingParticipantImportServiceApi.ParticipantImportServiceClient>("acme.messaging.v1.ParticipantImportService");
    const invoke1: Unary<messagingParticipantImportServiceApi.ValidateParticipantImportRequest, messagingParticipantImportServiceApi.ValidateParticipantImportResponse> =
      (input, done) => client1.validateParticipantImport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingParticipantImportServiceApi.ValidateParticipantImportRequest, messagingParticipantImportServiceApi.ValidateParticipantImportResponse>(invoke1, request1);
    const request2 = experimentsExposureApprovalServiceApi.SubmitExposureRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          displayName: (reply1?.participant?.relationshipManager?.displayName ?? ""),
          email: (reply1?.participant?.relationshipManager?.email ?? ""),
        },
        effectiveAt: reply1?.outcome?.effectiveAt,
      },
    });
    const invoke2: Unary<experimentsExposureApprovalServiceApi.SubmitExposureRequest, experimentsExposureApprovalServiceApi.SubmitExposureResponse> =
      (input, done) => this.experimentsExposureApprovalClient.submitExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<experimentsExposureApprovalServiceApi.SubmitExposureRequest, experimentsExposureApprovalServiceApi.SubmitExposureResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      messagingParticipantReportingServiceApi.GenerateParticipantReportResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      messagingParticipantReportingServiceApi.GenerateParticipantReportResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          details: (reply2?.result?.details ?? {}),
        },
      }),
      messagingParticipantReportingServiceApi.GenerateParticipantReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Lists participants a page at a time.
   */
  async listParticipantReports(req: messagingParticipantReportingServiceApi.ListParticipantReportsRequest): Promise<messagingParticipantReportingServiceApi.ListParticipantReportsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListParticipantReports", req);
    this.logger.info("list_participant_reports", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return messagingParticipantReportingServiceApi.ListParticipantReportsResponse.fromPartial({});
  }

  /**
   * Schedules a participant.
   */
  async scheduleParticipantReport(req: messagingParticipantReportingServiceApi.ScheduleParticipantReportRequest): Promise<messagingParticipantReportingServiceApi.ScheduleParticipantReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ScheduleParticipantReport", req);
    this.logger.info("schedule_participant_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingParticipantSyncServiceApi.SyncParticipantsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      participant: {
        participantId: (req?.participantId ?? ""),
        relationshipManager: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const invoke1: Unary<messagingParticipantSyncServiceApi.SyncParticipantsRequest, messagingParticipantSyncServiceApi.SyncParticipantsResponse> =
      (input, done) => this.messagingParticipantSyncClient.syncParticipants(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<messagingParticipantSyncServiceApi.SyncParticipantsRequest, messagingParticipantSyncServiceApi.SyncParticipantsResponse>(invoke1, request1));
    const request2 = boxofficeBoxOfficeSaleCalculationServiceApi.EstimateBoxOfficeSaleRequest.fromPartial({
      boxOfficeSale: {
        audit: { updatedBy: (reply1?.participant?.audit?.updatedBy ?? "") },
        billingAddress: {
          countryCode: (reply1?.participant?.primaryAddress?.countryCode ?? ""),
          postalCode: (reply1?.participant?.primaryAddress?.postalCode ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke2: Unary<boxofficeBoxOfficeSaleCalculationServiceApi.EstimateBoxOfficeSaleRequest, boxofficeBoxOfficeSaleCalculationServiceApi.EstimateBoxOfficeSaleResponse> =
      (input, done) => this.boxofficeBoxOfficeSaleCalculationClient.estimateBoxOfficeSale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("ScheduleParticipantReport.EstimateBoxOfficeSale", () => call<boxofficeBoxOfficeSaleCalculationServiceApi.EstimateBoxOfficeSaleRequest, boxofficeBoxOfficeSaleCalculationServiceApi.EstimateBoxOfficeSaleResponse>(invoke2, request2));
    const request3 = communityModerationApprovalServiceApi.ApproveModerationRequest.fromPartial({
      context: req?.context,
      moderation: {
        audit: { createdBy: (reply1?.participant?.audit?.createdBy ?? "") },
        comments: [{ createdAt: reply1?.participant?.audit?.createdAt }],
        origin: { $case: "customer", customer: { email: (reply1?.participant?.relationshipManager?.email ?? "") } },
        requester: { name: reply1?.participant?.contact?.name },
      },
    });
    const invoke3: Unary<communityModerationApprovalServiceApi.ApproveModerationRequest, communityModerationApprovalServiceApi.ApproveModerationResponse> =
      (input, done) => this.communityModerationApprovalClient.approveModeration(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    const request4 = messagingChatMessageValidationServiceApi.LintChatMessagesRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (reply1?.participant?.contact?.email ?? ""),
          phone: (reply1?.participant?.contact?.phone ?? ""),
        },
      },
    });
    const reply4 = await this.workQueue.enqueue<messagingChatMessageValidationServiceApi.LintChatMessagesRequest, messagingChatMessageValidationServiceApi.LintChatMessagesResponse>(
      "acme.messaging.v1.ParticipantReportingService/ScheduleParticipantReport:3", request4,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantReportingServiceApi.ScheduleParticipantReportResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      messagingParticipantReportingServiceApi.ScheduleParticipantReportResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      messagingParticipantReportingServiceApi.ScheduleParticipantReportResponse.fromPartial({
        result: {
          message: (reply3?.result?.message ?? ""),
          status: (reply3?.outcome?.status ?? ""),
        },
      }),
      messagingParticipantReportingServiceApi.ScheduleParticipantReportResponse.fromPartial({
        result: {
          message: (reply4?.result?.message ?? ""),
          status: (reply4?.result?.status ?? ""),
        },
      }),
      messagingParticipantReportingServiceApi.ScheduleParticipantReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Shares a participant.
   */
  async shareParticipantReport(req: messagingParticipantReportingServiceApi.ShareParticipantReportRequest): Promise<messagingParticipantReportingServiceApi.ShareParticipantReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ShareParticipantReport", req);
    this.logger.info("share_participant_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = labelingLabelingTaskServiceApi.UpdateLabelingTaskRequest.fromPartial({
      context: req?.context,
      labelingTask: {
        requester: {
          name: req?.details?.recipient?.name,
          preferredChannel: (req?.details?.recipient?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<labelingLabelingTaskServiceApi.UpdateLabelingTaskRequest, labelingLabelingTaskServiceApi.UpdateLabelingTaskResponse> =
      (input, done) => this.labelingLabelingTaskClient.updateLabelingTask(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<labelingLabelingTaskServiceApi.UpdateLabelingTaskRequest, labelingLabelingTaskServiceApi.UpdateLabelingTaskResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantReportingServiceApi.ShareParticipantReportResponse.fromPartial({
        participant: { audit: { createdBy: (reply1?.labelingTask?.audit?.createdBy ?? "") } },
      }),
      messagingParticipantReportingServiceApi.ShareParticipantReportResponse.fromPartial({
        participant: {
          contact: { phone: (req?.details?.recipient?.phone ?? "") },
          participantId: (req?.participantId ?? ""),
        },
      }),
    );
  }

  /**
   * Streams the changes of participants as they happen.
   */
  async streamParticipantMetrics(req: messagingParticipantReportingServiceApi.StreamParticipantMetricsRequest): Promise<messagingParticipantReportingServiceApi.StreamParticipantMetricsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamParticipantMetrics", req);
    this.logger.info("stream_participant_metrics", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityModerationApprovalServiceApi.ListPendingModerationsRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.filter?.createdAfter },
    });
    const invoke1: Unary<communityModerationApprovalServiceApi.ListPendingModerationsRequest, communityModerationApprovalServiceApi.ListPendingModerationsResponse> =
      (input, done) => this.communityModerationApprovalClient.listPendingModerations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<communityModerationApprovalServiceApi.ListPendingModerationsResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = merchandisingCollectionServiceApi.CreateCollectionRequest.fromPartial({
      collection: {
        children: [{
          children: [{
            audit: { createdAt: req?.filter?.createdAfter },
            manager: {
              email: (req?.subscriber?.email ?? ""),
              userId: (req?.context?.actor?.userId ?? ""),
            },
          }],
          location: { region: (req?.filter?.region ?? "") },
        }],
      },
      context: req?.context,
    });
    const invoke2: Unary<merchandisingCollectionServiceApi.CreateCollectionRequest, merchandisingCollectionServiceApi.CreateCollectionResponse> =
      (input, done) => this.merchandisingCollectionClient.createCollection(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = messagingChatMessageSyncServiceApi.SyncChatMessagesRequest.fromPartial({
      chatMessage: {
        attributes: Object.fromEntries(Object.entries((reply2?.collection?.attributes ?? {}))),
        correlationId: (reply1?.result?.correlationId ?? ""),
        subject: { displayName: (reply2?.collection?.manager?.displayName ?? "") },
      },
      context: req?.context,
    });
    const invoke3: Unary<messagingChatMessageSyncServiceApi.SyncChatMessagesRequest, messagingChatMessageSyncServiceApi.SyncChatMessagesResponse> =
      (input, done) => this.messagingChatMessageSyncClient.syncChatMessages(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke3 = promisify(invoke3);
    const reply3 = requireReply(await asyncInvoke3(request3));
    this.logger.info("local_audit", { value: (req?.subscriber?.preferredChannel ?? "") });
    return mergeResponses(
      messagingParticipantReportingServiceApi.StreamParticipantMetricsResponse.fromPartial({
        result: {
          referenceIds: (reply1?.result?.referenceIds ?? []),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      messagingParticipantReportingServiceApi.StreamParticipantMetricsResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      messagingParticipantReportingServiceApi.StreamParticipantMetricsResponse.fromPartial({
        participant: { attributes: (reply3?.chatMessage?.attributes ?? {}) },
        result: { status: (reply3?.result?.status ?? "") },
      }),
      messagingParticipantReportingServiceApi.StreamParticipantMetricsResponse.fromPartial({
        participant: {
          name: req?.subscriber?.name,
          primaryAddress: { region: (req?.filter?.region ?? "") },
        },
      }),
    );
  }
}
