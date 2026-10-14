/**
 * Tells the people who follow a page composition what changed. Remote work stays behind typed client ports.
 */

import * as authorizationAccessPolicyQueryServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_query_service.js";
import * as datahubWorkspaceQueryServiceApi from "../../../../.cache/proto/acme/datahub/v1/workspace_query_service.js";
import * as formsFormFieldApprovalServiceApi from "../../../../.cache/proto/acme/forms/v1/form_field_approval_service.js";
import * as notificationsNotificationTemplateValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_validation_service.js";
import * as surveysSurveyResponseWorkflowServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_response_workflow_service.js";
import * as venuesVenueQueryServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_query_service.js";
import * as venuesVenueValidationServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_validation_service.js";
import * as webbffPageCompositionNotificationServiceApi from "../../../../.cache/proto/acme/webbff/v1/page_composition_notification_service.js";
import * as webbffWidgetLayoutIntegrationServiceApi from "../../../../.cache/proto/acme/webbff/v1/widget_layout_integration_service.js";
import * as webhooksWebhookEndpointWorkflowServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_workflow_service.js";
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
import { WebbffRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate page composition operations and persist audit data.
 */
@injectable()
export class PageCompositionNotificationWorkflow {
  constructor(
    @inject(WebbffRepository) private readonly repository: WebbffRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyQueryService") private readonly authorizationAccessPolicyQueryClient: authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient,
    @inject("grpc:acme.datahub.v1.WorkspaceQueryService") private readonly datahubWorkspaceQueryClient: datahubWorkspaceQueryServiceApi.WorkspaceQueryServiceClient,
    @inject("grpc:acme.forms.v1.FormFieldApprovalService") private readonly formsFormFieldApprovalClient: formsFormFieldApprovalServiceApi.FormFieldApprovalServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateValidationService") private readonly notificationsNotificationTemplateValidationClient: notificationsNotificationTemplateValidationServiceApi.NotificationTemplateValidationServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseWorkflowService") private readonly surveysSurveyResponseWorkflowClient: surveysSurveyResponseWorkflowServiceApi.SurveyResponseWorkflowServiceClient,
    @inject("grpc:acme.venues.v1.VenueQueryService") private readonly venuesVenueQueryClient: venuesVenueQueryServiceApi.VenueQueryServiceClient,
    @inject("grpc:acme.venues.v1.VenueValidationService") private readonly venuesVenueValidationClient: venuesVenueValidationServiceApi.VenueValidationServiceClient,
    @inject("grpc:acme.webbff.v1.WidgetLayoutIntegrationService") private readonly webbffWidgetLayoutIntegrationClient: webbffWidgetLayoutIntegrationServiceApi.WidgetLayoutIntegrationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointWorkflowService") private readonly webhooksWebhookEndpointWorkflowClient: webhooksWebhookEndpointWorkflowServiceApi.WebhookEndpointWorkflowServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Returns a page composition.
   */
  async getPageCompositionPreferences(req: webbffPageCompositionNotificationServiceApi.GetPageCompositionPreferencesRequest): Promise<webbffPageCompositionNotificationServiceApi.GetPageCompositionPreferencesResponse> {
    validateContext(req.context);
    if (!req.pageCompositionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_composition_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetPageCompositionPreferences", req);
    this.logger.info("get_page_composition_preferences", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = venuesVenueQueryServiceApi.SummarizeVenuesRequest.fromPartial({
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      },
    });
    const decoded1 = venuesVenueQueryServiceApi.SummarizeVenuesRequest.fromJSON(
      JSON.parse(JSON.stringify(venuesVenueQueryServiceApi.SummarizeVenuesRequest.toJSON(request1))),
    );
    const invoke1: Unary<venuesVenueQueryServiceApi.SummarizeVenuesRequest, venuesVenueQueryServiceApi.SummarizeVenuesResponse> =
      (input, done) => this.venuesVenueQueryClient.summarizeVenues(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<venuesVenueQueryServiceApi.SummarizeVenuesRequest, venuesVenueQueryServiceApi.SummarizeVenuesResponse>(invoke1, decoded1);
    return mergeResponses(
      webbffPageCompositionNotificationServiceApi.GetPageCompositionPreferencesResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      webbffPageCompositionNotificationServiceApi.GetPageCompositionPreferencesResponse.fromPartial({
        pageComposition: { pageCompositionId: (req?.pageCompositionId ?? "") },
      }),
    );
  }

  /**
   * Lists page compositions a page at a time.
   */
  async listPageCompositionSubscriptions(req: webbffPageCompositionNotificationServiceApi.ListPageCompositionSubscriptionsRequest): Promise<webbffPageCompositionNotificationServiceApi.ListPageCompositionSubscriptionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPageCompositionSubscriptions", req);
    this.logger.info("list_page_composition_subscriptions", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webbffPageCompositionNotificationServiceApi.ListPageCompositionSubscriptionsResponse.fromPartial({});
  }

  /**
   * Notifys a page composition.
   */
  async notifyPageCompositionWatchers(req: webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersRequest): Promise<webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "NotifyPageCompositionWatchers", req);
    this.logger.info("notify_page_composition_watchers", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffWidgetLayoutIntegrationServiceApi.ConnectWidgetLayoutSourceRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.webbff.v1.ConnectWidgetLayoutSourceRequest",
      value: Buffer.from(webbffWidgetLayoutIntegrationServiceApi.ConnectWidgetLayoutSourceRequest.encode(request1).finish()),
    });
    const unpacked1 = webbffWidgetLayoutIntegrationServiceApi.ConnectWidgetLayoutSourceRequest.decode(envelope1.value);
    const invoke1: Unary<webbffWidgetLayoutIntegrationServiceApi.ConnectWidgetLayoutSourceRequest, webbffWidgetLayoutIntegrationServiceApi.ConnectWidgetLayoutSourceResponse> =
      (input, done) => this.webbffWidgetLayoutIntegrationClient.connectWidgetLayoutSource(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webbffWidgetLayoutIntegrationServiceApi.ConnectWidgetLayoutSourceRequest, webbffWidgetLayoutIntegrationServiceApi.ConnectWidgetLayoutSourceResponse>(invoke1, unpacked1);
    const request2 = authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply1?.widgetLayout?.location?.region ?? "") },
    });
    const client2 = this.clients.get<authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient>("acme.authorization.v1.AccessPolicyQueryService");
    const invoke2: Unary<authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesResponse> =
      (input, done) => client2.findAccessPolicies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesResponse>(invoke2, request2);
    const request3 = webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest.fromPartial({
      context: req?.context,
      widgetLayoutId: (reply1?.widgetLayout?.widgetLayoutId ?? ""),
    });
    const invoke3: Unary<webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest, webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventResponse> =
      (input, done) => this.webbffWidgetLayoutIntegrationClient.acknowledgeWidgetLayoutEvent(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port3: RequestPort<webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest, webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventResponse> = new GrpcAdapter(invoke3);
    const reply3 = await port3.execute(request3);
    this.logger.info("local_audit", { value: (req?.details?.channel ?? "") });
    return mergeResponses(
      webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersResponse.fromPartial({ outcome: { message: (reply1?.outcome?.message ?? "") } }),
      webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersResponse.fromPartial({
        pageComposition: {
          counterparty: { widgetLayoutId: (reply3?.widgetLayout?.widgetLayoutId ?? "") },
        },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersResponse.fromPartial({
        pageComposition: { pageCompositionId: (req?.pageCompositionId ?? "") },
      }),
    );
  }

  /**
   * Sends a page composition.
   */
  async sendPageCompositionTestNotice(req: webbffPageCompositionNotificationServiceApi.SendPageCompositionTestNoticeRequest): Promise<webbffPageCompositionNotificationServiceApi.SendPageCompositionTestNoticeResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SendPageCompositionTestNotice", req);
    this.logger.info("send_page_composition_test_notice", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { messageId: (req?.details?.templateId ?? "") },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionRequest, webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionResponse> =
      (input, done) => this.webbffWidgetLayoutIntegrationClient.testWidgetLayoutConnection(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionRequest, webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionResponse>(invoke1, request1));
    const request2 = webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke2: Unary<webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest, webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventResponse> =
      (input, done) => this.webbffWidgetLayoutIntegrationClient.acknowledgeWidgetLayoutEvent(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("SendPageCompositionTestNotice.AcknowledgeWidgetLayoutEvent", () => call<webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest, webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventResponse>(invoke2, request2));
    const request3 = webbffWidgetLayoutIntegrationServiceApi.ConnectWidgetLayoutSourceRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      widgetLayoutId: (reply1?.widgetLayout?.widgetLayoutId ?? ""),
    });
    const invoke3: Unary<webbffWidgetLayoutIntegrationServiceApi.ConnectWidgetLayoutSourceRequest, webbffWidgetLayoutIntegrationServiceApi.ConnectWidgetLayoutSourceResponse> =
      (input, done) => this.webbffWidgetLayoutIntegrationClient.connectWidgetLayoutSource(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    this.logger.info("local_audit", { value: (req?.details?.channel ?? "") });
    return mergeResponses(
      webbffPageCompositionNotificationServiceApi.SendPageCompositionTestNoticeResponse.fromPartial({
        pageComposition: {
          counterparty: { displayName: (reply1?.widgetLayout?.manager?.displayName ?? "") },
        },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      webbffPageCompositionNotificationServiceApi.SendPageCompositionTestNoticeResponse.fromPartial({
        pageComposition: {
          billingAddress: { region: (reply2?.widgetLayout?.location?.region ?? "") },
        },
      }),
      webbffPageCompositionNotificationServiceApi.SendPageCompositionTestNoticeResponse.fromPartial({
        outcome: { referenceId: (reply3?.outcome?.referenceId ?? "") },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      webbffPageCompositionNotificationServiceApi.SendPageCompositionTestNoticeResponse.fromPartial({
        pageComposition: { pageCompositionId: (req?.pageCompositionId ?? "") },
      }),
    );
  }

  /**
   * Streams the changes of page compositions as they happen.
   */
  async streamPageCompositionNotices(req: webbffPageCompositionNotificationServiceApi.StreamPageCompositionNoticesRequest): Promise<webbffPageCompositionNotificationServiceApi.StreamPageCompositionNoticesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamPageCompositionNotices", req);
    this.logger.info("stream_page_composition_notices", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      context: req?.context,
      details: {
        messageId: (req?.filter?.ownerId ?? ""),
        receivedAt: req?.filter?.createdAfter,
      },
    });
    const reply1 = await this.workQueue.enqueue<webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest, webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventResponse>(
      "acme.webbff.v1.PageCompositionNotificationService/StreamPageCompositionNotices:0", request1,
    );
    const request2 = venuesVenueValidationServiceApi.ExplainVenueDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (reply1?.widgetLayout?.manager?.email ?? "") } },
    });
    const invoke2: Unary<venuesVenueValidationServiceApi.ExplainVenueDecisionRequest, venuesVenueValidationServiceApi.ExplainVenueDecisionResponse> =
      (input, done) => this.venuesVenueValidationClient.explainVenueDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<venuesVenueValidationServiceApi.ExplainVenueDecisionRequest, venuesVenueValidationServiceApi.ExplainVenueDecisionResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.subscriber?.preferredChannel ?? "") });
    return mergeResponses(
      webbffPageCompositionNotificationServiceApi.StreamPageCompositionNoticesResponse.fromPartial({
        pageComposition: {
          billingAddress: { lines: (reply1?.widgetLayout?.location?.lines ?? []) },
        },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      webbffPageCompositionNotificationServiceApi.StreamPageCompositionNoticesResponse.fromPartial({
        pageComposition: { audit: { updatedAt: reply2?.venue?.audit?.updatedAt } },
      }),
      webbffPageCompositionNotificationServiceApi.StreamPageCompositionNoticesResponse.fromPartial({
        pageComposition: { billingAddress: { region: (req?.filter?.region ?? "") } },
      }),
    );
  }

  /**
   * Subscribes a page composition.
   */
  async subscribePageCompositionUpdates(req: webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesRequest): Promise<webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SubscribePageCompositionUpdates", req);
    this.logger.info("subscribe_page_composition_updates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateValidationServiceApi.CheckNotificationTemplateEligibilityRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.recipient?.email ?? ""),
          phone: (req?.details?.recipient?.phone ?? ""),
        },
      },
    });
    const invoke1: Unary<notificationsNotificationTemplateValidationServiceApi.CheckNotificationTemplateEligibilityRequest, notificationsNotificationTemplateValidationServiceApi.CheckNotificationTemplateEligibilityResponse> =
      (input, done) => this.notificationsNotificationTemplateValidationClient.checkNotificationTemplateEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<notificationsNotificationTemplateValidationServiceApi.CheckNotificationTemplateEligibilityResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = datahubWorkspaceQueryServiceApi.CountWorkspacesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.notificationTemplate?.dueAt,
        region: (reply1?.notificationTemplate?.billingAddress?.region ?? ""),
      },
    });
    const invoke2: Unary<datahubWorkspaceQueryServiceApi.CountWorkspacesRequest, datahubWorkspaceQueryServiceApi.CountWorkspacesResponse> =
      (input, done) => this.datahubWorkspaceQueryClient.countWorkspaces(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = surveysSurveyResponseWorkflowServiceApi.ListSurveyResponseWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply1?.notificationTemplate?.billingAddress?.region ?? "") },
    });
    const invoke3: Unary<surveysSurveyResponseWorkflowServiceApi.ListSurveyResponseWorkflowsRequest, surveysSurveyResponseWorkflowServiceApi.ListSurveyResponseWorkflowsResponse> =
      (input, done) => this.surveysSurveyResponseWorkflowClient.listSurveyResponseWorkflows(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke3 = promisify(invoke3);
    const reply3 = requireReply(await asyncInvoke3(request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesResponse.fromPartial({
        outcome: { status: (reply1?.outcome?.status ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesResponse.fromPartial({
        pageComposition: { pageCompositionId: (req?.pageCompositionId ?? "") },
      }),
    );
  }

  /**
   * Unsubscribes a page composition.
   */
  async unsubscribePageCompositionUpdates(req: webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesRequest): Promise<webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "UnsubscribePageCompositionUpdates", req);
    this.logger.info("unsubscribe_page_composition_updates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookEndpointWorkflowServiceApi.StartWebhookEndpointWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          email: (req?.details?.recipient?.email ?? ""),
          name: req?.details?.recipient?.name,
          preferredChannel: (req?.details?.recipient?.preferredChannel ?? ""),
        },
      },
      reason: (req?.reason ?? ""),
    });
    const method1 = "startWebhookEndpointWorkflow" as const;
    const invoke1: Unary<webhooksWebhookEndpointWorkflowServiceApi.StartWebhookEndpointWorkflowRequest, webhooksWebhookEndpointWorkflowServiceApi.StartWebhookEndpointWorkflowResponse> =
      (input, done) => this.webhooksWebhookEndpointWorkflowClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookEndpointWorkflowServiceApi.StartWebhookEndpointWorkflowRequest, webhooksWebhookEndpointWorkflowServiceApi.StartWebhookEndpointWorkflowResponse>(invoke1, request1);
    const request2 = formsFormFieldApprovalServiceApi.RejectFormFieldRequest.fromPartial({
      context: req?.context,
      formField: { owner: { userId: (reply1?.webhookEndpoint?.owner?.userId ?? "") } },
    });
    const proxy2 = forwarding(this.formsFormFieldApprovalClient);
    const invoke2: Unary<formsFormFieldApprovalServiceApi.RejectFormFieldRequest, formsFormFieldApprovalServiceApi.RejectFormFieldResponse> =
      (input, done) => proxy2.rejectFormField(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormFieldApprovalServiceApi.RejectFormFieldRequest, formsFormFieldApprovalServiceApi.RejectFormFieldResponse>(invoke2, request2);
    let selected3_1: string | undefined;
    switch (reply2?.formField?.action?.$case) {
      case "block":
        selected3_1 = ((reply2?.formField?.action?.$case === "block" ? reply2?.formField?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected3_1 = "";
    }
    const request3 = webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceRequest.fromPartial({
      context: req?.context,
      reason: (selected3_1 ?? ""),
    });
    const invoke3: Unary<webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceRequest, webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceResponse> =
      (input, done) => this.webbffWidgetLayoutIntegrationClient.disconnectWidgetLayoutSource(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceRequest, webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.details?.channel ?? "") });
    return mergeResponses(
      webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesResponse.fromPartial({
        outcome: { referenceId: (reply1?.outcome?.referenceId ?? "") },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesResponse.fromPartial({ result: { message: (reply2?.outcome?.message ?? "") } }),
      webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesResponse.fromPartial({
        outcome: { message: (reply3?.outcome?.message ?? "") },
        result: { details: (reply3?.result?.details ?? {}) },
      }),
      webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesResponse.fromPartial({
        pageComposition: { pageCompositionId: (req?.pageCompositionId ?? "") },
      }),
    );
  }
}
