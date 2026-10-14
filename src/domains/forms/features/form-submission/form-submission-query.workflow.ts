/**
 * Answers read-only questions about form submissions, for screens and reports. Remote work stays behind typed client
 * ports.
 */

import * as anomaliesAnomalyServiceApi from "../../../../../.cache/proto/acme/anomalies/v1/anomaly_service.js";
import * as auditAuditEventValidationServiceApi from "../../../../../.cache/proto/acme/audit/v1/audit_event_validation_service.js";
import * as chatChatBotQueryServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_bot_query_service.js";
import * as chatChatRoomServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_service.js";
import * as communityForumQueryServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_query_service.js";
import * as formsFormFieldCalculationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_field_calculation_service.js";
import * as formsFormFieldValidationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_field_validation_service.js";
import * as formsFormSubmissionQueryServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_submission_query_service.js";
import * as formsFormSubmissionValidationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_submission_validation_service.js";
import * as formsFormValidationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_validation_service.js";
import * as notificationsNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_service.js";
import * as notificationsNotificationValidationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_validation_service.js";
import * as personalizationAffinityCalculationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_calculation_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  metadataFor,
  operation,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../../platform/rpc.js";
import { upload } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { FormsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate form submission operations and persist audit data.
 */
@injectable()
export class FormSubmissionQueryWorkflow {
  constructor(
    @inject(FormsRepository) private readonly repository: FormsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.anomalies.v1.AnomalyService") private readonly anomaliesAnomalyClient: anomaliesAnomalyServiceApi.AnomalyServiceClient,
    @inject("grpc:acme.audit.v1.AuditEventValidationService") private readonly auditAuditEventValidationClient: auditAuditEventValidationServiceApi.AuditEventValidationServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotQueryService") private readonly chatChatBotQueryClient: chatChatBotQueryServiceApi.ChatBotQueryServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomService") private readonly chatChatRoomClient: chatChatRoomServiceApi.ChatRoomServiceClient,
    @inject("grpc:acme.community.v1.ForumQueryService") private readonly communityForumQueryClient: communityForumQueryServiceApi.ForumQueryServiceClient,
    @inject("grpc:acme.forms.v1.FormFieldCalculationService") private readonly formsFormFieldCalculationClient: formsFormFieldCalculationServiceApi.FormFieldCalculationServiceClient,
    @inject("grpc:acme.forms.v1.FormFieldValidationService") private readonly formsFormFieldValidationClient: formsFormFieldValidationServiceApi.FormFieldValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionValidationService") private readonly formsFormSubmissionValidationClient: formsFormSubmissionValidationServiceApi.FormSubmissionValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormValidationService") private readonly formsFormValidationClient: formsFormValidationServiceApi.FormValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationService") private readonly notificationsNotificationClient: notificationsNotificationServiceApi.NotificationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationValidationService") private readonly notificationsNotificationValidationClient: notificationsNotificationValidationServiceApi.NotificationValidationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityCalculationService") private readonly personalizationAffinityCalculationClient: personalizationAffinityCalculationServiceApi.AffinityCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists form submissions a page at a time.
   */
  async browseFormSubmissions(req: formsFormSubmissionQueryServiceApi.BrowseFormSubmissionsRequest): Promise<formsFormSubmissionQueryServiceApi.BrowseFormSubmissionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseFormSubmissions", req);
    this.logger.info("browse_form_submissions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = formsFormFieldValidationServiceApi.NormalizeFormFieldRequest.fromPartial({
      context: input1?.context,
      details: { locale: (input1?.context?.locale ?? "") },
      formField: {
        audit: { updatedAt: input1?.filter?.createdAfter },
        owner: {
          email: (input1?.context?.actor?.email ?? ""),
          userId: (input1?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<formsFormFieldValidationServiceApi.NormalizeFormFieldRequest, formsFormFieldValidationServiceApi.NormalizeFormFieldResponse> =
      (input, done) => this.formsFormFieldValidationClient.normalizeFormField(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormFieldValidationServiceApi.NormalizeFormFieldRequest, formsFormFieldValidationServiceApi.NormalizeFormFieldResponse>(invoke1, request1);
    const request2 = communityForumQueryServiceApi.BrowseForumsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        ownerId: (req?.filter?.ownerId ?? ""),
      },
    });
    const cloned2: communityForumQueryServiceApi.BrowseForumsRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<communityForumQueryServiceApi.BrowseForumsRequest, communityForumQueryServiceApi.BrowseForumsResponse> =
      (input, done) => this.communityForumQueryClient.browseForums(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityForumQueryServiceApi.BrowseForumsRequest, communityForumQueryServiceApi.BrowseForumsResponse>(invoke2, cloned2);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      formsFormSubmissionQueryServiceApi.BrowseFormSubmissionsResponse.fromPartial({
        formSubmissions: [{ subject: { version: (reply1?.formField?.version ?? 0) } }],
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      formsFormSubmissionQueryServiceApi.BrowseFormSubmissionsResponse.fromPartial({
        formSubmissions: [{ correlationId: (reply2?.result?.correlationId ?? "") }],
      }),
    );
  }

  /**
   * Counts form submissions by status.
   */
  async countFormSubmissions(req: formsFormSubmissionQueryServiceApi.CountFormSubmissionsRequest): Promise<formsFormSubmissionQueryServiceApi.CountFormSubmissionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountFormSubmissions", req);
    this.logger.info("count_form_submissions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormValidationServiceApi.PreviewFormRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
      form: { billingAddress: { region: (req?.filter?.region ?? "") } },
    });
    const decoded1 = formsFormValidationServiceApi.PreviewFormRequest.fromJSON(
      JSON.parse(JSON.stringify(formsFormValidationServiceApi.PreviewFormRequest.toJSON(request1))),
    );
    const invoke1: Unary<formsFormValidationServiceApi.PreviewFormRequest, formsFormValidationServiceApi.PreviewFormResponse> =
      (input, done) => this.formsFormValidationClient.previewForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormValidationServiceApi.PreviewFormRequest, formsFormValidationServiceApi.PreviewFormResponse>(invoke1, decoded1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return formsFormSubmissionQueryServiceApi.CountFormSubmissionsResponse.fromPartial({
      result: {
        details: (reply1?.result?.details ?? {}),
        status: (reply1?.outcome?.status ?? ""),
      },
    });
  }

  /**
   * Streams every matching form submission.
   */
  async exportFormSubmissions(req: formsFormSubmissionQueryServiceApi.ExportFormSubmissionsRequest): Promise<formsFormSubmissionQueryServiceApi.ExportFormSubmissionsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportFormSubmissions", req);
    this.logger.info("export_form_submissions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationServiceApi.BatchGetNotificationsRequest.fromPartial({ context: req?.context });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.notifications.v1.BatchGetNotificationsRequest",
      value: Buffer.from(notificationsNotificationServiceApi.BatchGetNotificationsRequest.encode(request1).finish()),
    });
    const unpacked1 = notificationsNotificationServiceApi.BatchGetNotificationsRequest.decode(envelope1.value);
    const invoke1: Unary<notificationsNotificationServiceApi.BatchGetNotificationsRequest, notificationsNotificationServiceApi.BatchGetNotificationsResponse> =
      (input, done) => this.notificationsNotificationClient.batchGetNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationServiceApi.BatchGetNotificationsRequest, notificationsNotificationServiceApi.BatchGetNotificationsResponse>(invoke1, unpacked1);
    const request2 = formsFormFieldCalculationServiceApi.EstimateFormFieldRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const client2 = this.clients.get<formsFormFieldCalculationServiceApi.FormFieldCalculationServiceClient>("acme.forms.v1.FormFieldCalculationService");
    const invoke2: Unary<formsFormFieldCalculationServiceApi.EstimateFormFieldRequest, formsFormFieldCalculationServiceApi.EstimateFormFieldResponse> =
      (input, done) => client2.estimateFormField(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormFieldCalculationServiceApi.EstimateFormFieldRequest, formsFormFieldCalculationServiceApi.EstimateFormFieldResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return mergeResponses(
      formsFormSubmissionQueryServiceApi.ExportFormSubmissionsResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      formsFormSubmissionQueryServiceApi.ExportFormSubmissionsResponse.fromPartial({
        formSubmission: {
          subject: { displayName: (reply2?.formField?.owner?.displayName ?? "") },
        },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
    );
  }

  /**
   * Lists form submissions a page at a time.
   */
  async findFormSubmissions(req: formsFormSubmissionQueryServiceApi.FindFormSubmissionsRequest): Promise<formsFormSubmissionQueryServiceApi.FindFormSubmissionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindFormSubmissions", req);
    this.logger.info("find_form_submissions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatBotQueryServiceApi.SummarizeChatBotsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
    });
    const invoke1: Unary<chatChatBotQueryServiceApi.SummarizeChatBotsRequest, chatChatBotQueryServiceApi.SummarizeChatBotsResponse> =
      (input, done) => this.chatChatBotQueryClient.summarizeChatBots(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<chatChatBotQueryServiceApi.SummarizeChatBotsRequest, chatChatBotQueryServiceApi.SummarizeChatBotsResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = formsFormSubmissionValidationServiceApi.PreviewFormSubmissionRequest.fromPartial({
      context: req?.context,
      formSubmission: { correlationId: (reply1?.result?.correlationId ?? "") },
    });
    const invoke2: Unary<formsFormSubmissionValidationServiceApi.PreviewFormSubmissionRequest, formsFormSubmissionValidationServiceApi.PreviewFormSubmissionResponse> =
      (input, done) => this.formsFormSubmissionValidationClient.previewFormSubmission(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<formsFormSubmissionValidationServiceApi.PreviewFormSubmissionRequest, formsFormSubmissionValidationServiceApi.PreviewFormSubmissionResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      formsFormSubmissionQueryServiceApi.FindFormSubmissionsResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      formsFormSubmissionQueryServiceApi.FindFormSubmissionsResponse.fromPartial({
        formSubmissions: [{ correlationId: (reply2?.result?.correlationId ?? "") }],
      }),
    );
  }

  /**
   * Returns a form submission.
   */
  async lookupFormSubmission(req: formsFormSubmissionQueryServiceApi.LookupFormSubmissionRequest): Promise<formsFormSubmissionQueryServiceApi.LookupFormSubmissionResponse> {
    validateContext(req.context);
    if (!req.formSubmissionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_submission_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupFormSubmission", req);
    this.logger.info("lookup_form_submission", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationValidationServiceApi.PreviewNotificationRequest.fromPartial({
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
      notification: {
        assignee: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
        history: [{ changedAt: req?.context?.deadline }],
      },
    });
    const invoke1: Unary<notificationsNotificationValidationServiceApi.PreviewNotificationRequest, notificationsNotificationValidationServiceApi.PreviewNotificationResponse> =
      (input, done) => this.notificationsNotificationValidationClient.previewNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("LookupFormSubmission.PreviewNotification", () => call<notificationsNotificationValidationServiceApi.PreviewNotificationRequest, notificationsNotificationValidationServiceApi.PreviewNotificationResponse>(invoke1, request1));
    return mergeResponses(
      formsFormSubmissionQueryServiceApi.LookupFormSubmissionResponse.fromPartial({
        formSubmission: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      formsFormSubmissionQueryServiceApi.LookupFormSubmissionResponse.fromPartial({ formSubmission: { formSubmissionId: (req?.formSubmissionId ?? "") } }),
    );
  }

  /**
   * Returns a form submission.
   */
  async peekFormSubmission(req: formsFormSubmissionQueryServiceApi.PeekFormSubmissionRequest): Promise<formsFormSubmissionQueryServiceApi.PeekFormSubmissionResponse> {
    validateContext(req.context);
    if (!req.formSubmissionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_submission_id is required");
    }
    await this.repository.record(req.context.tenantId, "PeekFormSubmission", req);
    this.logger.info("peek_form_submission", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityCalculationServiceApi.CalculateAffinityRequest.fromPartial({
      affinity: {
        correlationId: (req?.formSubmissionId ?? ""),
        measurements: [{ observedAt: req?.context?.deadline }],
        source: (req?.context?.traceId ?? ""),
      },
      annotations: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      context: req?.context,
    });
    const invoke1: Unary<personalizationAffinityCalculationServiceApi.CalculateAffinityRequest, personalizationAffinityCalculationServiceApi.CalculateAffinityResponse> =
      (input, done) => this.personalizationAffinityCalculationClient.calculateAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    return mergeResponses(
      formsFormSubmissionQueryServiceApi.PeekFormSubmissionResponse.fromPartial({ formSubmission: { attributes: (reply1?.affinity?.attributes ?? {}) } }),
      formsFormSubmissionQueryServiceApi.PeekFormSubmissionResponse.fromPartial({ formSubmission: { formSubmissionId: (req?.formSubmissionId ?? "") } }),
    );
  }

  /**
   * Returns several form submissions at once.
   */
  async resolveFormSubmissions(req: formsFormSubmissionQueryServiceApi.ResolveFormSubmissionsRequest): Promise<formsFormSubmissionQueryServiceApi.ResolveFormSubmissionsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveFormSubmissions", req);
    this.logger.info("resolve_form_submissions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = anomaliesAnomalyServiceApi.UpdateAnomalyRequest.fromPartial({
      anomaly: {
        assignee: { userId: (req?.context?.actor?.userId ?? "") },
        requester: { email: (req?.context?.actor?.email ?? "") },
        tags: (req?.formSubmissionIds ?? []).map((value) => value),
      },
      context: req?.context,
    });
    const reply1 = await this.workQueue.enqueue<anomaliesAnomalyServiceApi.UpdateAnomalyRequest, anomaliesAnomalyServiceApi.UpdateAnomalyResponse>(
      "acme.forms.v1.FormSubmissionQueryService/ResolveFormSubmissions:0", request1,
    );
    let selected2_2: string | undefined;
    switch (reply1?.anomaly?.origin?.$case) {
      case "customer":
        selected2_2 = ((reply1?.anomaly?.origin?.$case === "customer" ? reply1?.anomaly?.origin.customer : undefined)?.displayName ?? "");
        break;
      default:
        selected2_2 = "";
    }
    const request2 = auditAuditEventValidationServiceApi.PreviewAuditEventRequest.fromPartial({
      auditEvent: { subject: { displayName: (selected2_2 ?? "") } },
      context: req?.context,
      details: {
        contact: {
          email: (reply1?.anomaly?.assignee?.email ?? ""),
          phone: (reply1?.anomaly?.requester?.phone ?? ""),
        },
      },
    });
    const invoke2: Unary<auditAuditEventValidationServiceApi.PreviewAuditEventRequest, auditAuditEventValidationServiceApi.PreviewAuditEventResponse> =
      (input, done) => this.auditAuditEventValidationClient.previewAuditEvent(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<auditAuditEventValidationServiceApi.PreviewAuditEventRequest, auditAuditEventValidationServiceApi.PreviewAuditEventResponse>(invoke2, request2);
    return mergeResponses(
      formsFormSubmissionQueryServiceApi.ResolveFormSubmissionsResponse.fromPartial({
        formSubmissions: [{
          subject: { displayName: (reply1?.anomaly?.assignee?.displayName ?? "") },
        }],
      }),
      formsFormSubmissionQueryServiceApi.ResolveFormSubmissionsResponse.fromPartial({
        formSubmissions: [{ kind: (reply2?.auditEvent?.kind ?? "") }],
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
    );
  }

  /**
   * Summarizes a form submission.
   */
  async summarizeFormSubmissions(req: formsFormSubmissionQueryServiceApi.SummarizeFormSubmissionsRequest): Promise<formsFormSubmissionQueryServiceApi.SummarizeFormSubmissionsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeFormSubmissions", req);
    this.logger.info("summarize_form_submissions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormFieldCalculationServiceApi.CalculateFormFieldRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<formsFormFieldCalculationServiceApi.CalculateFormFieldRequest, formsFormFieldCalculationServiceApi.CalculateFormFieldResponse> =
      (input, done) => this.formsFormFieldCalculationClient.calculateFormField(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<formsFormFieldCalculationServiceApi.CalculateFormFieldResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = chatChatRoomServiceApi.BatchCreateChatRoomsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        format: (req?.details?.format ?? ""),
        source: (reply1?.formField?.formFieldId ?? ""),
        submittedBy: { email: (reply1?.formField?.owner?.email ?? "") },
      } },
    });
    const reply2 = await upload<chatChatRoomServiceApi.BatchCreateChatRoomsRequest, chatChatRoomServiceApi.BatchCreateChatRoomsResponse>(
      (done) => this.chatChatRoomClient.batchCreateChatRooms(metadataFor(request2.context), { deadline: Date.now() + 15_000 }, done), [request2],
    );
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      formsFormSubmissionQueryServiceApi.SummarizeFormSubmissionsResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      formsFormSubmissionQueryServiceApi.SummarizeFormSubmissionsResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}
