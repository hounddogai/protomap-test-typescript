/**
 * Tells the people who follow a widget layout what changed. Remote work stays behind typed client ports.
 */

import * as admissionsAdmissionQueryServiceApi from "../../../../.cache/proto/acme/admissions/v1/admission_query_service.js";
import * as documentsDocumentValidationServiceApi from "../../../../.cache/proto/acme/documents/v1/document_validation_service.js";
import * as formsFormFieldApprovalServiceApi from "../../../../.cache/proto/acme/forms/v1/form_field_approval_service.js";
import * as mediaMediaAssetServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_service.js";
import * as messagingParticipantReportingServiceApi from "../../../../.cache/proto/acme/messaging/v1/participant_reporting_service.js";
import * as notificationsDeliveryAttemptCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_calculation_service.js";
import * as surveysSurveyWorkflowServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_workflow_service.js";
import * as webbffClientSessionIntegrationServiceApi from "../../../../.cache/proto/acme/webbff/v1/client_session_integration_service.js";
import * as webbffPageCompositionNotificationServiceApi from "../../../../.cache/proto/acme/webbff/v1/page_composition_notification_service.js";
import * as webbffWidgetLayoutNotificationServiceApi from "../../../../.cache/proto/acme/webbff/v1/widget_layout_notification_service.js";
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
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect, upload } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { WebbffRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate widget layout operations and persist audit data.
 */
@injectable()
export class WidgetLayoutNotificationWorkflow {
  constructor(
    @inject(WebbffRepository) private readonly repository: WebbffRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.admissions.v1.AdmissionQueryService") private readonly admissionsAdmissionQueryClient: admissionsAdmissionQueryServiceApi.AdmissionQueryServiceClient,
    @inject("grpc:acme.documents.v1.DocumentValidationService") private readonly documentsDocumentValidationClient: documentsDocumentValidationServiceApi.DocumentValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormFieldApprovalService") private readonly formsFormFieldApprovalClient: formsFormFieldApprovalServiceApi.FormFieldApprovalServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetService") private readonly mediaMediaAssetClient: mediaMediaAssetServiceApi.MediaAssetServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantReportingService") private readonly messagingParticipantReportingClient: messagingParticipantReportingServiceApi.ParticipantReportingServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptCalculationService") private readonly notificationsDeliveryAttemptCalculationClient: notificationsDeliveryAttemptCalculationServiceApi.DeliveryAttemptCalculationServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyWorkflowService") private readonly surveysSurveyWorkflowClient: surveysSurveyWorkflowServiceApi.SurveyWorkflowServiceClient,
    @inject("grpc:acme.webbff.v1.ClientSessionIntegrationService") private readonly webbffClientSessionIntegrationClient: webbffClientSessionIntegrationServiceApi.ClientSessionIntegrationServiceClient,
    @inject("grpc:acme.webbff.v1.PageCompositionNotificationService") private readonly webbffPageCompositionNotificationClient: webbffPageCompositionNotificationServiceApi.PageCompositionNotificationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Returns a widget layout.
   */
  async getWidgetLayoutPreferences(req: webbffWidgetLayoutNotificationServiceApi.GetWidgetLayoutPreferencesRequest): Promise<webbffWidgetLayoutNotificationServiceApi.GetWidgetLayoutPreferencesResponse> {
    validateContext(req.context);
    if (!req.widgetLayoutId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "widget_layout_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetWidgetLayoutPreferences", req);
    this.logger.info("get_widget_layout_preferences", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyWorkflowServiceApi.StartSurveyWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: { email: (req?.context?.actor?.email ?? "") },
        parameters: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      },
      survey: { audit: { updatedAt: req?.context?.deadline } },
    });
    const method1 = "startSurveyWorkflow" as const;
    const invoke1: Unary<surveysSurveyWorkflowServiceApi.StartSurveyWorkflowRequest, surveysSurveyWorkflowServiceApi.StartSurveyWorkflowResponse> =
      (input, done) => this.surveysSurveyWorkflowClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysSurveyWorkflowServiceApi.StartSurveyWorkflowRequest, surveysSurveyWorkflowServiceApi.StartSurveyWorkflowResponse>(invoke1, request1);
    return mergeResponses(
      webbffWidgetLayoutNotificationServiceApi.GetWidgetLayoutPreferencesResponse.fromPartial({
        widgetLayout: {
          children: [{
            children: [{ location: { region: (reply1?.survey?.billingAddress?.region ?? "") } }],
            location: { lines: (reply1?.survey?.billingAddress?.lines ?? []) },
          }],
        },
      }),
      webbffWidgetLayoutNotificationServiceApi.GetWidgetLayoutPreferencesResponse.fromPartial({ widgetLayout: { widgetLayoutId: (req?.widgetLayoutId ?? "") } }),
    );
  }

  /**
   * Lists widget layouts a page at a time.
   */
  async listWidgetLayoutSubscriptions(req: webbffWidgetLayoutNotificationServiceApi.ListWidgetLayoutSubscriptionsRequest): Promise<webbffWidgetLayoutNotificationServiceApi.ListWidgetLayoutSubscriptionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListWidgetLayoutSubscriptions", req);
    this.logger.info("list_widget_layout_subscriptions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      context: req?.context,
      details: {
        recipient: { email: (req?.context?.actor?.email ?? "") },
        variables: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
    });
    const proxy1 = forwarding(this.webbffPageCompositionNotificationClient);
    const invoke1: Unary<webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesRequest, webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesResponse> =
      (input, done) => proxy1.unsubscribePageCompositionUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesRequest, webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webbffWidgetLayoutNotificationServiceApi.ListWidgetLayoutSubscriptionsResponse.fromPartial({
      widgetLayouts: [{
        children: [{
          children: [{
            children: [{
              widgetLayoutId: (reply1?.pageComposition?.counterparty?.widgetLayoutId ?? ""),
            }],
          }],
        }],
      }],
    });
  }

  /**
   * Notifys a widget layout.
   */
  async notifyWidgetLayoutWatchers(req: webbffWidgetLayoutNotificationServiceApi.NotifyWidgetLayoutWatchersRequest): Promise<webbffWidgetLayoutNotificationServiceApi.NotifyWidgetLayoutWatchersResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "NotifyWidgetLayoutWatchers", req);
    this.logger.info("notify_widget_layout_watchers", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffPageCompositionNotificationServiceApi.ListPageCompositionSubscriptionsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.details?.templateId ?? ""),
      },
    });
    const invoke1: Unary<webbffPageCompositionNotificationServiceApi.ListPageCompositionSubscriptionsRequest, webbffPageCompositionNotificationServiceApi.ListPageCompositionSubscriptionsResponse> =
      (input, done) => this.webbffPageCompositionNotificationClient.listPageCompositionSubscriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webbffPageCompositionNotificationServiceApi.ListPageCompositionSubscriptionsRequest, webbffPageCompositionNotificationServiceApi.ListPageCompositionSubscriptionsResponse>(invoke1, request1);
    const request2 = webbffPageCompositionNotificationServiceApi.StreamPageCompositionNoticesRequest.fromPartial({
      context: req?.context,
      subscriber: {
        name: req?.details?.recipient?.name,
        preferredChannel: (req?.details?.recipient?.preferredChannel ?? ""),
      },
    });
    const stream2 = this.webbffPageCompositionNotificationClient.streamPageCompositionNotices(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? webbffPageCompositionNotificationServiceApi.StreamPageCompositionNoticesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webbffWidgetLayoutNotificationServiceApi.NotifyWidgetLayoutWatchersResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      webbffWidgetLayoutNotificationServiceApi.NotifyWidgetLayoutWatchersResponse.fromPartial({
        widgetLayout: {
          manager: { email: (req?.details?.recipient?.email ?? "") },
          widgetLayoutId: (req?.widgetLayoutId ?? ""),
        },
      }),
    );
  }

  /**
   * Sends a widget layout.
   */
  async sendWidgetLayoutTestNotice(req: webbffWidgetLayoutNotificationServiceApi.SendWidgetLayoutTestNoticeRequest): Promise<webbffWidgetLayoutNotificationServiceApi.SendWidgetLayoutTestNoticeResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SendWidgetLayoutTestNotice", req);
    this.logger.info("send_widget_layout_test_notice", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = admissionsAdmissionQueryServiceApi.CountAdmissionsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.details?.variables ?? {}))),
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<admissionsAdmissionQueryServiceApi.CountAdmissionsRequest, admissionsAdmissionQueryServiceApi.CountAdmissionsResponse> =
      (input, done) => this.admissionsAdmissionQueryClient.countAdmissions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<admissionsAdmissionQueryServiceApi.CountAdmissionsRequest, admissionsAdmissionQueryServiceApi.CountAdmissionsResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersRequest.fromPartial({
      context: input2?.context,
      details: { recipient: { phone: (input2?.details?.recipient?.phone ?? "") } },
    });
    const invoke2: Unary<webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersRequest, webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersResponse> =
      (input, done) => this.webbffPageCompositionNotificationClient.notifyPageCompositionWatchers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersRequest, webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersResponse>(invoke2, request2);
    let selected3_2: string | undefined;
    switch (reply2?.pageComposition?.settlement?.$case) {
      case "card":
        selected3_2 = ((reply2?.pageComposition?.settlement?.$case === "card" ? reply2?.pageComposition?.settlement.card : undefined)?.network ?? "");
        break;
      default:
        selected3_2 = "";
    }
    const request3 = documentsDocumentValidationServiceApi.ValidateDocumentRequest.fromPartial({
      context: req?.context,
      document: {
        billingAddress: {
          postalCode: (reply2?.pageComposition?.billingAddress?.postalCode ?? ""),
        },
        settlement: { $case: "card", card: { network: (selected3_2 ?? "") } },
      },
    });
    const invoke3: Unary<documentsDocumentValidationServiceApi.ValidateDocumentRequest, documentsDocumentValidationServiceApi.ValidateDocumentResponse> =
      (input, done) => this.documentsDocumentValidationClient.validateDocument(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<documentsDocumentValidationServiceApi.ValidateDocumentRequest, documentsDocumentValidationServiceApi.ValidateDocumentResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webbffWidgetLayoutNotificationServiceApi.SendWidgetLayoutTestNoticeResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      webbffWidgetLayoutNotificationServiceApi.SendWidgetLayoutTestNoticeResponse.fromPartial({
        widgetLayout: {
          children: [{
            children: [{
              audit: { updatedBy: (reply2?.pageComposition?.audit?.updatedBy ?? "") },
            }],
          }],
        },
      }),
      webbffWidgetLayoutNotificationServiceApi.SendWidgetLayoutTestNoticeResponse.fromPartial({
        result: { details: (reply3?.result?.details ?? {}) },
        widgetLayout: {
          location: { postalCode: (reply3?.document?.billingAddress?.postalCode ?? "") },
        },
      }),
      webbffWidgetLayoutNotificationServiceApi.SendWidgetLayoutTestNoticeResponse.fromPartial({
        widgetLayout: {
          manager: { email: (req?.details?.recipient?.email ?? "") },
          widgetLayoutId: (req?.widgetLayoutId ?? ""),
        },
      }),
    );
  }

  /**
   * Subscribes a widget layout.
   */
  async subscribeWidgetLayoutUpdates(req: webbffWidgetLayoutNotificationServiceApi.SubscribeWidgetLayoutUpdatesRequest): Promise<webbffWidgetLayoutNotificationServiceApi.SubscribeWidgetLayoutUpdatesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SubscribeWidgetLayoutUpdates", req);
    this.logger.info("subscribe_widget_layout_updates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffPageCompositionNotificationServiceApi.ListPageCompositionSubscriptionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.widgetLayoutId ?? ""),
      },
    });
    const decoded1 = webbffPageCompositionNotificationServiceApi.ListPageCompositionSubscriptionsRequest.fromJSON(
      JSON.parse(JSON.stringify(webbffPageCompositionNotificationServiceApi.ListPageCompositionSubscriptionsRequest.toJSON(request1))),
    );
    const invoke1: Unary<webbffPageCompositionNotificationServiceApi.ListPageCompositionSubscriptionsRequest, webbffPageCompositionNotificationServiceApi.ListPageCompositionSubscriptionsResponse> =
      (input, done) => this.webbffPageCompositionNotificationClient.listPageCompositionSubscriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webbffPageCompositionNotificationServiceApi.ListPageCompositionSubscriptionsRequest, webbffPageCompositionNotificationServiceApi.ListPageCompositionSubscriptionsResponse>(invoke1, decoded1);
    const request2 = formsFormFieldApprovalServiceApi.DelegateFormFieldApprovalRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { approver: { email: (req?.context?.actor?.email ?? "") } },
      formField: {
        action: { $case: "block", block: { reason: (req?.reason ?? "") } },
        owner: { email: (req?.details?.recipient?.email ?? "") },
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.forms.v1.DelegateFormFieldApprovalRequest",
      value: Buffer.from(formsFormFieldApprovalServiceApi.DelegateFormFieldApprovalRequest.encode(request2).finish()),
    });
    const unpacked2 = formsFormFieldApprovalServiceApi.DelegateFormFieldApprovalRequest.decode(envelope2.value);
    const invoke2: Unary<formsFormFieldApprovalServiceApi.DelegateFormFieldApprovalRequest, formsFormFieldApprovalServiceApi.DelegateFormFieldApprovalResponse> =
      (input, done) => this.formsFormFieldApprovalClient.delegateFormFieldApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormFieldApprovalServiceApi.DelegateFormFieldApprovalRequest, formsFormFieldApprovalServiceApi.DelegateFormFieldApprovalResponse>(invoke2, unpacked2);
    let selected3_1: string | undefined;
    switch (reply2?.formField?.action?.$case) {
      case "block":
        selected3_1 = ((reply2?.formField?.action?.$case === "block" ? reply2?.formField?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected3_1 = "";
    }
    const request3 = messagingParticipantReportingServiceApi.GenerateParticipantReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      participantId: (reply2?.formField?.owner?.userId ?? ""),
      reason: (selected3_1 ?? ""),
    });
    const invoke3: Unary<messagingParticipantReportingServiceApi.GenerateParticipantReportRequest, messagingParticipantReportingServiceApi.GenerateParticipantReportResponse> =
      (input, done) => this.messagingParticipantReportingClient.generateParticipantReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<messagingParticipantReportingServiceApi.GenerateParticipantReportRequest, messagingParticipantReportingServiceApi.GenerateParticipantReportResponse>(invoke3, request3);
    const request4 = webbffPageCompositionNotificationServiceApi.SendPageCompositionTestNoticeRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: { preferredChannel: (req?.details?.recipient?.preferredChannel ?? "") },
      },
    });
    const invoke4: Unary<webbffPageCompositionNotificationServiceApi.SendPageCompositionTestNoticeRequest, webbffPageCompositionNotificationServiceApi.SendPageCompositionTestNoticeResponse> =
      (input, done) => this.webbffPageCompositionNotificationClient.sendPageCompositionTestNotice(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port4: RequestPort<webbffPageCompositionNotificationServiceApi.SendPageCompositionTestNoticeRequest, webbffPageCompositionNotificationServiceApi.SendPageCompositionTestNoticeResponse> = new GrpcAdapter(invoke4);
    const reply4 = await port4.execute(request4);
    this.logger.info("local_audit", { value: (req?.details?.channel ?? "") });
    return mergeResponses(
      webbffWidgetLayoutNotificationServiceApi.SubscribeWidgetLayoutUpdatesResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      webbffWidgetLayoutNotificationServiceApi.SubscribeWidgetLayoutUpdatesResponse.fromPartial({ result: { status: (reply2?.outcome?.status ?? "") } }),
      webbffWidgetLayoutNotificationServiceApi.SubscribeWidgetLayoutUpdatesResponse.fromPartial({
        outcome: { message: (reply3?.result?.message ?? "") },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      webbffWidgetLayoutNotificationServiceApi.SubscribeWidgetLayoutUpdatesResponse.fromPartial({
        widgetLayout: {
          children: [{
            audit: { createdAt: reply4?.pageComposition?.audit?.createdAt },
            widgetLayoutId: (reply4?.pageComposition?.counterparty?.widgetLayoutId ?? ""),
          }],
        },
      }),
      webbffWidgetLayoutNotificationServiceApi.SubscribeWidgetLayoutUpdatesResponse.fromPartial({
        widgetLayout: {
          manager: { email: (req?.details?.recipient?.email ?? "") },
          widgetLayoutId: (req?.widgetLayoutId ?? ""),
        },
      }),
    );
  }

  /**
   * Unsubscribes a widget layout.
   */
  async unsubscribeWidgetLayoutUpdates(req: webbffWidgetLayoutNotificationServiceApi.UnsubscribeWidgetLayoutUpdatesRequest): Promise<webbffWidgetLayoutNotificationServiceApi.UnsubscribeWidgetLayoutUpdatesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "UnsubscribeWidgetLayoutUpdates", req);
    this.logger.info("unsubscribe_widget_layout_updates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.details?.variables ?? {}))),
        ownerId: (req?.details?.templateId ?? ""),
      },
    });
    const invoke1: Unary<webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesRequest, webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesResponse> =
      (input, done) => this.webbffClientSessionIntegrationClient.listClientSessionSources(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesRequest, webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesResponse>(invoke1, request1));
    const request2 = notificationsDeliveryAttemptCalculationServiceApi.QuoteDeliveryAttemptRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
    });
    const invoke2: Unary<notificationsDeliveryAttemptCalculationServiceApi.QuoteDeliveryAttemptRequest, notificationsDeliveryAttemptCalculationServiceApi.QuoteDeliveryAttemptResponse> =
      (input, done) => this.notificationsDeliveryAttemptCalculationClient.quoteDeliveryAttempt(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("UnsubscribeWidgetLayoutUpdates.QuoteDeliveryAttempt", () => call<notificationsDeliveryAttemptCalculationServiceApi.QuoteDeliveryAttemptRequest, notificationsDeliveryAttemptCalculationServiceApi.QuoteDeliveryAttemptResponse>(invoke2, request2));
    const request3 = mediaMediaAssetServiceApi.BatchCreateMediaAssetsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.context?.actor?.userId ?? ""),
        submittedBy: req?.details?.recipient,
      } },
    });
    const reply3 = await upload<mediaMediaAssetServiceApi.BatchCreateMediaAssetsRequest, mediaMediaAssetServiceApi.BatchCreateMediaAssetsResponse>(
      (done) => this.mediaMediaAssetClient.batchCreateMediaAssets(metadataFor(request3.context), { deadline: Date.now() + 15_000 }, done), [request3],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webbffWidgetLayoutNotificationServiceApi.UnsubscribeWidgetLayoutUpdatesResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      webbffWidgetLayoutNotificationServiceApi.UnsubscribeWidgetLayoutUpdatesResponse.fromPartial({
        result: { status: (reply2?.result?.status ?? "") },
        widgetLayout: { attributes: (reply2?.deliveryAttempt?.attributes ?? {}) },
      }),
      webbffWidgetLayoutNotificationServiceApi.UnsubscribeWidgetLayoutUpdatesResponse.fromPartial({
        widgetLayout: {
          manager: { email: (req?.details?.recipient?.email ?? "") },
          widgetLayoutId: (req?.widgetLayoutId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for WidgetLayoutNotificationService; workflows own validation and database transactions.
 */
@injectable()
export class WidgetLayoutNotificationHandler {
  constructor(@inject(WidgetLayoutNotificationWorkflow) private readonly workflow: WidgetLayoutNotificationWorkflow) {}

  /**
   * Returns a widget layout.
   */
  getWidgetLayoutPreferences = unary<webbffWidgetLayoutNotificationServiceApi.GetWidgetLayoutPreferencesRequest, webbffWidgetLayoutNotificationServiceApi.GetWidgetLayoutPreferencesResponse>(
    (request) => this.workflow.getWidgetLayoutPreferences(request),
  );

  /**
   * Lists widget layouts a page at a time.
   */
  listWidgetLayoutSubscriptions = unary<webbffWidgetLayoutNotificationServiceApi.ListWidgetLayoutSubscriptionsRequest, webbffWidgetLayoutNotificationServiceApi.ListWidgetLayoutSubscriptionsResponse>(
    (request) => this.workflow.listWidgetLayoutSubscriptions(request),
  );

  /**
   * Notifys a widget layout.
   */
  notifyWidgetLayoutWatchers = (call: ServerUnaryCall<webbffWidgetLayoutNotificationServiceApi.NotifyWidgetLayoutWatchersRequest, webbffWidgetLayoutNotificationServiceApi.NotifyWidgetLayoutWatchersResponse>, done: sendUnaryData<webbffWidgetLayoutNotificationServiceApi.NotifyWidgetLayoutWatchersResponse>): void => {
    void this.workflow.notifyWidgetLayoutWatchers(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Sends a widget layout.
   */
  sendWidgetLayoutTestNotice = unary<webbffWidgetLayoutNotificationServiceApi.SendWidgetLayoutTestNoticeRequest, webbffWidgetLayoutNotificationServiceApi.SendWidgetLayoutTestNoticeResponse>(
    (request) => this.workflow.sendWidgetLayoutTestNotice(request),
  );

  /**
   * Subscribes a widget layout.
   */
  subscribeWidgetLayoutUpdates = unary<webbffWidgetLayoutNotificationServiceApi.SubscribeWidgetLayoutUpdatesRequest, webbffWidgetLayoutNotificationServiceApi.SubscribeWidgetLayoutUpdatesResponse>(
    (request) => this.workflow.subscribeWidgetLayoutUpdates(request),
  );

  /**
   * Unsubscribes a widget layout.
   */
  unsubscribeWidgetLayoutUpdates = (call: ServerUnaryCall<webbffWidgetLayoutNotificationServiceApi.UnsubscribeWidgetLayoutUpdatesRequest, webbffWidgetLayoutNotificationServiceApi.UnsubscribeWidgetLayoutUpdatesResponse>, done: sendUnaryData<webbffWidgetLayoutNotificationServiceApi.UnsubscribeWidgetLayoutUpdatesResponse>): void => {
    void this.workflow.unsubscribeWidgetLayoutUpdates(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: WidgetLayoutNotificationHandler): webbffWidgetLayoutNotificationServiceApi.WidgetLayoutNotificationServiceServer {
  return {
    getWidgetLayoutPreferences: handler.getWidgetLayoutPreferences,
    listWidgetLayoutSubscriptions: handler.listWidgetLayoutSubscriptions,
    notifyWidgetLayoutWatchers: handler.notifyWidgetLayoutWatchers,
    sendWidgetLayoutTestNotice: handler.sendWidgetLayoutTestNotice,
    subscribeWidgetLayoutUpdates: handler.subscribeWidgetLayoutUpdates,
    unsubscribeWidgetLayoutUpdates: handler.unsubscribeWidgetLayoutUpdates,
  };
}
