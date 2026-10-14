/**
 * Connects external systems that send client session events. Remote work stays behind typed client ports.
 */

import * as commonContactApi from "../../../../../.cache/proto/acme/common/v1/contact.js";
import * as communityForumWorkflowServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_workflow_service.js";
import * as experimentsExperimentReportingServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_reporting_service.js";
import * as fanportalFanSessionQueryServiceApi from "../../../../../.cache/proto/acme/fanportal/v1/fan_session_query_service.js";
import * as notificationsSubscriptionExportServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_export_service.js";
import * as webbffClientSessionIntegrationServiceApi from "../../../../../.cache/proto/acme/webbff/v1/client_session_integration_service.js";
import * as webbffPageCompositionNotificationServiceApi from "../../../../../.cache/proto/acme/webbff/v1/page_composition_notification_service.js";
import * as webbffWidgetLayoutIntegrationServiceApi from "../../../../../.cache/proto/acme/webbff/v1/widget_layout_integration_service.js";
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
import { collect, upload } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { WebbffRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate client session operations and persist audit data.
 */
@injectable()
export class ClientSessionIntegrationWorkflow {
  constructor(
    @inject(WebbffRepository) private readonly repository: WebbffRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ForumWorkflowService") private readonly communityForumWorkflowClient: communityForumWorkflowServiceApi.ForumWorkflowServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentReportingService") private readonly experimentsExperimentReportingClient: experimentsExperimentReportingServiceApi.ExperimentReportingServiceClient,
    @inject("grpc:acme.fanportal.v1.FanSessionQueryService") private readonly fanportalFanSessionQueryClient: fanportalFanSessionQueryServiceApi.FanSessionQueryServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionExportService") private readonly notificationsSubscriptionExportClient: notificationsSubscriptionExportServiceApi.SubscriptionExportServiceClient,
    @inject("grpc:acme.webbff.v1.PageCompositionNotificationService") private readonly webbffPageCompositionNotificationClient: webbffPageCompositionNotificationServiceApi.PageCompositionNotificationServiceClient,
    @inject("grpc:acme.webbff.v1.WidgetLayoutIntegrationService") private readonly webbffWidgetLayoutIntegrationClient: webbffWidgetLayoutIntegrationServiceApi.WidgetLayoutIntegrationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Acknowledges a client session.
   */
  async acknowledgeClientSessionEvent(req: webbffClientSessionIntegrationServiceApi.AcknowledgeClientSessionEventRequest): Promise<webbffClientSessionIntegrationServiceApi.AcknowledgeClientSessionEventResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "AcknowledgeClientSessionEvent", req);
    this.logger.info("acknowledge_client_session_event", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionRequest.fromPartial({
      context: req?.context,
      details: {
        endpoint: (req?.details?.endpoint ?? ""),
        messageId: (req?.details?.messageId ?? ""),
      },
    });
    const invoke1: Unary<webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionRequest, webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionResponse> =
      (input, done) => this.webbffWidgetLayoutIntegrationClient.testWidgetLayoutConnection(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionRequest, webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { recipient: { email: (reply1?.widgetLayout?.manager?.email ?? "") } },
      reason: (req?.reason ?? ""),
    });
    const invoke2: Unary<webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesRequest, webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesResponse> =
      (input, done) => this.webbffPageCompositionNotificationClient.subscribePageCompositionUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesRequest, webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesResponse>(invoke2, request2));
    const request3 = experimentsExperimentReportingServiceApi.ListExperimentReportsRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply1?.widgetLayout?.location?.region ?? "") },
    });
    const invoke3: Unary<experimentsExperimentReportingServiceApi.ListExperimentReportsRequest, experimentsExperimentReportingServiceApi.ListExperimentReportsResponse> =
      (input, done) => this.experimentsExperimentReportingClient.listExperimentReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await workflow("AcknowledgeClientSessionEvent.ListExperimentReports", () => call<experimentsExperimentReportingServiceApi.ListExperimentReportsRequest, experimentsExperimentReportingServiceApi.ListExperimentReportsResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.details?.sourceSystem ?? "") });
    return mergeResponses(
      webbffClientSessionIntegrationServiceApi.AcknowledgeClientSessionEventResponse.fromPartial({
        clientSession: { audit: { etag: (reply1?.widgetLayout?.audit?.etag ?? "") } },
        outcome: { effectiveAt: reply1?.outcome?.effectiveAt },
      }),
      webbffClientSessionIntegrationServiceApi.AcknowledgeClientSessionEventResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      webbffClientSessionIntegrationServiceApi.AcknowledgeClientSessionEventResponse.fromPartial({ result: { status: (reply3?.result?.status ?? "") } }),
      webbffClientSessionIntegrationServiceApi.AcknowledgeClientSessionEventResponse.fromPartial({ clientSession: { clientSessionId: (req?.clientSessionId ?? "") } }),
    );
  }

  /**
   * Connects a client session.
   */
  async connectClientSessionSource(req: webbffClientSessionIntegrationServiceApi.ConnectClientSessionSourceRequest): Promise<webbffClientSessionIntegrationServiceApi.ConnectClientSessionSourceResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ConnectClientSessionSource", req);
    this.logger.info("connect_client_session_source", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumWorkflowServiceApi.StartForumWorkflowRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{ manager: { email: (req?.context?.actor?.email ?? "") } }],
      },
    });
    const invoke1: Unary<communityForumWorkflowServiceApi.StartForumWorkflowRequest, communityForumWorkflowServiceApi.StartForumWorkflowResponse> =
      (input, done) => this.communityForumWorkflowClient.startForumWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        recipient: { email: (reply1?.forum?.manager?.email ?? "") },
        variables: Object.fromEntries(Object.entries((reply1?.forum?.attributes ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const reply2 = await this.workQueue.enqueue<webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersRequest, webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersResponse>(
      "acme.webbff.v1.ClientSessionIntegrationService/ConnectClientSessionSource:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.details?.sourceSystem ?? "") });
    return mergeResponses(
      webbffClientSessionIntegrationServiceApi.ConnectClientSessionSourceResponse.fromPartial({
        clientSession: {
          assignee: { email: (reply1?.forum?.manager?.email ?? "") },
          audit: { updatedBy: (reply1?.forum?.audit?.updatedBy ?? "") },
        },
      }),
      webbffClientSessionIntegrationServiceApi.ConnectClientSessionSourceResponse.fromPartial({ outcome: { message: (reply2?.outcome?.message ?? "") } }),
      webbffClientSessionIntegrationServiceApi.ConnectClientSessionSourceResponse.fromPartial({ clientSession: { clientSessionId: (req?.clientSessionId ?? "") } }),
    );
  }

  /**
   * Disconnects a client session.
   */
  async disconnectClientSessionSource(req: webbffClientSessionIntegrationServiceApi.DisconnectClientSessionSourceRequest): Promise<webbffClientSessionIntegrationServiceApi.DisconnectClientSessionSourceResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "DisconnectClientSessionSource", req);
    this.logger.info("disconnect_client_session_source", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionRequest.fromPartial({
      context: req?.context,
      details: {
        endpoint: (req?.details?.endpoint ?? ""),
        receivedAt: req?.details?.receivedAt,
        sourceSystem: (req?.details?.sourceSystem ?? ""),
      },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionRequest, webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionResponse> =
      (input, done) => this.webbffWidgetLayoutIntegrationClient.testWidgetLayoutConnection(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionRequest, webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionResponse>(invoke1, request1));
    const request2 = webbffPageCompositionNotificationServiceApi.ListPageCompositionSubscriptionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.widgetLayout?.audit?.updatedAt,
        ownerId: (reply1?.widgetLayout?.manager?.userId ?? ""),
        region: (reply1?.widgetLayout?.location?.region ?? ""),
      },
    });
    const invoke2: Unary<webbffPageCompositionNotificationServiceApi.ListPageCompositionSubscriptionsRequest, webbffPageCompositionNotificationServiceApi.ListPageCompositionSubscriptionsResponse> =
      (input, done) => this.webbffPageCompositionNotificationClient.listPageCompositionSubscriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<webbffPageCompositionNotificationServiceApi.ListPageCompositionSubscriptionsResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersRequest.fromPartial({
      context: req?.context,
      details: { recipient: { email: (reply1?.widgetLayout?.manager?.email ?? "") } },
      reason: (req?.reason ?? ""),
    });
    const invoke3: Unary<webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersRequest, webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersResponse> =
      (input, done) => this.webbffPageCompositionNotificationClient.notifyPageCompositionWatchers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    this.logger.info("local_audit", { value: (req?.details?.messageId ?? "") });
    return mergeResponses(
      webbffClientSessionIntegrationServiceApi.DisconnectClientSessionSourceResponse.fromPartial({
        clientSession: { audit: { createdAt: reply1?.widgetLayout?.audit?.createdAt } },
      }),
      webbffClientSessionIntegrationServiceApi.DisconnectClientSessionSourceResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      webbffClientSessionIntegrationServiceApi.DisconnectClientSessionSourceResponse.fromPartial({ outcome: { status: (reply3?.outcome?.status ?? "") } }),
      webbffClientSessionIntegrationServiceApi.DisconnectClientSessionSourceResponse.fromPartial({ clientSession: { clientSessionId: (req?.clientSessionId ?? "") } }),
    );
  }

  /**
   * Takes a stream of client sessions and answers once at the end.
   */
  async ingestClientSessionEvents(req: webbffClientSessionIntegrationServiceApi.IngestClientSessionEventsRequest): Promise<webbffClientSessionIntegrationServiceApi.IngestClientSessionEventsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "IngestClientSessionEvents", req);
    this.logger.info("ingest_client_session_events", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: commonContactApi.PersonName | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected1_1 = (req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.requester?.name;
        break;
      default:
        selected1_1 = undefined;
    }
    let selected1_2: string | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected1_2 = ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.requester?.preferredChannel ?? "");
        break;
      default:
        selected1_2 = "";
    }
    let selected1_3: string | undefined;
    switch (req?.chunk?.$case) {
      case "header":
        selected1_3 = ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.email ?? "");
        break;
      default:
        selected1_3 = "";
    }
    let selected1_4: string | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected1_4 = ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.requester?.phone ?? "");
        break;
      default:
        selected1_4 = "";
    }
    const request1 = webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (selected1_3 ?? ""),
          name: selected1_1,
          phone: (selected1_4 ?? ""),
          preferredChannel: (selected1_2 ?? ""),
        },
      },
    });
    const invoke1: Unary<webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesRequest, webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesResponse> =
      (input, done) => this.webbffPageCompositionNotificationClient.subscribePageCompositionUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesRequest, webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesResponse>(invoke1, request1);
    const request2 = notificationsSubscriptionExportServiceApi.ListSubscriptionExportsRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply1?.pageComposition?.billingAddress?.region ?? "") },
    });
    const method2 = "listSubscriptionExports" as const;
    const invoke2: Unary<notificationsSubscriptionExportServiceApi.ListSubscriptionExportsRequest, notificationsSubscriptionExportServiceApi.ListSubscriptionExportsResponse> =
      (input, done) => this.notificationsSubscriptionExportClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsSubscriptionExportServiceApi.ListSubscriptionExportsRequest, notificationsSubscriptionExportServiceApi.ListSubscriptionExportsResponse>(invoke2, request2);
    const request3 = webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest.fromPartial({
      context: req?.context,
      widgetLayoutId: (reply1?.pageComposition?.counterparty?.widgetLayoutId ?? ""),
    });
    const proxy3 = forwarding(this.webbffWidgetLayoutIntegrationClient);
    const invoke3: Unary<webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest, webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventResponse> =
      (input, done) => proxy3.acknowledgeWidgetLayoutEvent(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest, webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.etag ?? "") });
    return mergeResponses(
      webbffClientSessionIntegrationServiceApi.IngestClientSessionEventsResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      webbffClientSessionIntegrationServiceApi.IngestClientSessionEventsResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      webbffClientSessionIntegrationServiceApi.IngestClientSessionEventsResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
    );
  }

  /**
   * Lists client sessions a page at a time.
   */
  async listClientSessionSources(req: webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesRequest): Promise<webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListClientSessionSources", req);
    this.logger.info("list_client_session_sources", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesResponse.fromPartial({});
  }

  /**
   * Exchanges changes of client sessions with a peer.
   */
  async relayClientSessionMessages(req: webbffClientSessionIntegrationServiceApi.RelayClientSessionMessagesRequest): Promise<webbffClientSessionIntegrationServiceApi.RelayClientSessionMessagesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "RelayClientSessionMessages", req);
    this.logger.info("relay_client_session_messages", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.frame?.$case) {
      case "change":
        selected1_1 = (((choice) => choice?.$case === "customer" ? choice.customer : undefined)((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.origin)?.widgetLayoutId ?? "");
        break;
      default:
        selected1_1 = "";
    }
    let selected1_2: googleTimestampApi.Timestamp | undefined;
    switch (req?.frame?.$case) {
      case "change":
        selected1_2 = (req?.frame?.$case === "change" ? req?.frame.change : undefined)?.sla?.dueAt;
        break;
      default:
        selected1_2 = undefined;
    }
    let selected1_3: string | undefined;
    switch (req?.frame?.$case) {
      case "change":
        selected1_3 = ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.sla?.policyId ?? "");
        break;
      default:
        selected1_3 = "";
    }
    let selected1_4: Record<string, string> | undefined;
    switch (req?.frame?.$case) {
      case "change":
        selected1_4 = ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.customFields ?? {});
        break;
      default:
        selected1_4 = {};
    }
    const request1 = webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionRequest.fromPartial({
      annotations: (selected1_4 ?? {}),
      context: req?.context,
      details: {
        messageId: (selected1_3 ?? ""),
        receivedAt: selected1_2,
      },
      widgetLayoutId: (selected1_1 ?? ""),
    });
    const invoke1: Unary<webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionRequest, webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionResponse> =
      (input, done) => this.webbffWidgetLayoutIntegrationClient.testWidgetLayoutConnection(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionRequest, webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionResponse>(invoke1, request1);
    const request2 = webbffWidgetLayoutIntegrationServiceApi.IngestWidgetLayoutEventsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "record", record: {
        children: [{
          children: [{
            audit: { updatedBy: (reply1?.widgetLayout?.audit?.updatedBy ?? "") },
            manager: {
              email: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.requester?.email ?? ""),
            },
          }],
          location: { region: (reply1?.widgetLayout?.location?.region ?? "") },
        }],
      } },
    });
    const reply2 = await upload<webbffWidgetLayoutIntegrationServiceApi.IngestWidgetLayoutEventsRequest, webbffWidgetLayoutIntegrationServiceApi.IngestWidgetLayoutEventsResponse>(
      (done) => this.webbffWidgetLayoutIntegrationClient.ingestWidgetLayoutEvents(metadataFor(request2.context), { deadline: Date.now() + 15_000 }, done), [request2],
    );
    const request3 = webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesRequest.fromPartial({
      context: req?.context,
      details: {
        channel: (((choice) => choice?.$case === "channel" ? choice.channel : undefined)((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.origin)?.channel ?? ""),
        recipient: {
          email: (reply1?.widgetLayout?.manager?.email ?? ""),
          name: (req?.frame?.$case === "change" ? req?.frame.change : undefined)?.requester?.name,
          phone: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.requester?.phone ?? ""),
        },
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesRequest, webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesResponse> =
      (input, done) => this.webbffPageCompositionNotificationClient.unsubscribePageCompositionUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesRequest, webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.cursor ?? "") });
    return mergeResponses(
      webbffClientSessionIntegrationServiceApi.RelayClientSessionMessagesResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          message: (reply1?.outcome?.message ?? ""),
        },
      }),
      webbffClientSessionIntegrationServiceApi.RelayClientSessionMessagesResponse.fromPartial({
        clientSession: { audit: { etag: (reply3?.pageComposition?.audit?.etag ?? "") } },
      }),
      webbffClientSessionIntegrationServiceApi.RelayClientSessionMessagesResponse.fromPartial({
        clientSession: {
          clientSessionId: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.clientSessionId ?? ""),
          priority: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Replays a client session.
   */
  async replayClientSessionEvents(req: webbffClientSessionIntegrationServiceApi.ReplayClientSessionEventsRequest): Promise<webbffClientSessionIntegrationServiceApi.ReplayClientSessionEventsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ReplayClientSessionEvents", req);
    this.logger.info("replay_client_session_events", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentReportingServiceApi.StreamExperimentMetricsRequest.fromPartial({
      context: req?.context,
      filter: { ownerId: (req?.details?.messageId ?? "") },
      since: req?.details?.receivedAt,
      subscriber: { email: (req?.context?.actor?.email ?? "") },
    });
    const stream1 = this.experimentsExperimentReportingClient.streamExperimentMetrics(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? experimentsExperimentReportingServiceApi.StreamExperimentMetricsResponse.fromPartial({});
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesRequest.fromPartial({
      context: input2?.context,
      reason: (input2?.reason ?? ""),
    });
    const invoke2: Unary<webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesRequest, webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesResponse> =
      (input, done) => this.webbffPageCompositionNotificationClient.subscribePageCompositionUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesRequest, webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesResponse>(invoke2, request2);
    const request3 = fanportalFanSessionQueryServiceApi.BrowseFanSessionsRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply2?.pageComposition?.billingAddress?.region ?? "") },
    });
    const cloned3: fanportalFanSessionQueryServiceApi.BrowseFanSessionsRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<fanportalFanSessionQueryServiceApi.BrowseFanSessionsRequest, fanportalFanSessionQueryServiceApi.BrowseFanSessionsResponse> =
      (input, done) => this.fanportalFanSessionQueryClient.browseFanSessions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<fanportalFanSessionQueryServiceApi.BrowseFanSessionsRequest, fanportalFanSessionQueryServiceApi.BrowseFanSessionsResponse>(invoke3, cloned3);
    this.logger.info("local_audit", { value: (req?.details?.sourceSystem ?? "") });
    return mergeResponses(
      webbffClientSessionIntegrationServiceApi.ReplayClientSessionEventsResponse.fromPartial({
        clientSession: { audit: { createdAt: reply2?.pageComposition?.audit?.createdAt } },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      webbffClientSessionIntegrationServiceApi.ReplayClientSessionEventsResponse.fromPartial({
        outcome: {
          message: (reply3?.result?.message ?? ""),
          status: (reply3?.result?.status ?? ""),
        },
      }),
      webbffClientSessionIntegrationServiceApi.ReplayClientSessionEventsResponse.fromPartial({ clientSession: { clientSessionId: (req?.clientSessionId ?? "") } }),
    );
  }

  /**
   * Tests a client session.
   */
  async testClientSessionConnection(req: webbffClientSessionIntegrationServiceApi.TestClientSessionConnectionRequest): Promise<webbffClientSessionIntegrationServiceApi.TestClientSessionConnectionResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "TestClientSessionConnection", req);
    this.logger.info("test_client_session_connection", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffPageCompositionNotificationServiceApi.StreamPageCompositionNoticesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.receivedAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.details?.messageId ?? ""),
      },
      subscriber: { email: (req?.context?.actor?.email ?? "") },
    });
    const stream1 = this.webbffPageCompositionNotificationClient.streamPageCompositionNotices(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? webbffPageCompositionNotificationServiceApi.StreamPageCompositionNoticesResponse.fromPartial({});
    const request2 = webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const decoded2 = webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersRequest.fromJSON(
      JSON.parse(JSON.stringify(webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersRequest.toJSON(request2))),
    );
    const invoke2: Unary<webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersRequest, webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersResponse> =
      (input, done) => this.webbffPageCompositionNotificationClient.notifyPageCompositionWatchers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersRequest, webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.details?.sourceSystem ?? "") });
    return mergeResponses(
      webbffClientSessionIntegrationServiceApi.TestClientSessionConnectionResponse.fromPartial({
        clientSession: {
          audit: { updatedBy: (reply2?.pageComposition?.audit?.updatedBy ?? "") },
        },
        outcome: { effectiveAt: reply2?.outcome?.effectiveAt },
      }),
      webbffClientSessionIntegrationServiceApi.TestClientSessionConnectionResponse.fromPartial({ clientSession: { clientSessionId: (req?.clientSessionId ?? "") } }),
    );
  }
}
