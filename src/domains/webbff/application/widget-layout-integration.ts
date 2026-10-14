/**
 * Connects external systems that send widget layout events. Remote work stays behind typed client ports.
 */

import * as campaignsCampaignAssetApprovalServiceApi from "../../../../.cache/proto/acme/campaigns/v1/campaign_asset_approval_service.js";
import * as contentArticleApprovalServiceApi from "../../../../.cache/proto/acme/content/v1/article_approval_service.js";
import * as datahubWorkspaceQueryServiceApi from "../../../../.cache/proto/acme/datahub/v1/workspace_query_service.js";
import * as edgegatewayRouteBindingServiceApi from "../../../../.cache/proto/acme/edgegateway/v1/route_binding_service.js";
import * as formsFormSubmissionWorkflowServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_workflow_service.js";
import * as messagingChatMessageApprovalServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_approval_service.js";
import * as messagingChatMessageSyncServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_sync_service.js";
import * as messagingConversationWorkflowServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_workflow_service.js";
import * as notificationsSubscriptionApprovalServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_approval_service.js";
import * as notificationsSubscriptionCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_calculation_service.js";
import * as patientappPatientHomeQueryServiceApi from "../../../../.cache/proto/acme/patientapp/v1/patient_home_query_service.js";
import * as searchSearchIndexQueryServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_query_service.js";
import * as warehousingWarehouseServiceApi from "../../../../.cache/proto/acme/warehousing/v1/warehouse_service.js";
import * as webbffWidgetLayoutIntegrationServiceApi from "../../../../.cache/proto/acme/webbff/v1/widget_layout_integration_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { requireReply } from "../../../platform/errors.js";
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
} from "../../../platform/rpc.js";
import { collect, upload } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { WebbffRepository } from "../data/repository.js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate widget layout operations and persist audit data.
 */
