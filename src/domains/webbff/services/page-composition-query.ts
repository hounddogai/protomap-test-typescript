/**
 * Answers read-only questions about page compositions, for screens and reports. Remote work stays behind typed client
 * ports.
 */

import * as featureflagsFeatureFlagQueryServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as formsFormSubmissionWorkflowServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_workflow_service.js";
import * as messagingConversationWorkflowServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_workflow_service.js";
import * as notificationsDeliveryAttemptHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_history_service.js";
import * as notificationsNotificationTemplateQueryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_query_service.js";
import * as riskRiskRegisterQueryServiceApi from "../../../../.cache/proto/acme/risk/v1/risk_register_query_service.js";
import * as webbffClientSessionIntegrationServiceApi from "../../../../.cache/proto/acme/webbff/v1/client_session_integration_service.js";
import * as webbffPageCompositionQueryServiceApi from "../../../../.cache/proto/acme/webbff/v1/page_composition_query_service.js";
import * as webbffWidgetLayoutIntegrationServiceApi from "../../../../.cache/proto/acme/webbff/v1/widget_layout_integration_service.js";
import * as webbffWidgetLayoutNotificationServiceApi from "../../../../.cache/proto/acme/webbff/v1/widget_layout_notification_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  metadataFor,
  operation,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { WebbffRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate page composition operations and persist audit data.
 */
@injectable()
export class PageCompositionQueryWorkflow {
  constructor(
    @inject(WebbffRepository) private readonly repository: WebbffRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.featureflags.v1.FeatureFlagQueryService") private readonly featureflagsFeatureFlagQueryClient: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionWorkflowService") private readonly formsFormSubmissionWorkflowClient: formsFormSubmissionWorkflowServiceApi.FormSubmissionWorkflowServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationWorkflowService") private readonly messagingConversationWorkflowClient: messagingConversationWorkflowServiceApi.ConversationWorkflowServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptHistoryService") private readonly notificationsDeliveryAttemptHistoryClient: notificationsDeliveryAttemptHistoryServiceApi.DeliveryAttemptHistoryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateQueryService") private readonly notificationsNotificationTemplateQueryClient: notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceClient,
    @inject("grpc:acme.risk.v1.RiskRegisterQueryService") private readonly riskRiskRegisterQueryClient: riskRiskRegisterQueryServiceApi.RiskRegisterQueryServiceClient,
    @inject("grpc:acme.webbff.v1.ClientSessionIntegrationService") private readonly webbffClientSessionIntegrationClient: webbffClientSessionIntegrationServiceApi.ClientSessionIntegrationServiceClient,
    @inject("grpc:acme.webbff.v1.WidgetLayoutIntegrationService") private readonly webbffWidgetLayoutIntegrationClient: webbffWidgetLayoutIntegrationServiceApi.WidgetLayoutIntegrationServiceClient,
    @inject("grpc:acme.webbff.v1.WidgetLayoutNotificationService") private readonly webbffWidgetLayoutNotificationClient: webbffWidgetLayoutNotificationServiceApi.WidgetLayoutNotificationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists page compositions a page at a time.
   */
  async browsePageCompositions(req: webbffPageCompositionQueryServiceApi.BrowsePageCompositionsRequest): Promise<webbffPageCompositionQueryServiceApi.BrowsePageCompositionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowsePageCompositions", req);
    this.logger.info("browse_page_compositions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceRequest.fromPartial({
      context: req?.context,
      details: { receivedAt: req?.filter?.createdAfter },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceRequest, webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceResponse> =
      (input, done) => this.webbffWidgetLayoutIntegrationClient.disconnectWidgetLayoutSource(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceRequest, webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceResponse>(invoke1, spread1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webbffPageCompositionQueryServiceApi.BrowsePageCompositionsResponse.fromPartial({
      pageCompositions: [{
        billingAddress: { postalCode: (reply1?.widgetLayout?.location?.postalCode ?? "") },
      }],
    });
  }

  /**
   * Counts page compositions by status.
   */
  async countPageCompositions(req: webbffPageCompositionQueryServiceApi.CountPageCompositionsRequest): Promise<webbffPageCompositionQueryServiceApi.CountPageCompositionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountPageCompositions", req);
    this.logger.info("count_page_compositions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((input1?.filter?.labels ?? {}))),
      context: input1?.context,
      details: {
        messageId: (input1?.filter?.ownerId ?? ""),
        receivedAt: input1?.filter?.createdAfter,
      },
    });
    const invoke1: Unary<webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest, webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventResponse> =
      (input, done) => this.webbffWidgetLayoutIntegrationClient.acknowledgeWidgetLayoutEvent(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest, webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webbffPageCompositionQueryServiceApi.CountPageCompositionsResponse.fromPartial({
      result: {
        message: (reply1?.outcome?.message ?? ""),
        status: (reply1?.result?.status ?? ""),
      },
    });
  }

  /**
   * Streams every matching page composition.
   */
  async exportPageCompositions(req: webbffPageCompositionQueryServiceApi.ExportPageCompositionsRequest): Promise<webbffPageCompositionQueryServiceApi.ExportPageCompositionsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportPageCompositions", req);
    this.logger.info("export_page_compositions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        query: (req?.filter?.query ?? ""),
        region: (req?.filter?.region ?? ""),
      },
    });
    const cloned1: webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesRequest, webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesResponse> =
      (input, done) => this.webbffClientSessionIntegrationClient.listClientSessionSources(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesRequest, webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesResponse>(invoke1, cloned1);
    const request2 = notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.filter?.createdAfter },
    });
    const decoded2 = notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesRequest.fromJSON(
      JSON.parse(JSON.stringify(notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesRequest.toJSON(request2))),
    );
    const invoke2: Unary<notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateQueryClient.countNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return mergeResponses(
      webbffPageCompositionQueryServiceApi.ExportPageCompositionsResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      webbffPageCompositionQueryServiceApi.ExportPageCompositionsResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      webbffPageCompositionQueryServiceApi.ExportPageCompositionsResponse.fromPartial({
        pageComposition: { billingAddress: { region: (req?.filter?.region ?? "") } },
      }),
    );
  }

  /**
   * Lists page compositions a page at a time.
   */
  async findPageCompositions(req: webbffPageCompositionQueryServiceApi.FindPageCompositionsRequest): Promise<webbffPageCompositionQueryServiceApi.FindPageCompositionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindPageCompositions", req);
    this.logger.info("find_page_compositions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateQueryServiceApi.FindNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        region: (req?.filter?.region ?? ""),
      },
      orderBy: (req?.orderBy ?? ""),
      page: { pageToken: (req?.page?.pageToken ?? "") },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.notifications.v1.FindNotificationTemplatesRequest",
      value: Buffer.from(notificationsNotificationTemplateQueryServiceApi.FindNotificationTemplatesRequest.encode(request1).finish()),
    });
    const unpacked1 = notificationsNotificationTemplateQueryServiceApi.FindNotificationTemplatesRequest.decode(envelope1.value);
    const invoke1: Unary<notificationsNotificationTemplateQueryServiceApi.FindNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.FindNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateQueryClient.findNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateQueryServiceApi.FindNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.FindNotificationTemplatesResponse>(invoke1, unpacked1);
    const request2 = formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (req?.context?.actor?.email ?? "") } },
      formSubmission: { correlationId: (reply1?.result?.correlationId ?? "") },
    });
    const client2 = this.clients.get<formsFormSubmissionWorkflowServiceApi.FormSubmissionWorkflowServiceClient>("acme.forms.v1.FormSubmissionWorkflowService");
    const invoke2: Unary<formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowResponse> =
      (input, done) => client2.cancelFormSubmissionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.filter?.ownerId ?? "") });
    return mergeResponses(
      webbffPageCompositionQueryServiceApi.FindPageCompositionsResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      webbffPageCompositionQueryServiceApi.FindPageCompositionsResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
    );
  }

  /**
   * Returns a page composition.
   */
  async lookupPageComposition(req: webbffPageCompositionQueryServiceApi.LookupPageCompositionRequest): Promise<webbffPageCompositionQueryServiceApi.LookupPageCompositionResponse> {
    validateContext(req.context);
    if (!req.pageCompositionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_composition_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupPageComposition", req);
    this.logger.info("lookup_page_composition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptHistoryServiceApi.RecordDeliveryAttemptVersionRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: { occurredAt: req?.context?.deadline },
      details: { authorEmail: (req?.context?.actor?.email ?? "") },
    });
    const invoke1: Unary<notificationsDeliveryAttemptHistoryServiceApi.RecordDeliveryAttemptVersionRequest, notificationsDeliveryAttemptHistoryServiceApi.RecordDeliveryAttemptVersionResponse> =
      (input, done) => this.notificationsDeliveryAttemptHistoryClient.recordDeliveryAttemptVersion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<notificationsDeliveryAttemptHistoryServiceApi.RecordDeliveryAttemptVersionRequest, notificationsDeliveryAttemptHistoryServiceApi.RecordDeliveryAttemptVersionResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = webbffWidgetLayoutNotificationServiceApi.SendWidgetLayoutTestNoticeRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: { email: (req?.context?.actor?.email ?? "") },
        variables: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
      },
    });
    const invoke2: Unary<webbffWidgetLayoutNotificationServiceApi.SendWidgetLayoutTestNoticeRequest, webbffWidgetLayoutNotificationServiceApi.SendWidgetLayoutTestNoticeResponse> =
      (input, done) => this.webbffWidgetLayoutNotificationClient.sendWidgetLayoutTestNotice(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<webbffWidgetLayoutNotificationServiceApi.SendWidgetLayoutTestNoticeRequest, webbffWidgetLayoutNotificationServiceApi.SendWidgetLayoutTestNoticeResponse>(invoke2, request2));
    return mergeResponses(
      webbffPageCompositionQueryServiceApi.LookupPageCompositionResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      webbffPageCompositionQueryServiceApi.LookupPageCompositionResponse.fromPartial({
        pageComposition: {
          billingAddress: { recipient: (reply2?.widgetLayout?.location?.recipient ?? "") },
        },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      webbffPageCompositionQueryServiceApi.LookupPageCompositionResponse.fromPartial({
        pageComposition: { pageCompositionId: (req?.pageCompositionId ?? "") },
      }),
    );
  }

  /**
   * Returns a page composition.
   */
  async peekPageComposition(req: webbffPageCompositionQueryServiceApi.PeekPageCompositionRequest): Promise<webbffPageCompositionQueryServiceApi.PeekPageCompositionResponse> {
    validateContext(req.context);
    if (!req.pageCompositionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_composition_id is required");
    }
    await this.repository.record(req.context.tenantId, "PeekPageComposition", req);
    this.logger.info("peek_page_composition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationWorkflowServiceApi.ResumeConversationWorkflowRequest.fromPartial({
      context: req?.context,
      conversation: {
        assignee: { userId: (req?.context?.actor?.userId ?? "") },
        history: [{ changedAt: req?.context?.deadline }],
        requester: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const invoke1: Unary<messagingConversationWorkflowServiceApi.ResumeConversationWorkflowRequest, messagingConversationWorkflowServiceApi.ResumeConversationWorkflowResponse> =
      (input, done) => this.messagingConversationWorkflowClient.resumeConversationWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("PeekPageComposition.ResumeConversationWorkflow", () => call<messagingConversationWorkflowServiceApi.ResumeConversationWorkflowRequest, messagingConversationWorkflowServiceApi.ResumeConversationWorkflowResponse>(invoke1, request1));
    return mergeResponses(
      webbffPageCompositionQueryServiceApi.PeekPageCompositionResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      webbffPageCompositionQueryServiceApi.PeekPageCompositionResponse.fromPartial({
        pageComposition: { pageCompositionId: (req?.pageCompositionId ?? "") },
      }),
    );
  }

  /**
   * Returns several page compositions at once.
   */
  async resolvePageCompositions(req: webbffPageCompositionQueryServiceApi.ResolvePageCompositionsRequest): Promise<webbffPageCompositionQueryServiceApi.ResolvePageCompositionsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolvePageCompositions", req);
    this.logger.info("resolve_page_compositions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffWidgetLayoutNotificationServiceApi.NotifyWidgetLayoutWatchersRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      context: req?.context,
      details: { recipient: { email: (req?.context?.actor?.email ?? "") } },
    });
    const invoke1: Unary<webbffWidgetLayoutNotificationServiceApi.NotifyWidgetLayoutWatchersRequest, webbffWidgetLayoutNotificationServiceApi.NotifyWidgetLayoutWatchersResponse> =
      (input, done) => this.webbffWidgetLayoutNotificationClient.notifyWidgetLayoutWatchers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    return webbffPageCompositionQueryServiceApi.ResolvePageCompositionsResponse.fromPartial({
      pageCompositions: [{
        counterparty: { widgetLayoutId: (reply1?.widgetLayout?.widgetLayoutId ?? "") },
      }],
      result: { status: (reply1?.result?.status ?? "") },
    });
  }

  /**
   * Lists page compositions a page at a time.
   */
  async suggestPageCompositions(req: webbffPageCompositionQueryServiceApi.SuggestPageCompositionsRequest): Promise<webbffPageCompositionQueryServiceApi.SuggestPageCompositionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SuggestPageCompositions", req);
    this.logger.info("suggest_page_compositions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffWidgetLayoutNotificationServiceApi.ListWidgetLayoutSubscriptionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        query: (req?.filter?.query ?? ""),
      },
      page: {
        pageSize: (req?.page?.pageSize ?? 0),
        pageToken: (req?.page?.pageToken ?? ""),
      },
    });
    const reply1 = await this.workQueue.enqueue<webbffWidgetLayoutNotificationServiceApi.ListWidgetLayoutSubscriptionsRequest, webbffWidgetLayoutNotificationServiceApi.ListWidgetLayoutSubscriptionsResponse>(
      "acme.webbff.v1.PageCompositionQueryService/SuggestPageCompositions:0", request1,
    );
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webbffPageCompositionQueryServiceApi.SuggestPageCompositionsResponse.fromPartial({
      result: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        message: (reply1?.result?.message ?? ""),
      },
    });
  }

  /**
   * Summarizes a page composition.
   */
  async summarizePageCompositions(req: webbffPageCompositionQueryServiceApi.SummarizePageCompositionsRequest): Promise<webbffPageCompositionQueryServiceApi.SummarizePageCompositionsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizePageCompositions", req);
    this.logger.info("summarize_page_compositions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowResponse> =
      (input, done) => this.formsFormSubmissionWorkflowClient.cancelFormSubmissionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowResponse>(invoke1, request1));
    const request2 = riskRiskRegisterQueryServiceApi.ExportRiskRegistersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.formSubmission?.occurredAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (reply1?.outcome?.referenceId ?? ""),
      },
      format: (req?.details?.format ?? ""),
    });
    const stream2 = this.riskRiskRegisterQueryClient.exportRiskRegisters(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? riskRiskRegisterQueryServiceApi.ExportRiskRegistersResponse.fromPartial({});
    const request3 = featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.outcome?.effectiveAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (reply1?.outcome?.referenceId ?? ""),
      },
    });
    const invoke3: Unary<featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagQueryClient.suggestFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      webbffPageCompositionQueryServiceApi.SummarizePageCompositionsResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      webbffPageCompositionQueryServiceApi.SummarizePageCompositionsResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      webbffPageCompositionQueryServiceApi.SummarizePageCompositionsResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}

