/**
 * The edge API that apps call for page compositions. Remote work stays behind typed client ports.
 */

import * as auditAuditEventValidationServiceApi from "../../../../../.cache/proto/acme/audit/v1/audit_event_validation_service.js";
import * as communityBadgeWorkflowServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_workflow_service.js";
import * as driverappDriverHomeQueryServiceApi from "../../../../../.cache/proto/acme/driverapp/v1/driver_home_query_service.js";
import * as edgegatewayRouteBindingQueryServiceApi from "../../../../../.cache/proto/acme/edgegateway/v1/route_binding_query_service.js";
import * as messagingChatMessageSyncServiceApi from "../../../../../.cache/proto/acme/messaging/v1/chat_message_sync_service.js";
import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as notificationsSubscriptionNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_notification_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import * as patientappPatientHomeServiceApi from "../../../../../.cache/proto/acme/patientapp/v1/patient_home_service.js";
import * as webbffClientSessionIntegrationServiceApi from "../../../../../.cache/proto/acme/webbff/v1/client_session_integration_service.js";
import * as webbffClientSessionNotificationServiceApi from "../../../../../.cache/proto/acme/webbff/v1/client_session_notification_service.js";
import * as webbffClientSessionQueryServiceApi from "../../../../../.cache/proto/acme/webbff/v1/client_session_query_service.js";
import * as webbffPageCompositionGatewayServiceApi from "../../../../../.cache/proto/acme/webbff/v1/page_composition_gateway_service.js";
import * as webbffPageCompositionNotificationServiceApi from "../../../../../.cache/proto/acme/webbff/v1/page_composition_notification_service.js";
import * as webbffPageCompositionQueryServiceApi from "../../../../../.cache/proto/acme/webbff/v1/page_composition_query_service.js";
import * as webbffWidgetLayoutNotificationServiceApi from "../../../../../.cache/proto/acme/webbff/v1/widget_layout_notification_service.js";
import * as webbffWidgetLayoutServiceApi from "../../../../../.cache/proto/acme/webbff/v1/widget_layout_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import * as googleTimestampApi from "../../../../../.cache/proto/google/protobuf/timestamp.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
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
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toPageCompositionRecord } from "../../data/records.js";
import { WebbffRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate page composition operations and persist audit data.
 */
@injectable()
export class PageCompositionGatewayWorkflow {
  constructor(
    @inject(WebbffRepository) private readonly repository: WebbffRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventValidationService") private readonly auditAuditEventValidationClient: auditAuditEventValidationServiceApi.AuditEventValidationServiceClient,
    @inject("grpc:acme.community.v1.BadgeWorkflowService") private readonly communityBadgeWorkflowClient: communityBadgeWorkflowServiceApi.BadgeWorkflowServiceClient,
    @inject("grpc:acme.driverapp.v1.DriverHomeQueryService") private readonly driverappDriverHomeQueryClient: driverappDriverHomeQueryServiceApi.DriverHomeQueryServiceClient,
    @inject("grpc:acme.edgegateway.v1.RouteBindingQueryService") private readonly edgegatewayRouteBindingQueryClient: edgegatewayRouteBindingQueryServiceApi.RouteBindingQueryServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageSyncService") private readonly messagingChatMessageSyncClient: messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptWorkflowService") private readonly notificationsDeliveryAttemptWorkflowClient: notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionNotificationService") private readonly notificationsSubscriptionNotificationClient: notificationsSubscriptionNotificationServiceApi.SubscriptionNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionSyncService") private readonly notificationsSubscriptionSyncClient: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient,
    @inject("grpc:acme.patientapp.v1.PatientHomeService") private readonly patientappPatientHomeClient: patientappPatientHomeServiceApi.PatientHomeServiceClient,
    @inject("grpc:acme.webbff.v1.ClientSessionIntegrationService") private readonly webbffClientSessionIntegrationClient: webbffClientSessionIntegrationServiceApi.ClientSessionIntegrationServiceClient,
    @inject("grpc:acme.webbff.v1.ClientSessionNotificationService") private readonly webbffClientSessionNotificationClient: webbffClientSessionNotificationServiceApi.ClientSessionNotificationServiceClient,
    @inject("grpc:acme.webbff.v1.ClientSessionQueryService") private readonly webbffClientSessionQueryClient: webbffClientSessionQueryServiceApi.ClientSessionQueryServiceClient,
    @inject("grpc:acme.webbff.v1.PageCompositionNotificationService") private readonly webbffPageCompositionNotificationClient: webbffPageCompositionNotificationServiceApi.PageCompositionNotificationServiceClient,
    @inject("grpc:acme.webbff.v1.PageCompositionQueryService") private readonly webbffPageCompositionQueryClient: webbffPageCompositionQueryServiceApi.PageCompositionQueryServiceClient,
    @inject("grpc:acme.webbff.v1.WidgetLayoutNotificationService") private readonly webbffWidgetLayoutNotificationClient: webbffWidgetLayoutNotificationServiceApi.WidgetLayoutNotificationServiceClient,
    @inject("grpc:acme.webbff.v1.WidgetLayoutService") private readonly webbffWidgetLayoutClient: webbffWidgetLayoutServiceApi.WidgetLayoutServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Composes a page composition.
   */
  async composePageCompositionPage(req: webbffPageCompositionGatewayServiceApi.ComposePageCompositionPageRequest): Promise<webbffPageCompositionGatewayServiceApi.ComposePageCompositionPageResponse> {
    validateContext(req.context);
    if (req.pageComposition) {
      await this.repository.save(toPageCompositionRecord(req.context.tenantId, req.pageComposition));
    }
    await this.repository.record(req.context.tenantId, "ComposePageCompositionPage", req);
    this.logger.info("compose_page_composition_page", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffPageCompositionQueryServiceApi.ExportPageCompositionsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.pageComposition?.billingAddress?.region ?? "") },
    });
    const stream1 = this.webbffPageCompositionQueryClient.exportPageCompositions(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? webbffPageCompositionQueryServiceApi.ExportPageCompositionsResponse.fromPartial({});
    const request2 = webbffWidgetLayoutServiceApi.SearchWidgetLayoutsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.pageComposition?.audit?.updatedAt,
        region: (req?.pageComposition?.billingAddress?.region ?? ""),
      },
    });
    const invoke2: Unary<webbffWidgetLayoutServiceApi.SearchWidgetLayoutsRequest, webbffWidgetLayoutServiceApi.SearchWidgetLayoutsResponse> =
      (input, done) => this.webbffWidgetLayoutClient.searchWidgetLayouts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webbffWidgetLayoutServiceApi.SearchWidgetLayoutsRequest, webbffWidgetLayoutServiceApi.SearchWidgetLayoutsResponse>(invoke2, request2);
    const request3 = webbffClientSessionIntegrationServiceApi.ConnectClientSessionSourceRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        messageId: (reply2?.result?.message ?? ""),
        receivedAt: req?.pageComposition?.audit?.createdAt,
      },
      reason: (req?.reason ?? ""),
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<webbffClientSessionIntegrationServiceApi.ConnectClientSessionSourceRequest, webbffClientSessionIntegrationServiceApi.ConnectClientSessionSourceResponse> =
      (input, done) => this.webbffClientSessionIntegrationClient.connectClientSessionSource(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<webbffClientSessionIntegrationServiceApi.ConnectClientSessionSourceRequest, webbffClientSessionIntegrationServiceApi.ConnectClientSessionSourceResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.details?.sessionId ?? "") });
    return mergeResponses(
      webbffPageCompositionGatewayServiceApi.ComposePageCompositionPageResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      webbffPageCompositionGatewayServiceApi.ComposePageCompositionPageResponse.fromPartial({
        pageComposition: { audit: { createdBy: (reply3?.clientSession?.audit?.createdBy ?? "") } },
      }),
      webbffPageCompositionGatewayServiceApi.ComposePageCompositionPageResponse.fromPartial({
        pageComposition: {
          pageCompositionId: (req?.pageCompositionId ?? ""),
          status: req?.pageComposition?.status,
        },
      }),
    );
  }

  /**
   * Fetchs a page composition.
   */
  async fetchPageCompositionView(req: webbffPageCompositionGatewayServiceApi.FetchPageCompositionViewRequest): Promise<webbffPageCompositionGatewayServiceApi.FetchPageCompositionViewResponse> {
    validateContext(req.context);
    if (req.pageComposition) {
      await this.repository.save(toPageCompositionRecord(req.context.tenantId, req.pageComposition));
    }
    await this.repository.record(req.context.tenantId, "FetchPageCompositionView", req);
    this.logger.info("fetch_page_composition_view", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = messagingChatMessageSyncServiceApi.PullChatMessagesRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((input1?.annotations ?? {}))),
      chatMessage: {
        measurements: [{ observedAt: input1?.pageComposition?.audit?.updatedAt }],
        subject: {
          displayName: (input1?.pageComposition?.counterparty?.displayName ?? ""),
        },
      },
      context: input1?.context,
      reason: (input1?.reason ?? ""),
    });
    const invoke1: Unary<messagingChatMessageSyncServiceApi.PullChatMessagesRequest, messagingChatMessageSyncServiceApi.PullChatMessagesResponse> =
      (input, done) => this.messagingChatMessageSyncClient.pullChatMessages(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChatMessageSyncServiceApi.PullChatMessagesRequest, messagingChatMessageSyncServiceApi.PullChatMessagesResponse>(invoke1, request1);
    const request2 = webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.pageComposition?.audit?.updatedAt,
        ownerId: (req?.pageComposition?.counterparty?.widgetLayoutId ?? ""),
        region: (req?.pageComposition?.billingAddress?.region ?? ""),
      },
    });
    const cloned2: webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesRequest, webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesResponse> =
      (input, done) => this.webbffClientSessionIntegrationClient.listClientSessionSources(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesRequest, webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesResponse>(invoke2, cloned2);
    const request3 = webbffPageCompositionQueryServiceApi.ExportPageCompositionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.chatMessage?.occurredAt,
        labels: Object.fromEntries(Object.entries((reply2?.result?.details ?? {}))),
        region: (req?.pageComposition?.billingAddress?.region ?? ""),
      },
    });
    const stream3 = this.webbffPageCompositionQueryClient.exportPageCompositions(request3, metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const messages3 = await collect(stream3);
    const reply3 = messages3.at(-1) ?? webbffPageCompositionQueryServiceApi.ExportPageCompositionsResponse.fromPartial({});
    const request4 = webbffClientSessionNotificationServiceApi.NotifyClientSessionWatchersRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const decoded4 = webbffClientSessionNotificationServiceApi.NotifyClientSessionWatchersRequest.fromJSON(
      JSON.parse(JSON.stringify(webbffClientSessionNotificationServiceApi.NotifyClientSessionWatchersRequest.toJSON(request4))),
    );
    const invoke4: Unary<webbffClientSessionNotificationServiceApi.NotifyClientSessionWatchersRequest, webbffClientSessionNotificationServiceApi.NotifyClientSessionWatchersResponse> =
      (input, done) => this.webbffClientSessionNotificationClient.notifyClientSessionWatchers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<webbffClientSessionNotificationServiceApi.NotifyClientSessionWatchersRequest, webbffClientSessionNotificationServiceApi.NotifyClientSessionWatchersResponse>(invoke4, decoded4);
    this.logger.info("local_audit", { value: (req?.details?.sessionId ?? "") });
    return mergeResponses(
      webbffPageCompositionGatewayServiceApi.FetchPageCompositionViewResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      webbffPageCompositionGatewayServiceApi.FetchPageCompositionViewResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      webbffPageCompositionGatewayServiceApi.FetchPageCompositionViewResponse.fromPartial({
        pageComposition: { dueAt: reply4?.clientSession?.sla?.dueAt },
        result: { status: (reply4?.result?.status ?? "") },
      }),
      webbffPageCompositionGatewayServiceApi.FetchPageCompositionViewResponse.fromPartial({
        pageComposition: {
          counterparty: req?.pageComposition?.counterparty,
          pageCompositionId: (req?.pageCompositionId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a page composition.
   */
  async getPageCompositionSummary(req: webbffPageCompositionGatewayServiceApi.GetPageCompositionSummaryRequest): Promise<webbffPageCompositionGatewayServiceApi.GetPageCompositionSummaryResponse> {
    validateContext(req.context);
    if (!req.pageCompositionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_composition_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetPageCompositionSummary", req);
    this.logger.info("get_page_composition_summary", { tenant: req.context.tenantId, trace: req.context.traceId });
    return webbffPageCompositionGatewayServiceApi.GetPageCompositionSummaryResponse.fromPartial({
      pageComposition: { pageCompositionId: (req?.pageCompositionId ?? "") },
    });
  }

  /**
   * Refreshs a page composition.
   */
  async refreshPageComposition(req: webbffPageCompositionGatewayServiceApi.RefreshPageCompositionRequest): Promise<webbffPageCompositionGatewayServiceApi.RefreshPageCompositionResponse> {
    validateContext(req.context);
    if (req.pageComposition) {
      await this.repository.save(toPageCompositionRecord(req.context.tenantId, req.pageComposition));
    }
    await this.repository.record(req.context.tenantId, "RefreshPageComposition", req);
    this.logger.info("refresh_page_composition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffClientSessionQueryServiceApi.ExportClientSessionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.pageComposition?.audit?.createdAt,
        region: (req?.pageComposition?.billingAddress?.region ?? ""),
      },
    });
    const stream1 = this.webbffClientSessionQueryClient.exportClientSessions(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? webbffClientSessionQueryServiceApi.ExportClientSessionsResponse.fromPartial({});
    const request2 = notificationsSubscriptionSyncServiceApi.PullSubscriptionsRequest.fromPartial({
      context: req?.context,
      subscription: {
        audit: {
          createdAt: req?.pageComposition?.audit?.createdAt,
          createdBy: (req?.pageComposition?.audit?.createdBy ?? ""),
        },
        owner: { displayName: (req?.pageComposition?.counterparty?.displayName ?? "") },
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.notifications.v1.PullSubscriptionsRequest",
      value: Buffer.from(notificationsSubscriptionSyncServiceApi.PullSubscriptionsRequest.encode(request2).finish()),
    });
    const unpacked2 = notificationsSubscriptionSyncServiceApi.PullSubscriptionsRequest.decode(envelope2.value);
    const invoke2: Unary<notificationsSubscriptionSyncServiceApi.PullSubscriptionsRequest, notificationsSubscriptionSyncServiceApi.PullSubscriptionsResponse> =
      (input, done) => this.notificationsSubscriptionSyncClient.pullSubscriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsSubscriptionSyncServiceApi.PullSubscriptionsRequest, notificationsSubscriptionSyncServiceApi.PullSubscriptionsResponse>(invoke2, unpacked2);
    const request3 = webbffPageCompositionNotificationServiceApi.GetPageCompositionPreferencesRequest.fromPartial({
      context: req?.context,
      pageCompositionId: (req?.pageCompositionId ?? ""),
    });
    const client3 = this.clients.get<webbffPageCompositionNotificationServiceApi.PageCompositionNotificationServiceClient>("acme.webbff.v1.PageCompositionNotificationService");
    const invoke3: Unary<webbffPageCompositionNotificationServiceApi.GetPageCompositionPreferencesRequest, webbffPageCompositionNotificationServiceApi.GetPageCompositionPreferencesResponse> =
      (input, done) => client3.getPageCompositionPreferences(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<webbffPageCompositionNotificationServiceApi.GetPageCompositionPreferencesRequest, webbffPageCompositionNotificationServiceApi.GetPageCompositionPreferencesResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webbffPageCompositionGatewayServiceApi.RefreshPageCompositionResponse.fromPartial({
        pageComposition: {
          counterparty: { displayName: (reply2?.subscription?.owner?.displayName ?? "") },
          lines: [{ description: (reply2?.subscription?.description ?? "") }],
        },
      }),
      webbffPageCompositionGatewayServiceApi.RefreshPageCompositionResponse.fromPartial({
        pageComposition: { audit: { etag: (reply3?.pageComposition?.audit?.etag ?? "") } },
      }),
      webbffPageCompositionGatewayServiceApi.RefreshPageCompositionResponse.fromPartial({
        pageComposition: {
          pageCompositionId: (req?.pageCompositionId ?? ""),
          status: req?.pageComposition?.status,
        },
      }),
    );
  }

  /**
   * Lists page compositions a page at a time.
   */
  async searchPageCompositionCatalog(req: webbffPageCompositionGatewayServiceApi.SearchPageCompositionCatalogRequest): Promise<webbffPageCompositionGatewayServiceApi.SearchPageCompositionCatalogResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SearchPageCompositionCatalog", req);
    this.logger.info("search_page_composition_catalog", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffClientSessionNotificationServiceApi.StreamClientSessionNoticesRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        query: (req?.filter?.query ?? ""),
        region: (req?.filter?.region ?? ""),
      },
    });
    const stream1 = this.webbffClientSessionNotificationClient.streamClientSessionNotices(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? webbffClientSessionNotificationServiceApi.StreamClientSessionNoticesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webbffPageCompositionGatewayServiceApi.SearchPageCompositionCatalogResponse.fromPartial({});
  }

  /**
   * Starts a page composition.
   */
  async startPageCompositionCheckout(req: webbffPageCompositionGatewayServiceApi.StartPageCompositionCheckoutRequest): Promise<webbffPageCompositionGatewayServiceApi.StartPageCompositionCheckoutResponse> {
    validateContext(req.context);
    if (req.pageComposition) {
      await this.repository.save(toPageCompositionRecord(req.context.tenantId, req.pageComposition));
    }
    await this.repository.record(req.context.tenantId, "StartPageCompositionCheckout", req);
    this.logger.info("start_page_composition_checkout", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = driverappDriverHomeQueryServiceApi.FindDriverHomesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.pageComposition?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.pageComposition?.metadata ?? {}))),
        region: (req?.pageComposition?.billingAddress?.region ?? ""),
      },
    });
    const invoke1: Unary<driverappDriverHomeQueryServiceApi.FindDriverHomesRequest, driverappDriverHomeQueryServiceApi.FindDriverHomesResponse> =
      (input, done) => this.driverappDriverHomeQueryClient.findDriverHomes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<driverappDriverHomeQueryServiceApi.FindDriverHomesRequest, driverappDriverHomeQueryServiceApi.FindDriverHomesResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = webbffPageCompositionQueryServiceApi.BrowsePageCompositionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.pageComposition?.audit?.updatedAt,
        ownerId: (req?.pageComposition?.counterparty?.widgetLayoutId ?? ""),
        region: (req?.pageComposition?.billingAddress?.region ?? ""),
      },
    });
    const invoke2: Unary<webbffPageCompositionQueryServiceApi.BrowsePageCompositionsRequest, webbffPageCompositionQueryServiceApi.BrowsePageCompositionsResponse> =
      (input, done) => this.webbffPageCompositionQueryClient.browsePageCompositions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<webbffPageCompositionQueryServiceApi.BrowsePageCompositionsRequest, webbffPageCompositionQueryServiceApi.BrowsePageCompositionsResponse>(invoke2, request2));
    const results3 = await Promise.all((req?.pageComposition?.lines ?? []).map(async (item) => {
      const request3 = communityBadgeWorkflowServiceApi.AdvanceBadgeWorkflowRequest.fromPartial({
        badge: {
          description: (item?.description ?? ""),
          action: { $case: "discount", discount: { amount: item?.amount } },
        },
        context: req?.context,
        details: { notify: { phone: (req?.details?.notify?.phone ?? "") } },
      });
      const invoke3: Unary<communityBadgeWorkflowServiceApi.AdvanceBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.AdvanceBadgeWorkflowResponse> =
        (input, done) => this.communityBadgeWorkflowClient.advanceBadgeWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<communityBadgeWorkflowServiceApi.AdvanceBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.AdvanceBadgeWorkflowResponse>(invoke3, request3);
      return reply3;
    }));
    const reply3 = results3.at(-1) ?? communityBadgeWorkflowServiceApi.AdvanceBadgeWorkflowResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webbffPageCompositionGatewayServiceApi.StartPageCompositionCheckoutResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          details: (reply1?.result?.details ?? {}),
        },
      }),
      webbffPageCompositionGatewayServiceApi.StartPageCompositionCheckoutResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      webbffPageCompositionGatewayServiceApi.StartPageCompositionCheckoutResponse.fromPartial({
        pageComposition: {
          number: (req?.pageComposition?.number ?? ""),
          pageCompositionId: (req?.pageCompositionId ?? ""),
        },
      }),
    );
  }

  /**
   * Streams the changes of page compositions as they happen.
   */
  async streamPageCompositionUpdates(req: webbffPageCompositionGatewayServiceApi.StreamPageCompositionUpdatesRequest): Promise<webbffPageCompositionGatewayServiceApi.StreamPageCompositionUpdatesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamPageCompositionUpdates", req);
    this.logger.info("stream_page_composition_updates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffWidgetLayoutNotificationServiceApi.SendWidgetLayoutTestNoticeRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (req?.subscriber?.email ?? ""),
          name: req?.subscriber?.name,
          phone: (req?.subscriber?.phone ?? ""),
          preferredChannel: (req?.subscriber?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<webbffWidgetLayoutNotificationServiceApi.SendWidgetLayoutTestNoticeRequest, webbffWidgetLayoutNotificationServiceApi.SendWidgetLayoutTestNoticeResponse> =
      (input, done) => this.webbffWidgetLayoutNotificationClient.sendWidgetLayoutTestNotice(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("StreamPageCompositionUpdates.SendWidgetLayoutTestNotice", () => call<webbffWidgetLayoutNotificationServiceApi.SendWidgetLayoutTestNoticeRequest, webbffWidgetLayoutNotificationServiceApi.SendWidgetLayoutTestNoticeResponse>(invoke1, request1));
    const request2 = webbffClientSessionNotificationServiceApi.SendClientSessionTestNoticeRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (reply1?.widgetLayout?.manager?.email ?? ""),
          phone: (req?.subscriber?.phone ?? ""),
          preferredChannel: (req?.subscriber?.preferredChannel ?? ""),
        },
      },
    });
    const invoke2: Unary<webbffClientSessionNotificationServiceApi.SendClientSessionTestNoticeRequest, webbffClientSessionNotificationServiceApi.SendClientSessionTestNoticeResponse> =
      (input, done) => this.webbffClientSessionNotificationClient.sendClientSessionTestNotice(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = webbffPageCompositionQueryServiceApi.FindPageCompositionsRequest.fromPartial({
      context: req?.context,
      filter: {
        query: (req?.filter?.query ?? ""),
        region: (reply1?.widgetLayout?.location?.region ?? ""),
      },
    });
    const reply3 = await this.workQueue.enqueue<webbffPageCompositionQueryServiceApi.FindPageCompositionsRequest, webbffPageCompositionQueryServiceApi.FindPageCompositionsResponse>(
      "acme.webbff.v1.PageCompositionGatewayService/StreamPageCompositionUpdates:2", request3,
    );
    const request4 = communityBadgeWorkflowServiceApi.AdvanceBadgeWorkflowRequest.fromPartial({
      badge: {
        audit: { etag: (reply2?.clientSession?.audit?.etag ?? "") },
        owner: { email: (reply1?.widgetLayout?.manager?.email ?? "") },
      },
      context: req?.context,
    });
    const invoke4: Unary<communityBadgeWorkflowServiceApi.AdvanceBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.AdvanceBadgeWorkflowResponse> =
      (input, done) => this.communityBadgeWorkflowClient.advanceBadgeWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await inRequest(req.context!, () => call<communityBadgeWorkflowServiceApi.AdvanceBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.AdvanceBadgeWorkflowResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.filter?.ownerId ?? "") });
    return mergeResponses(
      webbffPageCompositionGatewayServiceApi.StreamPageCompositionUpdatesResponse.fromPartial({
        pageComposition: {
          billingAddress: { recipient: (reply1?.widgetLayout?.location?.recipient ?? "") },
        },
        result: { status: (reply1?.outcome?.status ?? "") },
      }),
      webbffPageCompositionGatewayServiceApi.StreamPageCompositionUpdatesResponse.fromPartial({
        pageComposition: { audit: { createdBy: (reply2?.clientSession?.audit?.createdBy ?? "") } },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      webbffPageCompositionGatewayServiceApi.StreamPageCompositionUpdatesResponse.fromPartial({
        result: {
          details: (reply3?.result?.details ?? {}),
          message: (reply3?.result?.message ?? ""),
        },
      }),
      webbffPageCompositionGatewayServiceApi.StreamPageCompositionUpdatesResponse.fromPartial({
        pageComposition: { audit: { createdBy: (reply4?.badge?.audit?.createdBy ?? "") } },
      }),
      webbffPageCompositionGatewayServiceApi.StreamPageCompositionUpdatesResponse.fromPartial({
        pageComposition: { billingAddress: { region: (req?.filter?.region ?? "") } },
      }),
    );
  }

  /**
   * Submits a page composition.
   */
  async submitPageCompositionForm(req: webbffPageCompositionGatewayServiceApi.SubmitPageCompositionFormRequest): Promise<webbffPageCompositionGatewayServiceApi.SubmitPageCompositionFormResponse> {
    validateContext(req.context);
    if (req.pageComposition) {
      await this.repository.save(toPageCompositionRecord(req.context.tenantId, req.pageComposition));
    }
    await this.repository.record(req.context.tenantId, "SubmitPageCompositionForm", req);
    this.logger.info("submit_page_composition_form", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = patientappPatientHomeServiceApi.UpdatePatientHomeRequest.fromPartial({
      context: req?.context,
      patientHome: {
        audit: {
          updatedAt: req?.pageComposition?.audit?.updatedAt,
          updatedBy: (req?.pageComposition?.audit?.updatedBy ?? ""),
        },
        comments: [{ createdAt: req?.pageComposition?.audit?.createdAt }],
      },
    });
    const invoke1: Unary<patientappPatientHomeServiceApi.UpdatePatientHomeRequest, patientappPatientHomeServiceApi.UpdatePatientHomeResponse> =
      (input, done) => this.patientappPatientHomeClient.updatePatientHome(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<patientappPatientHomeServiceApi.UpdatePatientHomeResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = webbffClientSessionNotificationServiceApi.ListClientSessionSubscriptionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.pageComposition?.audit?.updatedAt,
        ownerId: (reply1?.patientHome?.assignee?.userId ?? ""),
        region: (req?.pageComposition?.billingAddress?.region ?? ""),
      },
    });
    const invoke2: Unary<webbffClientSessionNotificationServiceApi.ListClientSessionSubscriptionsRequest, webbffClientSessionNotificationServiceApi.ListClientSessionSubscriptionsResponse> =
      (input, done) => this.webbffClientSessionNotificationClient.listClientSessionSubscriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webbffPageCompositionGatewayServiceApi.SubmitPageCompositionFormResponse.fromPartial({
        pageComposition: {
          audit: {
            createdAt: reply1?.patientHome?.audit?.createdAt,
            updatedAt: reply1?.patientHome?.audit?.updatedAt,
          },
        },
      }),
      webbffPageCompositionGatewayServiceApi.SubmitPageCompositionFormResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      webbffPageCompositionGatewayServiceApi.SubmitPageCompositionFormResponse.fromPartial({
        pageComposition: {
          pageCompositionId: (req?.pageCompositionId ?? ""),
          total: req?.pageComposition?.total,
        },
      }),
    );
  }

  /**
   * Tracks a page composition.
   */
  async trackPageComposition(req: webbffPageCompositionGatewayServiceApi.TrackPageCompositionRequest): Promise<webbffPageCompositionGatewayServiceApi.TrackPageCompositionResponse> {
    validateContext(req.context);
    if (req.pageComposition) {
      await this.repository.save(toPageCompositionRecord(req.context.tenantId, req.pageComposition));
    }
    await this.repository.record(req.context.tenantId, "TrackPageComposition", req);
    this.logger.info("track_page_composition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = auditAuditEventValidationServiceApi.NormalizeAuditEventRequest.fromPartial({
      auditEvent: {
        subject: {
          displayName: (req?.pageComposition?.counterparty?.displayName ?? ""),
          number: (req?.pageComposition?.number ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke1: Unary<auditAuditEventValidationServiceApi.NormalizeAuditEventRequest, auditAuditEventValidationServiceApi.NormalizeAuditEventResponse> =
      (input, done) => this.auditAuditEventValidationClient.normalizeAuditEvent(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = webbffClientSessionNotificationServiceApi.ListClientSessionSubscriptionsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.pageComposition?.billingAddress?.region ?? "") },
    });
    const method2 = "listClientSessionSubscriptions" as const;
    const invoke2: Unary<webbffClientSessionNotificationServiceApi.ListClientSessionSubscriptionsRequest, webbffClientSessionNotificationServiceApi.ListClientSessionSubscriptionsResponse> =
      (input, done) => this.webbffClientSessionNotificationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webbffClientSessionNotificationServiceApi.ListClientSessionSubscriptionsRequest, webbffClientSessionNotificationServiceApi.ListClientSessionSubscriptionsResponse>(invoke2, request2);
    const request3 = notificationsSubscriptionNotificationServiceApi.ListSubscriptionSubscriptionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.pageComposition?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply2?.result?.details ?? {}))),
        ownerId: (req?.details?.sessionId ?? ""),
        region: (req?.pageComposition?.billingAddress?.region ?? ""),
      },
    });
    const proxy3 = forwarding(this.notificationsSubscriptionNotificationClient);
    const invoke3: Unary<notificationsSubscriptionNotificationServiceApi.ListSubscriptionSubscriptionsRequest, notificationsSubscriptionNotificationServiceApi.ListSubscriptionSubscriptionsResponse> =
      (input, done) => proxy3.listSubscriptionSubscriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsSubscriptionNotificationServiceApi.ListSubscriptionSubscriptionsRequest, notificationsSubscriptionNotificationServiceApi.ListSubscriptionSubscriptionsResponse>(invoke3, request3);
    const request4 = webbffWidgetLayoutServiceApi.CloneWidgetLayoutRequest.fromPartial({
      context: req?.context,
      widgetLayout: {
        children: [{
          children: [{
            audit: {
              etag: (req?.pageComposition?.audit?.etag ?? ""),
              updatedAt: req?.pageComposition?.audit?.updatedAt,
            },
            location: {
              locality: (req?.pageComposition?.billingAddress?.locality ?? ""),
              region: (req?.pageComposition?.billingAddress?.region ?? ""),
            },
          }],
        }],
      },
    });
    const invoke4: Unary<webbffWidgetLayoutServiceApi.CloneWidgetLayoutRequest, webbffWidgetLayoutServiceApi.CloneWidgetLayoutResponse> =
      (input, done) => this.webbffWidgetLayoutClient.cloneWidgetLayout(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<webbffWidgetLayoutServiceApi.CloneWidgetLayoutRequest, webbffWidgetLayoutServiceApi.CloneWidgetLayoutResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webbffPageCompositionGatewayServiceApi.TrackPageCompositionResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      webbffPageCompositionGatewayServiceApi.TrackPageCompositionResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      webbffPageCompositionGatewayServiceApi.TrackPageCompositionResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          referenceIds: (reply3?.result?.referenceIds ?? []),
        },
      }),
      webbffPageCompositionGatewayServiceApi.TrackPageCompositionResponse.fromPartial({
        pageComposition: {
          counterparty: { widgetLayoutId: (reply4?.widgetLayout?.widgetLayoutId ?? "") },
        },
      }),
      webbffPageCompositionGatewayServiceApi.TrackPageCompositionResponse.fromPartial({
        pageComposition: {
          metadata: (req?.pageComposition?.metadata ?? {}),
          pageCompositionId: (req?.pageCompositionId ?? ""),
        },
      }),
    );
  }

  /**
   * Takes a stream of page compositions and answers once at the end.
   */
  async uploadPageCompositionAttachments(req: webbffPageCompositionGatewayServiceApi.UploadPageCompositionAttachmentsRequest): Promise<webbffPageCompositionGatewayServiceApi.UploadPageCompositionAttachmentsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "UploadPageCompositionAttachments", req);
    this.logger.info("upload_page_composition_attachments", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        subject: {
          displayName: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.counterparty?.displayName ?? ""),
        },
      },
      details: {
        notify: {
          email: ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.email ?? ""),
          name: (req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.name,
        },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowResponse> =
      (input, done) => this.notificationsDeliveryAttemptWorkflowClient.pauseDeliveryAttemptWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = edgegatewayRouteBindingQueryServiceApi.SummarizeRouteBindingsRequest.fromPartial({
      context: input2?.context,
      details: {
        filters: Object.fromEntries(Object.entries((reply1?.deliveryAttempt?.attributes ?? {}))),
        format: ((input2?.chunk?.$case === "header" ? input2?.chunk.header : undefined)?.format ?? ""),
      },
    });
    const invoke2: Unary<edgegatewayRouteBindingQueryServiceApi.SummarizeRouteBindingsRequest, edgegatewayRouteBindingQueryServiceApi.SummarizeRouteBindingsResponse> =
      (input, done) => this.edgegatewayRouteBindingQueryClient.summarizeRouteBindings(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<edgegatewayRouteBindingQueryServiceApi.SummarizeRouteBindingsRequest, edgegatewayRouteBindingQueryServiceApi.SummarizeRouteBindingsResponse>(invoke2, request2);
    let selected3_2: googleTimestampApi.Timestamp | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected3_2 = (req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.createdAt;
        break;
      default:
        selected3_2 = undefined;
    }
    const request3 = webbffClientSessionIntegrationServiceApi.ConnectClientSessionSourceRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((reply2?.result?.details ?? {}))),
      context: req?.context,
      details: {
        messageId: (reply2?.result?.message ?? ""),
        receivedAt: selected3_2,
      },
    });
    const invoke3: Unary<webbffClientSessionIntegrationServiceApi.ConnectClientSessionSourceRequest, webbffClientSessionIntegrationServiceApi.ConnectClientSessionSourceResponse> =
      (input, done) => this.webbffClientSessionIntegrationClient.connectClientSessionSource(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<webbffClientSessionIntegrationServiceApi.ConnectClientSessionSourceRequest, webbffClientSessionIntegrationServiceApi.ConnectClientSessionSourceResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.etag ?? "") });
    return mergeResponses(
      webbffPageCompositionGatewayServiceApi.UploadPageCompositionAttachmentsResponse.fromPartial({
        result: {
          message: (reply1?.outcome?.message ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      webbffPageCompositionGatewayServiceApi.UploadPageCompositionAttachmentsResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      webbffPageCompositionGatewayServiceApi.UploadPageCompositionAttachmentsResponse.fromPartial({
        result: {
          message: (reply3?.outcome?.message ?? ""),
          status: (reply3?.outcome?.status ?? ""),
        },
      }),
    );
  }
}