@injectable()
export class WidgetLayoutIntegrationWorkflow {
  constructor(
    @inject(WebbffRepository) private readonly repository: WebbffRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.campaigns.v1.CampaignAssetApprovalService") private readonly campaignsCampaignAssetApprovalClient: campaignsCampaignAssetApprovalServiceApi.CampaignAssetApprovalServiceClient,
    @inject("grpc:acme.content.v1.ArticleApprovalService") private readonly contentArticleApprovalClient: contentArticleApprovalServiceApi.ArticleApprovalServiceClient,
    @inject("grpc:acme.datahub.v1.WorkspaceQueryService") private readonly datahubWorkspaceQueryClient: datahubWorkspaceQueryServiceApi.WorkspaceQueryServiceClient,
    @inject("grpc:acme.edgegateway.v1.RouteBindingService") private readonly edgegatewayRouteBindingClient: edgegatewayRouteBindingServiceApi.RouteBindingServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionWorkflowService") private readonly formsFormSubmissionWorkflowClient: formsFormSubmissionWorkflowServiceApi.FormSubmissionWorkflowServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageApprovalService") private readonly messagingChatMessageApprovalClient: messagingChatMessageApprovalServiceApi.ChatMessageApprovalServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageSyncService") private readonly messagingChatMessageSyncClient: messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationWorkflowService") private readonly messagingConversationWorkflowClient: messagingConversationWorkflowServiceApi.ConversationWorkflowServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionApprovalService") private readonly notificationsSubscriptionApprovalClient: notificationsSubscriptionApprovalServiceApi.SubscriptionApprovalServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionCalculationService") private readonly notificationsSubscriptionCalculationClient: notificationsSubscriptionCalculationServiceApi.SubscriptionCalculationServiceClient,
    @inject("grpc:acme.patientapp.v1.PatientHomeQueryService") private readonly patientappPatientHomeQueryClient: patientappPatientHomeQueryServiceApi.PatientHomeQueryServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexQueryService") private readonly searchSearchIndexQueryClient: searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient,
    @inject("grpc:acme.warehousing.v1.WarehouseService") private readonly warehousingWarehouseClient: warehousingWarehouseServiceApi.WarehouseServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Acknowledges a widget layout.
   */
  async acknowledgeWidgetLayoutEvent(req: webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest): Promise<webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "AcknowledgeWidgetLayoutEvent", req);
    this.logger.info("acknowledge_widget_layout_event", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageApprovalServiceApi.RejectChatMessageRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { approver: { email: (req?.context?.actor?.email ?? "") } },
    });
    const method1 = "rejectChatMessage" as const;
    const invoke1: Unary<messagingChatMessageApprovalServiceApi.RejectChatMessageRequest, messagingChatMessageApprovalServiceApi.RejectChatMessageResponse> =
      (input, done) => this.messagingChatMessageApprovalClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChatMessageApprovalServiceApi.RejectChatMessageRequest, messagingChatMessageApprovalServiceApi.RejectChatMessageResponse>(invoke1, request1);
    const request2 = messagingConversationWorkflowServiceApi.PauseConversationWorkflowRequest.fromPartial({
      context: req?.context,
      conversation: {
        origin: { $case: "customer", customer: {
          code: (reply1?.chatMessage?.subject?.code ?? ""),
          displayName: (reply1?.chatMessage?.subject?.displayName ?? ""),
        } },
      },
    });
    const proxy2 = forwarding(this.messagingConversationWorkflowClient);
    const invoke2: Unary<messagingConversationWorkflowServiceApi.PauseConversationWorkflowRequest, messagingConversationWorkflowServiceApi.PauseConversationWorkflowResponse> =
      (input, done) => proxy2.pauseConversationWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingConversationWorkflowServiceApi.PauseConversationWorkflowRequest, messagingConversationWorkflowServiceApi.PauseConversationWorkflowResponse>(invoke2, request2);
    const request3 = messagingChatMessageApprovalServiceApi.ListPendingChatMessagesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.conversation?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (req?.details?.messageId ?? ""),
      },
    });
    const invoke3: Unary<messagingChatMessageApprovalServiceApi.ListPendingChatMessagesRequest, messagingChatMessageApprovalServiceApi.ListPendingChatMessagesResponse> =
      (input, done) => this.messagingChatMessageApprovalClient.listPendingChatMessages(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<messagingChatMessageApprovalServiceApi.ListPendingChatMessagesRequest, messagingChatMessageApprovalServiceApi.ListPendingChatMessagesResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventResponse.fromPartial({ outcome: { effectiveAt: reply1?.outcome?.effectiveAt } }),
      webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventResponse.fromPartial({
        widgetLayout: {
          children: [{
            children: [{ audit: { createdAt: reply2?.conversation?.audit?.createdAt } }],
          }],
        },
      }),
      webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventResponse.fromPartial({ outcome: { message: (reply3?.result?.message ?? "") } }),
      webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventResponse.fromPartial({ widgetLayout: { widgetLayoutId: (req?.widgetLayoutId ?? "") } }),
    );
  }

  /**
   * Connects a widget layout.
   */
  async connectWidgetLayoutSource(req: webbffWidgetLayoutIntegrationServiceApi.ConnectWidgetLayoutSourceRequest): Promise<webbffWidgetLayoutIntegrationServiceApi.ConnectWidgetLayoutSourceResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ConnectWidgetLayoutSource", req);
    this.logger.info("connect_widget_layout_source", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentArticleApprovalServiceApi.ApproveArticleRequest.fromPartial({
      context: req?.context,
      details: { approver: { email: (req?.context?.actor?.email ?? "") } },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<contentArticleApprovalServiceApi.ApproveArticleRequest, contentArticleApprovalServiceApi.ApproveArticleResponse> =
      (input, done) => this.contentArticleApprovalClient.approveArticle(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentArticleApprovalServiceApi.ApproveArticleRequest, contentArticleApprovalServiceApi.ApproveArticleResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = datahubWorkspaceQueryServiceApi.CountWorkspacesRequest.fromPartial({
      context: input2?.context,
      filter: {
        createdAfter: reply1?.article?.audit?.updatedAt,
        ownerId: (reply1?.result?.correlationId ?? ""),
        region: (reply1?.article?.billingAddress?.region ?? ""),
      },
    });
    const invoke2: Unary<datahubWorkspaceQueryServiceApi.CountWorkspacesRequest, datahubWorkspaceQueryServiceApi.CountWorkspacesResponse> =
      (input, done) => this.datahubWorkspaceQueryClient.countWorkspaces(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<datahubWorkspaceQueryServiceApi.CountWorkspacesRequest, datahubWorkspaceQueryServiceApi.CountWorkspacesResponse>(invoke2, request2);
    const request3 = messagingChatMessageApprovalServiceApi.ListPendingChatMessagesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.outcome?.effectiveAt,
        region: (reply1?.article?.billingAddress?.region ?? ""),
      },
    });
    const cloned3: messagingChatMessageApprovalServiceApi.ListPendingChatMessagesRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<messagingChatMessageApprovalServiceApi.ListPendingChatMessagesRequest, messagingChatMessageApprovalServiceApi.ListPendingChatMessagesResponse> =
      (input, done) => this.messagingChatMessageApprovalClient.listPendingChatMessages(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<messagingChatMessageApprovalServiceApi.ListPendingChatMessagesRequest, messagingChatMessageApprovalServiceApi.ListPendingChatMessagesResponse>(invoke3, cloned3);
    const request4 = notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalRequest.fromPartial({
      context: req?.context,
      subscription: { audit: { etag: (reply1?.article?.audit?.etag ?? "") } },
    });
    const decoded4 = notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalRequest.fromJSON(
      JSON.parse(JSON.stringify(notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalRequest.toJSON(request4))),
    );
    const invoke4: Unary<notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalRequest, notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalResponse> =
      (input, done) => this.notificationsSubscriptionApprovalClient.commentSubscriptionApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalRequest, notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalResponse>(invoke4, decoded4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webbffWidgetLayoutIntegrationServiceApi.ConnectWidgetLayoutSourceResponse.fromPartial({
        widgetLayout: { audit: { createdAt: reply1?.article?.audit?.createdAt } },
      }),
      webbffWidgetLayoutIntegrationServiceApi.ConnectWidgetLayoutSourceResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      webbffWidgetLayoutIntegrationServiceApi.ConnectWidgetLayoutSourceResponse.fromPartial({
        outcome: { status: (reply3?.result?.status ?? "") },
        result: { message: (reply3?.result?.message ?? "") },
      }),
      webbffWidgetLayoutIntegrationServiceApi.ConnectWidgetLayoutSourceResponse.fromPartial({
        widgetLayout: {
          children: [{
            children: [{ manager: { userId: (reply4?.subscription?.owner?.userId ?? "") } }],
          }],
          manager: { displayName: (reply4?.subscription?.owner?.displayName ?? "") },
        },
      }),
      webbffWidgetLayoutIntegrationServiceApi.ConnectWidgetLayoutSourceResponse.fromPartial({ widgetLayout: { widgetLayoutId: (req?.widgetLayoutId ?? "") } }),
    );
  }

  /**
   * Disconnects a widget layout.
   */
  async disconnectWidgetLayoutSource(req: webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceRequest): Promise<webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "DisconnectWidgetLayoutSource", req);
    this.logger.info("disconnect_widget_layout_source", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.forms.v1.CancelFormSubmissionWorkflowRequest",
      value: Buffer.from(formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowRequest.encode(request1).finish()),
    });
    const unpacked1 = formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowRequest.decode(envelope1.value);
    const invoke1: Unary<formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowResponse> =
      (input, done) => this.formsFormSubmissionWorkflowClient.cancelFormSubmissionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowResponse>(invoke1, unpacked1);
    const request2 = formsFormSubmissionWorkflowServiceApi.SignalFormSubmissionWorkflowRequest.fromPartial({
      context: req?.context,
      formSubmission: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        sequence: (reply1?.formSubmission?.sequence ?? 0),
        subject: { displayName: (reply1?.formSubmission?.subject?.displayName ?? "") },
      },
    });
    const client2 = this.clients.get<formsFormSubmissionWorkflowServiceApi.FormSubmissionWorkflowServiceClient>("acme.forms.v1.FormSubmissionWorkflowService");
    const invoke2: Unary<formsFormSubmissionWorkflowServiceApi.SignalFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.SignalFormSubmissionWorkflowResponse> =
      (input, done) => client2.signalFormSubmissionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormSubmissionWorkflowServiceApi.SignalFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.SignalFormSubmissionWorkflowResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.details?.sourceSystem ?? "") });
    return mergeResponses(
      webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceResponse.fromPartial({
        outcome: { status: (reply1?.outcome?.status ?? "") },
        widgetLayout: {
          children: [{
            manager: { displayName: (reply1?.formSubmission?.subject?.displayName ?? "") },
          }],
        },
      }),
      webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceResponse.fromPartial({ widgetLayout: { widgetLayoutId: (req?.widgetLayoutId ?? "") } }),
    );
  }

  /**
   * Takes a stream of widget layouts and answers once at the end.
   */
  async ingestWidgetLayoutEvents(req: webbffWidgetLayoutIntegrationServiceApi.IngestWidgetLayoutEventsRequest): Promise<webbffWidgetLayoutIntegrationServiceApi.IngestWidgetLayoutEventsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "IngestWidgetLayoutEvents", req);
    this.logger.info("ingest_widget_layout_events", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageSyncServiceApi.ListChatMessageConflictsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: (req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.updatedAt,
        region: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.location?.region ?? ""),
      },
    });
    const invoke1: Unary<messagingChatMessageSyncServiceApi.ListChatMessageConflictsRequest, messagingChatMessageSyncServiceApi.ListChatMessageConflictsResponse> =
      (input, done) => this.messagingChatMessageSyncClient.listChatMessageConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<messagingChatMessageSyncServiceApi.ListChatMessageConflictsRequest, messagingChatMessageSyncServiceApi.ListChatMessageConflictsResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = edgegatewayRouteBindingServiceApi.SearchRouteBindingsRequest.fromPartial({
      context: req?.context,
      filter: {
        region: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.location?.region ?? ""),
      },
    });
    const invoke2: Unary<edgegatewayRouteBindingServiceApi.SearchRouteBindingsRequest, edgegatewayRouteBindingServiceApi.SearchRouteBindingsResponse> =
      (input, done) => this.edgegatewayRouteBindingClient.searchRouteBindings(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<edgegatewayRouteBindingServiceApi.SearchRouteBindingsRequest, edgegatewayRouteBindingServiceApi.SearchRouteBindingsResponse>(invoke2, request2));
    let selected3_1: string | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected3_1 = ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.location?.region ?? "");
        break;
      default:
        selected3_1 = "";
    }
    let selected3_2: string | undefined;
    switch (req?.chunk?.$case) {
      case "header":
        selected3_2 = ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.email ?? "");
        break;
      default:
        selected3_2 = "";
    }
    const request3 = notificationsSubscriptionCalculationServiceApi.CalculateSubscriptionRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (selected3_1 ?? "") } },
      subscription: { owner: { email: (selected3_2 ?? "") } },
    });
    const invoke3: Unary<notificationsSubscriptionCalculationServiceApi.CalculateSubscriptionRequest, notificationsSubscriptionCalculationServiceApi.CalculateSubscriptionResponse> =
      (input, done) => this.notificationsSubscriptionCalculationClient.calculateSubscription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsSubscriptionCalculationServiceApi.CalculateSubscriptionRequest, notificationsSubscriptionCalculationServiceApi.CalculateSubscriptionResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.etag ?? "") });
    return mergeResponses(
      webbffWidgetLayoutIntegrationServiceApi.IngestWidgetLayoutEventsResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      webbffWidgetLayoutIntegrationServiceApi.IngestWidgetLayoutEventsResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      webbffWidgetLayoutIntegrationServiceApi.IngestWidgetLayoutEventsResponse.fromPartial({
        result: {
          details: (reply3?.result?.details ?? {}),
          message: (reply3?.result?.message ?? ""),
        },
      }),
    );
  }

  /**
   * Exchanges changes of widget layouts with a peer.
   */
  async relayWidgetLayoutMessages(req: webbffWidgetLayoutIntegrationServiceApi.RelayWidgetLayoutMessagesRequest): Promise<webbffWidgetLayoutIntegrationServiceApi.RelayWidgetLayoutMessagesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "RelayWidgetLayoutMessages", req);
    this.logger.info("relay_widget_layout_messages", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsCampaignAssetApprovalServiceApi.CommentCampaignAssetApprovalRequest.fromPartial({
      campaignAsset: {
        audit: {
          createdAt: (req?.frame?.$case === "change" ? req?.frame.change : undefined)?.audit?.createdAt,
          updatedAt: (req?.frame?.$case === "change" ? req?.frame.change : undefined)?.audit?.updatedAt,
        },
        owner: {
          email: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.manager?.email ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke1: Unary<campaignsCampaignAssetApprovalServiceApi.CommentCampaignAssetApprovalRequest, campaignsCampaignAssetApprovalServiceApi.CommentCampaignAssetApprovalResponse> =
      (input, done) => this.campaignsCampaignAssetApprovalClient.commentCampaignAssetApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = searchSearchIndexQueryServiceApi.SuggestSearchIndexesRequest.fromPartial({
      context: req?.context,
      filter: {
        region: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.location?.region ?? ""),
      },
    });
    const reply2 = await this.workQueue.enqueue<searchSearchIndexQueryServiceApi.SuggestSearchIndexesRequest, searchSearchIndexQueryServiceApi.SuggestSearchIndexesResponse>(
      "acme.webbff.v1.WidgetLayoutIntegrationService/RelayWidgetLayoutMessages:1", request2,
    );
    const request3 = patientappPatientHomeQueryServiceApi.ExportPatientHomesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.campaignAsset?.audit?.createdAt,
        ownerId: (reply1?.campaignAsset?.components?.["primary"]?.componentId ?? ""),
        region: ((reply1?.campaignAsset?.locator?.$case === "address" ? reply1?.campaignAsset?.locator.address : undefined)?.region ?? ""),
      },
    });
    const stream3 = this.patientappPatientHomeQueryClient.exportPatientHomes(request3, metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const messages3 = await collect(stream3);
    const reply3 = messages3.at(-1) ?? patientappPatientHomeQueryServiceApi.ExportPatientHomesResponse.fromPartial({});
    let selected4_2: string | undefined;
    switch (req?.frame?.$case) {
      case "change":
        selected4_2 = ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.manager?.displayName ?? "");
        break;
      default:
        selected4_2 = "";
    }
    const request4 = formsFormSubmissionWorkflowServiceApi.RetryFormSubmissionWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (reply1?.campaignAsset?.owner?.email ?? "") } },
      formSubmission: {
        measurements: [{ unit: (reply1?.campaignAsset?.dimensions?.unit ?? "") }],
        subject: { displayName: (selected4_2 ?? "") },
      },
    });
    const invoke4: Unary<formsFormSubmissionWorkflowServiceApi.RetryFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.RetryFormSubmissionWorkflowResponse> =
      (input, done) => this.formsFormSubmissionWorkflowClient.retryFormSubmissionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<formsFormSubmissionWorkflowServiceApi.RetryFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.RetryFormSubmissionWorkflowResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.cursor ?? "") });
    return mergeResponses(
      webbffWidgetLayoutIntegrationServiceApi.RelayWidgetLayoutMessagesResponse.fromPartial({
        widgetLayout: {
          audit: { updatedBy: (reply1?.campaignAsset?.audit?.updatedBy ?? "") },
          manager: { email: (reply1?.campaignAsset?.owner?.email ?? "") },
        },
      }),
      webbffWidgetLayoutIntegrationServiceApi.RelayWidgetLayoutMessagesResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      webbffWidgetLayoutIntegrationServiceApi.RelayWidgetLayoutMessagesResponse.fromPartial({
        result: {
          correlationId: (reply4?.result?.correlationId ?? ""),
          details: (reply4?.result?.details ?? {}),
        },
      }),
      webbffWidgetLayoutIntegrationServiceApi.RelayWidgetLayoutMessagesResponse.fromPartial({
        widgetLayout: {
          depth: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.depth ?? 0),
          location: (req?.frame?.$case === "change" ? req?.frame.change : undefined)?.location,
        },
      }),
    );
  }

  /**
   * Tests a widget layout.
   */
  async testWidgetLayoutConnection(req: webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionRequest): Promise<webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "TestWidgetLayoutConnection", req);
    this.logger.info("test_widget_layout_connection", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageApprovalServiceApi.ListPendingChatMessagesRequest.fromPartial({
      context: req?.context,
      filter: { labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))) },
    });
    const invoke1: Unary<messagingChatMessageApprovalServiceApi.ListPendingChatMessagesRequest, messagingChatMessageApprovalServiceApi.ListPendingChatMessagesResponse> =
      (input, done) => this.messagingChatMessageApprovalClient.listPendingChatMessages(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<messagingChatMessageApprovalServiceApi.ListPendingChatMessagesResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = warehousingWarehouseServiceApi.BatchCreateWarehousesRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "record", record: {
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      } },
    });
    const reply2 = await upload<warehousingWarehouseServiceApi.BatchCreateWarehousesRequest, warehousingWarehouseServiceApi.BatchCreateWarehousesResponse>(
      (done) => this.warehousingWarehouseClient.batchCreateWarehouses(metadataFor(request2.context), { deadline: Date.now() + 15_000 }, done), [request2],
    );
    const request3 = messagingConversationWorkflowServiceApi.StartConversationWorkflowRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      conversation: {
        assignee: { userId: (req?.context?.actor?.userId ?? "") },
        requester: { email: (req?.context?.actor?.email ?? "") },
      },
      reason: (req?.reason ?? ""),
    });
    const invoke3: Unary<messagingConversationWorkflowServiceApi.StartConversationWorkflowRequest, messagingConversationWorkflowServiceApi.StartConversationWorkflowResponse> =
      (input, done) => this.messagingConversationWorkflowClient.startConversationWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    const request4 = patientappPatientHomeQueryServiceApi.FindPatientHomesRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: reply3?.conversation?.sla?.dueAt },
    });
    const invoke4: Unary<patientappPatientHomeQueryServiceApi.FindPatientHomesRequest, patientappPatientHomeQueryServiceApi.FindPatientHomesResponse> =
      (input, done) => this.patientappPatientHomeQueryClient.findPatientHomes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke4 = promisify(invoke4);
    const reply4 = requireReply(await asyncInvoke4(request4));
    this.logger.info("local_audit", { value: (req?.details?.sourceSystem ?? "") });
    return mergeResponses(
      webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionResponse.fromPartial({
        result: {
          referenceIds: (reply1?.result?.referenceIds ?? []),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionResponse.fromPartial({ result: { details: (reply4?.result?.details ?? {}) } }),
      webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionResponse.fromPartial({ widgetLayout: { widgetLayoutId: (req?.widgetLayoutId ?? "") } }),
    );
  }
}