/**
 * The gRPC boundary for PageCompositionQueryService; workflows own validation and database transactions.
 */
@injectable()
export class PageCompositionQueryHandler {
  constructor(@inject(PageCompositionQueryWorkflow) private readonly workflow: PageCompositionQueryWorkflow) {}

  /**
   * Lists page compositions a page at a time.
   */
  browsePageCompositions = unary<webbffPageCompositionQueryServiceApi.BrowsePageCompositionsRequest, webbffPageCompositionQueryServiceApi.BrowsePageCompositionsResponse>(
    (request) => this.workflow.browsePageCompositions(request),
  );

  /**
   * Counts page compositions by status.
   */
  countPageCompositions = unary<webbffPageCompositionQueryServiceApi.CountPageCompositionsRequest, webbffPageCompositionQueryServiceApi.CountPageCompositionsResponse>(
    (request) => this.workflow.countPageCompositions(request),
  );

  /**
   * Streams every matching page composition.
   */
  exportPageCompositions = serverStream<webbffPageCompositionQueryServiceApi.ExportPageCompositionsRequest, webbffPageCompositionQueryServiceApi.ExportPageCompositionsResponse>(
    (request) => this.workflow.exportPageCompositions(request),
  );

  /**
   * Lists page compositions a page at a time.
   */
  findPageCompositions = unary<webbffPageCompositionQueryServiceApi.FindPageCompositionsRequest, webbffPageCompositionQueryServiceApi.FindPageCompositionsResponse>(
    (request) => this.workflow.findPageCompositions(request),
  );

