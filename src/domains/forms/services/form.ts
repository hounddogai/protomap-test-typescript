/**
 * Manages forms: creates, reads, changes, and lists them. Remote work stays behind typed client ports.
 */

import * as chatChatRoomCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_calculation_service.js";
import * as communityForumValidationServiceApi from "../../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as formsFormQueryServiceApi from "../../../../.cache/proto/acme/forms/v1/form_query_service.js";
import * as formsFormServiceApi from "../../../../.cache/proto/acme/forms/v1/form_service.js";
import * as formsFormValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_validation_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import * as notificationsNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_service.js";
import * as notificationsNotificationValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_validation_service.js";
import * as personalizationAffinityCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_calculation_service.js";
import * as prescriptionsPrescriptionServiceApi from "../../../../.cache/proto/acme/prescriptions/v1/prescription_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import * as venuesVenueQueryServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_query_service.js";
import * as venuesVenueServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_service.js";
import * as venuesVenueValidationServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
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
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toFormRecord } from "../data/records.js";
import { FormsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate form operations and persist audit data.
 */
@injectable()
export class FormWorkflow {
  constructor(
    @inject(FormsRepository) private readonly repository: FormsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.ChatRoomCalculationService") private readonly chatChatRoomCalculationClient: chatChatRoomCalculationServiceApi.ChatRoomCalculationServiceClient,
    @inject("grpc:acme.community.v1.ForumValidationService") private readonly communityForumValidationClient: communityForumValidationServiceApi.ForumValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormQueryService") private readonly formsFormQueryClient: formsFormQueryServiceApi.FormQueryServiceClient,
    @inject("grpc:acme.forms.v1.FormValidationService") private readonly formsFormValidationClient: formsFormValidationServiceApi.FormValidationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptSyncService") private readonly notificationsDeliveryAttemptSyncClient: notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationService") private readonly notificationsNotificationClient: notificationsNotificationServiceApi.NotificationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationValidationService") private readonly notificationsNotificationValidationClient: notificationsNotificationValidationServiceApi.NotificationValidationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityCalculationService") private readonly personalizationAffinityCalculationClient: personalizationAffinityCalculationServiceApi.AffinityCalculationServiceClient,
    @inject("grpc:acme.prescriptions.v1.PrescriptionService") private readonly prescriptionsPrescriptionClient: prescriptionsPrescriptionServiceApi.PrescriptionServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexValidationService") private readonly searchSearchIndexValidationClient: searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient,
    @inject("grpc:acme.venues.v1.VenueQueryService") private readonly venuesVenueQueryClient: venuesVenueQueryServiceApi.VenueQueryServiceClient,
    @inject("grpc:acme.venues.v1.VenueService") private readonly venuesVenueClient: venuesVenueServiceApi.VenueServiceClient,
    @inject("grpc:acme.venues.v1.VenueValidationService") private readonly venuesVenueValidationClient: venuesVenueValidationServiceApi.VenueValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Returns several forms at once.
   */
  async batchGetForms(req: formsFormServiceApi.BatchGetFormsRequest): Promise<formsFormServiceApi.BatchGetFormsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchGetForms", req);
    this.logger.info("batch_get_forms", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = venuesVenueValidationServiceApi.ExplainVenueDecisionRequest.fromPartial({
      context: input1?.context,
      details: { contact: { email: (input1?.context?.actor?.email ?? "") } },
    });
    const invoke1: Unary<venuesVenueValidationServiceApi.ExplainVenueDecisionRequest, venuesVenueValidationServiceApi.ExplainVenueDecisionResponse> =
      (input, done) => this.venuesVenueValidationClient.explainVenueDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<venuesVenueValidationServiceApi.ExplainVenueDecisionRequest, venuesVenueValidationServiceApi.ExplainVenueDecisionResponse>(invoke1, request1);
    return formsFormServiceApi.BatchGetFormsResponse.fromPartial({
      forms: [{
        counterparty: { displayName: (reply1?.venue?.owner?.displayName ?? "") },
      }],
    });
  }

  /**
   * Creates a form.
   */
  async cloneForm(req: formsFormServiceApi.CloneFormRequest): Promise<formsFormServiceApi.CloneFormResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "CloneForm", req);
    this.logger.info("clone_form", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_3: string | undefined;
    switch (req?.form?.settlement?.$case) {
      case "bank":
        selected1_3 = ((req?.form?.settlement?.$case === "bank" ? req?.form?.settlement.bank : undefined)?.iban ?? "");
        break;
      default:
        selected1_3 = "";
    }
    const request1 = formsFormValidationServiceApi.LintFormsRequest.fromPartial({
      context: req?.context,
      form: {
        audit: { createdBy: (req?.form?.audit?.createdBy ?? "") },
        settlement: { $case: "bank", bank: { iban: (selected1_3 ?? "") } },
        billingAddress: { locality: (req?.form?.billingAddress?.locality ?? "") },
      },
    });
    const invoke1: Unary<formsFormValidationServiceApi.LintFormsRequest, formsFormValidationServiceApi.LintFormsResponse> =
      (input, done) => this.formsFormValidationClient.lintForms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormValidationServiceApi.LintFormsRequest, formsFormValidationServiceApi.LintFormsResponse>(invoke1, request1);
    const request2 = venuesVenueServiceApi.SearchVenuesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.form?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.form?.metadata ?? {}))),
        ownerId: (reply1?.form?.counterparty?.customerId ?? ""),
        region: (reply1?.form?.billingAddress?.region ?? ""),
      },
    });
    const decoded2 = venuesVenueServiceApi.SearchVenuesRequest.fromJSON(
      JSON.parse(JSON.stringify(venuesVenueServiceApi.SearchVenuesRequest.toJSON(request2))),
    );
    const invoke2: Unary<venuesVenueServiceApi.SearchVenuesRequest, venuesVenueServiceApi.SearchVenuesResponse> =
      (input, done) => this.venuesVenueClient.searchVenues(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<venuesVenueServiceApi.SearchVenuesRequest, venuesVenueServiceApi.SearchVenuesResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      formsFormServiceApi.CloneFormResponse.fromPartial({ form: { issuedAt: reply1?.form?.issuedAt } }),
      formsFormServiceApi.CloneFormResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      formsFormServiceApi.CloneFormResponse.fromPartial({
        form: {
          dueAt: req?.form?.dueAt,
          notes: (req?.form?.notes ?? ""),
        },
      }),
    );
  }

  /**
   * Creates a form.
   */
  async createForm(req: formsFormServiceApi.CreateFormRequest): Promise<formsFormServiceApi.CreateFormResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "CreateForm", req);
    this.logger.info("create_form", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomCalculationServiceApi.SimulateChatRoomRequest.fromPartial({
      chatRoom: {
        audit: {
          createdAt: req?.form?.audit?.createdAt,
          updatedAt: req?.form?.audit?.updatedAt,
          updatedBy: (req?.form?.audit?.updatedBy ?? ""),
        },
        owner: { displayName: (req?.form?.counterparty?.displayName ?? "") },
      },
      context: req?.context,
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.chat.v1.SimulateChatRoomRequest",
      value: Buffer.from(chatChatRoomCalculationServiceApi.SimulateChatRoomRequest.encode(request1).finish()),
    });
    const unpacked1 = chatChatRoomCalculationServiceApi.SimulateChatRoomRequest.decode(envelope1.value);
    const invoke1: Unary<chatChatRoomCalculationServiceApi.SimulateChatRoomRequest, chatChatRoomCalculationServiceApi.SimulateChatRoomResponse> =
      (input, done) => this.chatChatRoomCalculationClient.simulateChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomCalculationServiceApi.SimulateChatRoomRequest, chatChatRoomCalculationServiceApi.SimulateChatRoomResponse>(invoke1, unpacked1);
    const request2 = communityForumValidationServiceApi.PreviewForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{ manager: { userId: (reply1?.chatRoom?.owner?.userId ?? "") } }],
        }],
      },
    });
    const client2 = this.clients.get<communityForumValidationServiceApi.ForumValidationServiceClient>("acme.community.v1.ForumValidationService");
    const invoke2: Unary<communityForumValidationServiceApi.PreviewForumRequest, communityForumValidationServiceApi.PreviewForumResponse> =
      (input, done) => client2.previewForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityForumValidationServiceApi.PreviewForumRequest, communityForumValidationServiceApi.PreviewForumResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      formsFormServiceApi.CreateFormResponse.fromPartial({
        form: {
          counterparty: { email: (reply1?.chatRoom?.owner?.email ?? "") },
          total: reply1?.breakdown?.total,
        },
      }),
      formsFormServiceApi.CreateFormResponse.fromPartial({
        form: {
          audit: {
            createdAt: reply2?.forum?.audit?.createdAt,
            etag: (reply2?.forum?.audit?.etag ?? ""),
          },
        },
      }),
      formsFormServiceApi.CreateFormResponse.fromPartial({
        form: {
          dueAt: req?.form?.dueAt,
          formId: (req?.form?.formId ?? ""),
        },
      }),
    );
  }

  /**
   * Deletes a form.
   */
  async deleteForm(req: formsFormServiceApi.DeleteFormRequest): Promise<formsFormServiceApi.DeleteFormResponse> {
    validateContext(req.context);
    if (!req.formId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeleteForm", req);
    this.logger.info("delete_form", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomCalculationServiceApi.RecalculateChatRoomsRequest.fromPartial({
      chatRoom: { audit: { etag: (req?.etag ?? "") } },
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<chatChatRoomCalculationServiceApi.RecalculateChatRoomsRequest, chatChatRoomCalculationServiceApi.RecalculateChatRoomsResponse> =
      (input, done) => this.chatChatRoomCalculationClient.recalculateChatRooms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<chatChatRoomCalculationServiceApi.RecalculateChatRoomsRequest, chatChatRoomCalculationServiceApi.RecalculateChatRoomsResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = notificationsDeliveryAttemptSyncServiceApi.SyncDeliveryAttemptsRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        measurements: [{ unit: (reply1?.chatRoom?.dimensions?.unit ?? "") }],
        subject: { displayName: (reply1?.chatRoom?.owner?.displayName ?? "") },
      },
    });
    const invoke2: Unary<notificationsDeliveryAttemptSyncServiceApi.SyncDeliveryAttemptsRequest, notificationsDeliveryAttemptSyncServiceApi.SyncDeliveryAttemptsResponse> =
      (input, done) => this.notificationsDeliveryAttemptSyncClient.syncDeliveryAttempts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<notificationsDeliveryAttemptSyncServiceApi.SyncDeliveryAttemptsRequest, notificationsDeliveryAttemptSyncServiceApi.SyncDeliveryAttemptsResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.formId ?? "") });
    return mergeResponses(
      formsFormServiceApi.DeleteFormResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      formsFormServiceApi.DeleteFormResponse.fromPartial({ effectiveAt: reply2?.outcome?.effectiveAt }),
    );
  }

  /**
   * Returns a form.
   */
  async getForm(req: formsFormServiceApi.GetFormRequest): Promise<formsFormServiceApi.GetFormResponse> {
    validateContext(req.context);
    if (!req.formId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetForm", req);
    this.logger.info("get_form", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = venuesVenueQueryServiceApi.FindVenuesRequest.fromPartial({
      context: req?.context,
      filter: { ownerId: (req?.formId ?? "") },
    });
    const invoke1: Unary<venuesVenueQueryServiceApi.FindVenuesRequest, venuesVenueQueryServiceApi.FindVenuesResponse> =
      (input, done) => this.venuesVenueQueryClient.findVenues(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("GetForm.FindVenues", () => call<venuesVenueQueryServiceApi.FindVenuesRequest, venuesVenueQueryServiceApi.FindVenuesResponse>(invoke1, request1));
    return mergeResponses(
      formsFormServiceApi.GetFormResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      formsFormServiceApi.GetFormResponse.fromPartial({ form: { formId: (req?.formId ?? "") } }),
    );
  }

  /**
   * Lists forms a page at a time.
   */
  async listForms(req: formsFormServiceApi.ListFormsRequest): Promise<formsFormServiceApi.ListFormsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListForms", req);
    this.logger.info("list_forms", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationValidationServiceApi.NormalizeNotificationRequest.fromPartial({
      context: req?.context,
      notification: { assignee: { userId: (req?.context?.actor?.userId ?? "") } },
    });
    const invoke1: Unary<notificationsNotificationValidationServiceApi.NormalizeNotificationRequest, notificationsNotificationValidationServiceApi.NormalizeNotificationResponse> =
      (input, done) => this.notificationsNotificationValidationClient.normalizeNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = searchSearchIndexValidationServiceApi.LintSearchIndexesRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (reply1?.notification?.assignee?.email ?? "") } },
      searchIndex: { owner: { userId: (reply1?.notification?.assignee?.userId ?? "") } },
    });
    const reply2 = await this.workQueue.enqueue<searchSearchIndexValidationServiceApi.LintSearchIndexesRequest, searchSearchIndexValidationServiceApi.LintSearchIndexesResponse>(
      "acme.forms.v1.FormService/ListForms:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      formsFormServiceApi.ListFormsResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      formsFormServiceApi.ListFormsResponse.fromPartial({
        forms: [{
          billingAddress: {
            countryCode: ((reply2?.searchIndex?.locator?.$case === "address" ? reply2?.searchIndex?.locator.address : undefined)?.countryCode ?? ""),
          },
        }],
        result: { message: (reply2?.result?.message ?? "") },
      }),
    );
  }

  /**
   * Lists forms a page at a time.
   */
  async searchForms(req: formsFormServiceApi.SearchFormsRequest): Promise<formsFormServiceApi.SearchFormsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SearchForms", req);
    this.logger.info("search_forms", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = prescriptionsPrescriptionServiceApi.ListPrescriptionsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        ownerId: (req?.filter?.ownerId ?? ""),
        region: (req?.filter?.region ?? ""),
      },
      page: { pageToken: (req?.page?.pageToken ?? "") },
    });
    const invoke1: Unary<prescriptionsPrescriptionServiceApi.ListPrescriptionsRequest, prescriptionsPrescriptionServiceApi.ListPrescriptionsResponse> =
      (input, done) => this.prescriptionsPrescriptionClient.listPrescriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<prescriptionsPrescriptionServiceApi.ListPrescriptionsRequest, prescriptionsPrescriptionServiceApi.ListPrescriptionsResponse>(invoke1, request1));
    const request2 = prescriptionsPrescriptionServiceApi.UpdatePrescriptionRequest.fromPartial({
      context: req?.context,
      prescription: { billingAddress: { region: (req?.filter?.region ?? "") } },
    });
    const invoke2: Unary<prescriptionsPrescriptionServiceApi.UpdatePrescriptionRequest, prescriptionsPrescriptionServiceApi.UpdatePrescriptionResponse> =
      (input, done) => this.prescriptionsPrescriptionClient.updatePrescription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<prescriptionsPrescriptionServiceApi.UpdatePrescriptionResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      formsFormServiceApi.SearchFormsResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      formsFormServiceApi.SearchFormsResponse.fromPartial({
        forms: [{
          billingAddress: { lines: (reply2?.prescription?.billingAddress?.lines ?? []) },
        }],
      }),
    );
  }

  /**
   * Changes a form.
   */
  async updateForm(req: formsFormServiceApi.UpdateFormRequest): Promise<formsFormServiceApi.UpdateFormResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "UpdateForm", req);
    this.logger.info("update_form", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormQueryServiceApi.SuggestFormsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.form?.audit?.createdAt,
        ownerId: (req?.form?.formId ?? ""),
        region: (req?.form?.billingAddress?.region ?? ""),
      },
    });
    const invoke1: Unary<formsFormQueryServiceApi.SuggestFormsRequest, formsFormQueryServiceApi.SuggestFormsResponse> =
      (input, done) => this.formsFormQueryClient.suggestForms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = notificationsNotificationServiceApi.ListNotificationsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.form?.billingAddress?.region ?? "") },
    });
    const invoke2: Unary<notificationsNotificationServiceApi.ListNotificationsRequest, notificationsNotificationServiceApi.ListNotificationsResponse> =
      (input, done) => this.notificationsNotificationClient.listNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const request3 = personalizationAffinityCalculationServiceApi.CompareAffinityOptionsRequest.fromPartial({
      affinity: {
        subject: { displayName: (req?.form?.counterparty?.displayName ?? "") },
      },
      context: req?.context,
      details: {
        destination: {
          postalCode: (req?.form?.billingAddress?.postalCode ?? ""),
          recipient: (req?.form?.billingAddress?.recipient ?? ""),
          region: (req?.form?.billingAddress?.region ?? ""),
        },
      },
    });
    const method3 = "compareAffinityOptions" as const;
    const invoke3: Unary<personalizationAffinityCalculationServiceApi.CompareAffinityOptionsRequest, personalizationAffinityCalculationServiceApi.CompareAffinityOptionsResponse> =
      (input, done) => this.personalizationAffinityCalculationClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<personalizationAffinityCalculationServiceApi.CompareAffinityOptionsRequest, personalizationAffinityCalculationServiceApi.CompareAffinityOptionsResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.form?.audit?.etag ?? "") });
    return mergeResponses(
      formsFormServiceApi.UpdateFormResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      formsFormServiceApi.UpdateFormResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      formsFormServiceApi.UpdateFormResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
      formsFormServiceApi.UpdateFormResponse.fromPartial({
        form: {
          issuedAt: req?.form?.issuedAt,
          status: req?.form?.status,
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for FormService; workflows own validation and database transactions.
 */
@injectable()
export class FormHandler {
  constructor(@inject(FormWorkflow) private readonly workflow: FormWorkflow) {}

  /**
   * Returns several forms at once.
   */
  batchGetForms = unary<formsFormServiceApi.BatchGetFormsRequest, formsFormServiceApi.BatchGetFormsResponse>(
    (request) => this.workflow.batchGetForms(request),
  );

  /**
   * Creates a form.
   */
  cloneForm = unary<formsFormServiceApi.CloneFormRequest, formsFormServiceApi.CloneFormResponse>(
    (request) => this.workflow.cloneForm(request),
  );

  /**
   * Creates a form.
   */
  createForm = (call: ServerUnaryCall<formsFormServiceApi.CreateFormRequest, formsFormServiceApi.CreateFormResponse>, done: sendUnaryData<formsFormServiceApi.CreateFormResponse>): void => {
    void this.workflow.createForm(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Deletes a form.
   */
  deleteForm = unary<formsFormServiceApi.DeleteFormRequest, formsFormServiceApi.DeleteFormResponse>(
    (request) => this.workflow.deleteForm(request),
  );

  /**
   * Returns a form.
   */
  getForm = unary<formsFormServiceApi.GetFormRequest, formsFormServiceApi.GetFormResponse>(
    (request) => this.workflow.getForm(request),
  );

  /**
   * Lists forms a page at a time.
   */
  listForms = (call: ServerUnaryCall<formsFormServiceApi.ListFormsRequest, formsFormServiceApi.ListFormsResponse>, done: sendUnaryData<formsFormServiceApi.ListFormsResponse>): void => {
    void this.workflow.listForms(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists forms a page at a time.
   */
  searchForms = unary<formsFormServiceApi.SearchFormsRequest, formsFormServiceApi.SearchFormsResponse>(
    (request) => this.workflow.searchForms(request),
  );

  /**
   * Changes a form.
   */
  updateForm = unary<formsFormServiceApi.UpdateFormRequest, formsFormServiceApi.UpdateFormResponse>(
    (request) => this.workflow.updateForm(request),
  );
}

export function implementation(handler: FormHandler): formsFormServiceApi.FormServiceServer {
  return {
    batchGetForms: handler.batchGetForms,
    cloneForm: handler.cloneForm,
    createForm: handler.createForm,
    deleteForm: handler.deleteForm,
    getForm: handler.getForm,
    listForms: handler.listForms,
    searchForms: handler.searchForms,
    updateForm: handler.updateForm,
  };
}
