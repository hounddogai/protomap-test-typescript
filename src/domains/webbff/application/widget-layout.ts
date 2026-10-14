/**
 * Manages widget layouts: creates, reads, changes, and lists them. Remote work stays behind typed client ports.
 */

import * as audiencesAudienceMemberWorkflowServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_member_workflow_service.js";
import * as communityBadgeWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/badge_workflow_service.js";
import * as fanportalFanSessionServiceApi from "../../../../.cache/proto/acme/fanportal/v1/fan_session_service.js";
import * as localizationTranslationKeyWorkflowServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_workflow_service.js";
import * as messagingChannelSyncServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_sync_service.js";
import * as patientappPatientHomeQueryServiceApi from "../../../../.cache/proto/acme/patientapp/v1/patient_home_query_service.js";
import * as webbffClientSessionIntegrationServiceApi from "../../../../.cache/proto/acme/webbff/v1/client_session_integration_service.js";
import * as webbffClientSessionQueryServiceApi from "../../../../.cache/proto/acme/webbff/v1/client_session_query_service.js";
import * as webbffWidgetLayoutIntegrationServiceApi from "../../../../.cache/proto/acme/webbff/v1/widget_layout_integration_service.js";
import * as webbffWidgetLayoutNotificationServiceApi from "../../../../.cache/proto/acme/webbff/v1/widget_layout_notification_service.js";
import * as webbffWidgetLayoutQueryServiceApi from "../../../../.cache/proto/acme/webbff/v1/widget_layout_query_service.js";
import * as webbffWidgetLayoutServiceApi from "../../../../.cache/proto/acme/webbff/v1/widget_layout_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
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
import { collect, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toWidgetLayoutRecord } from "../data/records.js";
import { WebbffRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate widget layout operations and persist audit data.
 */
@injectable()
export class WidgetLayoutWorkflow {
  constructor(
    @inject(WebbffRepository) private readonly repository: WebbffRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceMemberWorkflowService") private readonly audiencesAudienceMemberWorkflowClient: audiencesAudienceMemberWorkflowServiceApi.AudienceMemberWorkflowServiceClient,
    @inject("grpc:acme.community.v1.BadgeWorkflowService") private readonly communityBadgeWorkflowClient: communityBadgeWorkflowServiceApi.BadgeWorkflowServiceClient,
    @inject("grpc:acme.fanportal.v1.FanSessionService") private readonly fanportalFanSessionClient: fanportalFanSessionServiceApi.FanSessionServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyWorkflowService") private readonly localizationTranslationKeyWorkflowClient: localizationTranslationKeyWorkflowServiceApi.TranslationKeyWorkflowServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelSyncService") private readonly messagingChannelSyncClient: messagingChannelSyncServiceApi.ChannelSyncServiceClient,
    @inject("grpc:acme.patientapp.v1.PatientHomeQueryService") private readonly patientappPatientHomeQueryClient: patientappPatientHomeQueryServiceApi.PatientHomeQueryServiceClient,
    @inject("grpc:acme.webbff.v1.ClientSessionIntegrationService") private readonly webbffClientSessionIntegrationClient: webbffClientSessionIntegrationServiceApi.ClientSessionIntegrationServiceClient,
    @inject("grpc:acme.webbff.v1.ClientSessionQueryService") private readonly webbffClientSessionQueryClient: webbffClientSessionQueryServiceApi.ClientSessionQueryServiceClient,
    @inject("grpc:acme.webbff.v1.WidgetLayoutIntegrationService") private readonly webbffWidgetLayoutIntegrationClient: webbffWidgetLayoutIntegrationServiceApi.WidgetLayoutIntegrationServiceClient,
    @inject("grpc:acme.webbff.v1.WidgetLayoutNotificationService") private readonly webbffWidgetLayoutNotificationClient: webbffWidgetLayoutNotificationServiceApi.WidgetLayoutNotificationServiceClient,
    @inject("grpc:acme.webbff.v1.WidgetLayoutQueryService") private readonly webbffWidgetLayoutQueryClient: webbffWidgetLayoutQueryServiceApi.WidgetLayoutQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Creates a widget layout.
   */
  async cloneWidgetLayout(req: webbffWidgetLayoutServiceApi.CloneWidgetLayoutRequest): Promise<webbffWidgetLayoutServiceApi.CloneWidgetLayoutResponse> {
    validateContext(req.context);
    if (req.widgetLayout) {
      await this.repository.save(toWidgetLayoutRecord(req.context.tenantId, req.widgetLayout));
    }
    await this.repository.record(req.context.tenantId, "CloneWidgetLayout", req);
    this.logger.info("clone_widget_layout", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest.fromPartial({
      context: req?.context,
      details: { receivedAt: req?.widgetLayout?.audit?.updatedAt },
      widgetLayoutId: (req?.widgetLayout?.widgetLayoutId ?? ""),
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest, webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventResponse> =
      (input, done) => this.webbffWidgetLayoutIntegrationClient.acknowledgeWidgetLayoutEvent(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest, webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = audiencesAudienceMemberWorkflowServiceApi.CancelAudienceMemberWorkflowRequest.fromPartial({
      audienceMember: {
        audit: {
          createdBy: (input2?.widgetLayout?.audit?.createdBy ?? ""),
          etag: (reply1?.widgetLayout?.audit?.etag ?? ""),
        },
        primaryAddress: { locality: (reply1?.widgetLayout?.location?.locality ?? "") },
      },
      context: input2?.context,
    });
    const invoke2: Unary<audiencesAudienceMemberWorkflowServiceApi.CancelAudienceMemberWorkflowRequest, audiencesAudienceMemberWorkflowServiceApi.CancelAudienceMemberWorkflowResponse> =
      (input, done) => this.audiencesAudienceMemberWorkflowClient.cancelAudienceMemberWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceMemberWorkflowServiceApi.CancelAudienceMemberWorkflowRequest, audiencesAudienceMemberWorkflowServiceApi.CancelAudienceMemberWorkflowResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      webbffWidgetLayoutServiceApi.CloneWidgetLayoutResponse.fromPartial({
        widgetLayout: {
          children: [{
            audit: { createdBy: (reply1?.widgetLayout?.audit?.createdBy ?? "") },
            location: { recipient: (reply1?.widgetLayout?.location?.recipient ?? "") },
          }],
        },
      }),
      webbffWidgetLayoutServiceApi.CloneWidgetLayoutResponse.fromPartial({
        widgetLayout: {
          children: [{
            children: [{
              location: { recipient: (reply2?.audienceMember?.primaryAddress?.recipient ?? "") },
            }],
            location: {
              postalCode: (reply2?.audienceMember?.primaryAddress?.postalCode ?? ""),
            },
          }],
        },
      }),
      webbffWidgetLayoutServiceApi.CloneWidgetLayoutResponse.fromPartial({
        widgetLayout: {
          depth: (req?.widgetLayout?.depth ?? 0),
          name: (req?.widgetLayout?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Creates a widget layout.
   */
  async createWidgetLayout(req: webbffWidgetLayoutServiceApi.CreateWidgetLayoutRequest): Promise<webbffWidgetLayoutServiceApi.CreateWidgetLayoutResponse> {
    validateContext(req.context);
    if (req.widgetLayout) {
      await this.repository.save(toWidgetLayoutRecord(req.context.tenantId, req.widgetLayout));
    }
    await this.repository.record(req.context.tenantId, "CreateWidgetLayout", req);
    this.logger.info("create_widget_layout", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffClientSessionIntegrationServiceApi.ReplayClientSessionEventsRequest.fromPartial({
      context: req?.context,
      details: { messageId: (req?.widgetLayout?.manager?.userId ?? "") },
    });
    const cloned1: webbffClientSessionIntegrationServiceApi.ReplayClientSessionEventsRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<webbffClientSessionIntegrationServiceApi.ReplayClientSessionEventsRequest, webbffClientSessionIntegrationServiceApi.ReplayClientSessionEventsResponse> =
      (input, done) => this.webbffClientSessionIntegrationClient.replayClientSessionEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webbffClientSessionIntegrationServiceApi.ReplayClientSessionEventsRequest, webbffClientSessionIntegrationServiceApi.ReplayClientSessionEventsResponse>(invoke1, cloned1);
    const request2 = webbffWidgetLayoutNotificationServiceApi.UnsubscribeWidgetLayoutUpdatesRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (reply1?.clientSession?.assignee?.email ?? ""),
          name: reply1?.clientSession?.requester?.name,
          phone: (reply1?.clientSession?.requester?.phone ?? ""),
          preferredChannel: (reply1?.clientSession?.requester?.preferredChannel ?? ""),
        },
      },
    });
    const decoded2 = webbffWidgetLayoutNotificationServiceApi.UnsubscribeWidgetLayoutUpdatesRequest.fromJSON(
      JSON.parse(JSON.stringify(webbffWidgetLayoutNotificationServiceApi.UnsubscribeWidgetLayoutUpdatesRequest.toJSON(request2))),
    );
    const invoke2: Unary<webbffWidgetLayoutNotificationServiceApi.UnsubscribeWidgetLayoutUpdatesRequest, webbffWidgetLayoutNotificationServiceApi.UnsubscribeWidgetLayoutUpdatesResponse> =
      (input, done) => this.webbffWidgetLayoutNotificationClient.unsubscribeWidgetLayoutUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webbffWidgetLayoutNotificationServiceApi.UnsubscribeWidgetLayoutUpdatesRequest, webbffWidgetLayoutNotificationServiceApi.UnsubscribeWidgetLayoutUpdatesResponse>(invoke2, decoded2);
    const request3 = fanportalFanSessionServiceApi.CreateFanSessionRequest.fromPartial({
      context: req?.context,
      fanSession: {
        assignee: {
          displayName: ((reply1?.clientSession?.origin?.$case === "customer" ? reply1?.clientSession?.origin.customer : undefined)?.displayName ?? ""),
          email: (reply1?.clientSession?.requester?.email ?? ""),
        },
      },
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.fanportal.v1.CreateFanSessionRequest",
      value: Buffer.from(fanportalFanSessionServiceApi.CreateFanSessionRequest.encode(request3).finish()),
    });
    const unpacked3 = fanportalFanSessionServiceApi.CreateFanSessionRequest.decode(envelope3.value);
    const invoke3: Unary<fanportalFanSessionServiceApi.CreateFanSessionRequest, fanportalFanSessionServiceApi.CreateFanSessionResponse> =
      (input, done) => this.fanportalFanSessionClient.createFanSession(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<fanportalFanSessionServiceApi.CreateFanSessionRequest, fanportalFanSessionServiceApi.CreateFanSessionResponse>(invoke3, unpacked3);
    const request4 = webbffClientSessionQueryServiceApi.SuggestClientSessionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.widgetLayout?.audit?.updatedAt,
        region: (reply2?.widgetLayout?.location?.region ?? ""),
      },
    });
    const client4 = this.clients.get<webbffClientSessionQueryServiceApi.ClientSessionQueryServiceClient>("acme.webbff.v1.ClientSessionQueryService");
    const invoke4: Unary<webbffClientSessionQueryServiceApi.SuggestClientSessionsRequest, webbffClientSessionQueryServiceApi.SuggestClientSessionsResponse> =
      (input, done) => client4.suggestClientSessions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<webbffClientSessionQueryServiceApi.SuggestClientSessionsRequest, webbffClientSessionQueryServiceApi.SuggestClientSessionsResponse>(invoke4, request4);
    const request5 = messagingChannelSyncServiceApi.StreamChannelChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        locator: { $case: "address", address: req?.widgetLayout?.location },
        name: (req?.widgetLayout?.name ?? ""),
        specs: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      } },
      context: req?.context,
    });
    const stream5 = this.messagingChannelSyncClient.streamChannelChanges(metadataFor(request5.context), { deadline: Date.now() + 15_000 });
    const reading5 = collect(stream5);
    const writing5 = (async () => {
      await write(stream5, request5);
      stream5.end();
    })();
    const [messages5] = await Promise.all([reading5, writing5]);
    const reply5 = messages5.at(-1) ?? messagingChannelSyncServiceApi.StreamChannelChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      webbffWidgetLayoutServiceApi.CreateWidgetLayoutResponse.fromPartial({
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
        widgetLayout: {
          children: [{ audit: { updatedBy: (reply1?.clientSession?.audit?.updatedBy ?? "") } }],
        },
      }),
      webbffWidgetLayoutServiceApi.CreateWidgetLayoutResponse.fromPartial({
        widgetLayout: {
          children: [{
            children: [{ location: { region: (reply2?.widgetLayout?.location?.region ?? "") } }],
          }],
          manager: { email: (reply2?.widgetLayout?.manager?.email ?? "") },
        },
      }),
      webbffWidgetLayoutServiceApi.CreateWidgetLayoutResponse.fromPartial({
        widgetLayout: {
          children: [{
            children: [{ manager: { email: (reply3?.fanSession?.assignee?.email ?? "") } }],
            manager: { email: (reply3?.fanSession?.assignee?.email ?? "") },
          }],
        },
      }),
      webbffWidgetLayoutServiceApi.CreateWidgetLayoutResponse.fromPartial({ result: { referenceIds: (reply4?.result?.referenceIds ?? []) } }),
      webbffWidgetLayoutServiceApi.CreateWidgetLayoutResponse.fromPartial({
        widgetLayout: {
          attributes: (req?.widgetLayout?.attributes ?? {}),
          status: req?.widgetLayout?.status,
        },
      }),
    );
  }

  /**
   * Returns a widget layout.
   */
  async getWidgetLayout(req: webbffWidgetLayoutServiceApi.GetWidgetLayoutRequest): Promise<webbffWidgetLayoutServiceApi.GetWidgetLayoutResponse> {
    validateContext(req.context);
    if (!req.widgetLayoutId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "widget_layout_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetWidgetLayout", req);
    this.logger.info("get_widget_layout", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = patientappPatientHomeQueryServiceApi.CountPatientHomesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        ownerId: (req?.widgetLayoutId ?? ""),
      },
    });
    const invoke1: Unary<patientappPatientHomeQueryServiceApi.CountPatientHomesRequest, patientappPatientHomeQueryServiceApi.CountPatientHomesResponse> =
      (input, done) => this.patientappPatientHomeQueryClient.countPatientHomes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<patientappPatientHomeQueryServiceApi.CountPatientHomesRequest, patientappPatientHomeQueryServiceApi.CountPatientHomesResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    return mergeResponses(
      webbffWidgetLayoutServiceApi.GetWidgetLayoutResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      webbffWidgetLayoutServiceApi.GetWidgetLayoutResponse.fromPartial({ widgetLayout: { widgetLayoutId: (req?.widgetLayoutId ?? "") } }),
    );
  }

  /**
   * Lists widget layouts a page at a time.
   */
  async listWidgetLayouts(req: webbffWidgetLayoutServiceApi.ListWidgetLayoutsRequest): Promise<webbffWidgetLayoutServiceApi.ListWidgetLayoutsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListWidgetLayouts", req);
    this.logger.info("list_widget_layouts", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffWidgetLayoutNotificationServiceApi.ListWidgetLayoutSubscriptionsRequest.fromPartial({
      context: req?.context,
      filter: { ownerId: (req?.filter?.ownerId ?? "") },
    });
    const invoke1: Unary<webbffWidgetLayoutNotificationServiceApi.ListWidgetLayoutSubscriptionsRequest, webbffWidgetLayoutNotificationServiceApi.ListWidgetLayoutSubscriptionsResponse> =
      (input, done) => this.webbffWidgetLayoutNotificationClient.listWidgetLayoutSubscriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<webbffWidgetLayoutNotificationServiceApi.ListWidgetLayoutSubscriptionsRequest, webbffWidgetLayoutNotificationServiceApi.ListWidgetLayoutSubscriptionsResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webbffWidgetLayoutServiceApi.ListWidgetLayoutsResponse.fromPartial({
      pageInfo: { nextPageToken: (reply1?.pageInfo?.nextPageToken ?? "") },
      result: { details: (reply1?.result?.details ?? {}) },
    });
  }

  /**
   * Lists widget layouts a page at a time.
   */
  async searchWidgetLayouts(req: webbffWidgetLayoutServiceApi.SearchWidgetLayoutsRequest): Promise<webbffWidgetLayoutServiceApi.SearchWidgetLayoutsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SearchWidgetLayouts", req);
    this.logger.info("search_widget_layouts", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyWorkflowServiceApi.StartTranslationKeyWorkflowRequest.fromPartial({
      context: req?.context,
      translationKey: {
        locator: { $case: "address", address: { region: (req?.filter?.region ?? "") } },
        audit: { createdAt: req?.filter?.createdAfter },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<localizationTranslationKeyWorkflowServiceApi.StartTranslationKeyWorkflowRequest, localizationTranslationKeyWorkflowServiceApi.StartTranslationKeyWorkflowResponse> =
      (input, done) => this.localizationTranslationKeyWorkflowClient.startTranslationKeyWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("SearchWidgetLayouts.StartTranslationKeyWorkflow", () => call<localizationTranslationKeyWorkflowServiceApi.StartTranslationKeyWorkflowRequest, localizationTranslationKeyWorkflowServiceApi.StartTranslationKeyWorkflowResponse>(invoke1, request1));
    const request2 = communityBadgeWorkflowServiceApi.CancelBadgeWorkflowRequest.fromPartial({
      badge: { audit: { etag: (reply1?.translationKey?.audit?.etag ?? "") } },
      context: req?.context,
    });
    const invoke2: Unary<communityBadgeWorkflowServiceApi.CancelBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.CancelBadgeWorkflowResponse> =
      (input, done) => this.communityBadgeWorkflowClient.cancelBadgeWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      webbffWidgetLayoutServiceApi.SearchWidgetLayoutsResponse.fromPartial({
        widgetLayouts: [{
          children: [{
            location: {
              lines: ((reply1?.translationKey?.locator?.$case === "address" ? reply1?.translationKey?.locator.address : undefined)?.lines ?? []),
            },
          }],
        }],
      }),
      webbffWidgetLayoutServiceApi.SearchWidgetLayoutsResponse.fromPartial({
        widgetLayouts: [{
          children: [{
            children: [{ manager: { userId: (reply2?.badge?.owner?.userId ?? "") } }],
          }],
          manager: { displayName: (reply2?.badge?.owner?.displayName ?? "") },
        }],
      }),
    );
  }

  /**
   * Changes a widget layout.
   */
  async updateWidgetLayout(req: webbffWidgetLayoutServiceApi.UpdateWidgetLayoutRequest): Promise<webbffWidgetLayoutServiceApi.UpdateWidgetLayoutResponse> {
    validateContext(req.context);
    if (req.widgetLayout) {
      await this.repository.save(toWidgetLayoutRecord(req.context.tenantId, req.widgetLayout));
    }
    await this.repository.record(req.context.tenantId, "UpdateWidgetLayout", req);
    this.logger.info("update_widget_layout", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffWidgetLayoutNotificationServiceApi.ListWidgetLayoutSubscriptionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.widgetLayout?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.widgetLayout?.attributes ?? {}))),
        region: (req?.widgetLayout?.location?.region ?? ""),
      },
    });
    const reply1 = await this.workQueue.enqueue<webbffWidgetLayoutNotificationServiceApi.ListWidgetLayoutSubscriptionsRequest, webbffWidgetLayoutNotificationServiceApi.ListWidgetLayoutSubscriptionsResponse>(
      "acme.webbff.v1.WidgetLayoutService/UpdateWidgetLayout:0", request1,
    );
    const request2 = webbffClientSessionQueryServiceApi.SummarizeClientSessionsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.widgetLayout?.attributes ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
      },
    });
    const invoke2: Unary<webbffClientSessionQueryServiceApi.SummarizeClientSessionsRequest, webbffClientSessionQueryServiceApi.SummarizeClientSessionsResponse> =
      (input, done) => this.webbffClientSessionQueryClient.summarizeClientSessions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<webbffClientSessionQueryServiceApi.SummarizeClientSessionsRequest, webbffClientSessionQueryServiceApi.SummarizeClientSessionsResponse>(invoke2, request2));
    const request3 = webbffWidgetLayoutQueryServiceApi.CountWidgetLayoutsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.widgetLayout?.audit?.updatedAt,
        ownerId: (reply2?.result?.correlationId ?? ""),
        region: (req?.widgetLayout?.location?.region ?? ""),
      },
    });
    const invoke3: Unary<webbffWidgetLayoutQueryServiceApi.CountWidgetLayoutsRequest, webbffWidgetLayoutQueryServiceApi.CountWidgetLayoutsResponse> =
      (input, done) => this.webbffWidgetLayoutQueryClient.countWidgetLayouts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<webbffWidgetLayoutQueryServiceApi.CountWidgetLayoutsResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.widgetLayout?.audit?.etag ?? "") });
    return mergeResponses(
      webbffWidgetLayoutServiceApi.UpdateWidgetLayoutResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      webbffWidgetLayoutServiceApi.UpdateWidgetLayoutResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          message: (reply2?.result?.message ?? ""),
        },
      }),
      webbffWidgetLayoutServiceApi.UpdateWidgetLayoutResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      webbffWidgetLayoutServiceApi.UpdateWidgetLayoutResponse.fromPartial({
        widgetLayout: {
          depth: (req?.widgetLayout?.depth ?? 0),
          manager: req?.widgetLayout?.manager,
        },
      }),
    );
  }

  /**
   * Streams the changes of widget layouts as they happen.
   */
  async watchWidgetLayouts(req: webbffWidgetLayoutServiceApi.WatchWidgetLayoutsRequest): Promise<webbffWidgetLayoutServiceApi.WatchWidgetLayoutsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "WatchWidgetLayouts", req);
    this.logger.info("watch_widget_layouts", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceRequest.fromPartial({
      context: req?.context,
      details: {
        messageId: (req?.filter?.ownerId ?? ""),
        receivedAt: req?.filter?.createdAfter,
      },
    });
    const invoke1: Unary<webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceRequest, webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceResponse> =
      (input, done) => this.webbffWidgetLayoutIntegrationClient.disconnectWidgetLayoutSource(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = webbffClientSessionIntegrationServiceApi.TestClientSessionConnectionRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
      context: req?.context,
      details: {
        messageId: (reply1?.outcome?.message ?? ""),
        receivedAt: req?.since,
      },
    });
    const invoke2: Unary<webbffClientSessionIntegrationServiceApi.TestClientSessionConnectionRequest, webbffClientSessionIntegrationServiceApi.TestClientSessionConnectionResponse> =
      (input, done) => this.webbffClientSessionIntegrationClient.testClientSessionConnection(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    this.logger.info("local_audit", { value: (req?.subscriber?.preferredChannel ?? "") });
    return mergeResponses(
      webbffWidgetLayoutServiceApi.WatchWidgetLayoutsResponse.fromPartial({
        widgetLayout: {
          children: [{
            children: [{ manager: { userId: (reply1?.widgetLayout?.manager?.userId ?? "") } }],
          }],
          status: reply1?.widgetLayout?.status,
        },
      }),
      webbffWidgetLayoutServiceApi.WatchWidgetLayoutsResponse.fromPartial({
        widgetLayout: {
          children: [{ manager: { userId: (reply2?.clientSession?.assignee?.userId ?? "") } }],
        },
      }),
      webbffWidgetLayoutServiceApi.WatchWidgetLayoutsResponse.fromPartial({
        widgetLayout: {
          location: { region: (req?.filter?.region ?? "") },
          manager: { email: (req?.subscriber?.email ?? "") },
        },
      }),
    );
  }
}