  /**
   * Returns a page composition.
   */
  lookupPageComposition = unary<webbffPageCompositionQueryServiceApi.LookupPageCompositionRequest, webbffPageCompositionQueryServiceApi.LookupPageCompositionResponse>(
    (request) => this.workflow.lookupPageComposition(request),
  );

  /**
   * Returns a page composition.
   */
  peekPageComposition = (call: ServerUnaryCall<webbffPageCompositionQueryServiceApi.PeekPageCompositionRequest, webbffPageCompositionQueryServiceApi.PeekPageCompositionResponse>, done: sendUnaryData<webbffPageCompositionQueryServiceApi.PeekPageCompositionResponse>): void => {
    void this.workflow.peekPageComposition(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns several page compositions at once.
   */
  resolvePageCompositions = unary<webbffPageCompositionQueryServiceApi.ResolvePageCompositionsRequest, webbffPageCompositionQueryServiceApi.ResolvePageCompositionsResponse>(
    (request) => this.workflow.resolvePageCompositions(request),
  );

  /**
   * Lists page compositions a page at a time.
   */
  suggestPageCompositions = unary<webbffPageCompositionQueryServiceApi.SuggestPageCompositionsRequest, webbffPageCompositionQueryServiceApi.SuggestPageCompositionsResponse>(
    (request) => this.workflow.suggestPageCompositions(request),
  );

  /**
   * Summarizes a page composition.
   */
  summarizePageCompositions = (call: ServerUnaryCall<webbffPageCompositionQueryServiceApi.SummarizePageCompositionsRequest, webbffPageCompositionQueryServiceApi.SummarizePageCompositionsResponse>, done: sendUnaryData<webbffPageCompositionQueryServiceApi.SummarizePageCompositionsResponse>): void => {
    void this.workflow.summarizePageCompositions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: PageCompositionQueryHandler): webbffPageCompositionQueryServiceApi.PageCompositionQueryServiceServer {
  return {
    browsePageCompositions: handler.browsePageCompositions,
    countPageCompositions: handler.countPageCompositions,
    exportPageCompositions: handler.exportPageCompositions,
    findPageCompositions: handler.findPageCompositions,
    lookupPageComposition: handler.lookupPageComposition,
    peekPageComposition: handler.peekPageComposition,
    resolvePageCompositions: handler.resolvePageCompositions,
    suggestPageCompositions: handler.suggestPageCompositions,
    summarizePageCompositions: handler.summarizePageCompositions,
  };
}
