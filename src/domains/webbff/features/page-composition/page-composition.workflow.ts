/**
 * Manages page compositions: creates, reads, changes, and lists them. Remote work stays behind typed client ports.
 */

import * as campaignsCampaignBudgetApprovalServiceApi from "../../../../../.cache/proto/acme/campaigns/v1/campaign_budget_approval_service.js";
import * as experimentsExperimentApprovalServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_approval_service.js";
import * as messagingConversationReportingServiceApi from "../../../../../.cache/proto/acme/messaging/v1/conversation_reporting_service.js";
import * as messagingParticipantApprovalServiceApi from "../../../../../.cache/proto/acme/messaging/v1/participant_approval_service.js";
import * as modelregistryRegisteredModelQueryServiceApi from "../../../../../.cache/proto/acme/modelregistry/v1/registered_model_query_service.js";
import * as notificationsDeliveryAttemptNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_notification_service.js";
import * as notificationsNotificationQueryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_query_service.js";
import * as personalizationRecommendationWorkflowServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_workflow_service.js";
import * as webbffClientSessionIntegrationServiceApi from "../../../../../.cache/proto/acme/webbff/v1/client_session_integration_service.js";
import * as webbffClientSessionNotificationServiceApi from "../../../../../.cache/proto/acme/webbff/v1/client_session_notification_service.js";
import * as webbffPageCompositionNotificationServiceApi from "../../../../../.cache/proto/acme/webbff/v1/page_composition_notification_service.js";
import * as webbffPageCompositionServiceApi from "../../../../../.cache/proto/acme/webbff/v1/page_composition_service.js";
import * as webbffWidgetLayoutIntegrationServiceApi from "../../../../../.cache/proto/acme/webbff/v1/widget_layout_integration_service.js";
import * as webbffWidgetLayoutQueryServiceApi from "../../../../../.cache/proto/acme/webbff/v1/widget_layout_query_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import * as googleTimestampApi from "../../../../../.cache/proto/google/protobuf/timestamp.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../../platform/errors.js";
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
} from "../../../../platform/rpc.js";
import { collect, write } from "../../../../platform/streams.js";
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
export class PageCompositionWorkflow {
  constructor(
    @inject(WebbffRepository) private readonly repository: WebbffRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.campaigns.v1.CampaignBudgetApprovalService") private readonly campaignsCampaignBudgetApprovalClient: campaignsCampaignBudgetApprovalServiceApi.CampaignBudgetApprovalServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentApprovalService") private readonly experimentsExperimentApprovalClient: experimentsExperimentApprovalServiceApi.ExperimentApprovalServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationReportingService") private readonly messagingConversationReportingClient: messagingConversationReportingServiceApi.ConversationReportingServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantApprovalService") private readonly messagingParticipantApprovalClient: messagingParticipantApprovalServiceApi.ParticipantApprovalServiceClient,
    @inject("grpc:acme.modelregistry.v1.RegisteredModelQueryService") private readonly modelregistryRegisteredModelQueryClient: modelregistryRegisteredModelQueryServiceApi.RegisteredModelQueryServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptNotificationService") private readonly notificationsDeliveryAttemptNotificationClient: notificationsDeliveryAttemptNotificationServiceApi.DeliveryAttemptNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationQueryService") private readonly notificationsNotificationQueryClient: notificationsNotificationQueryServiceApi.NotificationQueryServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationWorkflowService") private readonly personalizationRecommendationWorkflowClient: personalizationRecommendationWorkflowServiceApi.RecommendationWorkflowServiceClient,
    @inject("grpc:acme.webbff.v1.ClientSessionIntegrationService") private readonly webbffClientSessionIntegrationClient: webbffClientSessionIntegrationServiceApi.ClientSessionIntegrationServiceClient,
    @inject("grpc:acme.webbff.v1.ClientSessionNotificationService") private readonly webbffClientSessionNotificationClient: webbffClientSessionNotificationServiceApi.ClientSessionNotificationServiceClient,
    @inject("grpc:acme.webbff.v1.PageCompositionNotificationService") private readonly webbffPageCompositionNotificationClient: webbffPageCompositionNotificationServiceApi.PageCompositionNotificationServiceClient,
    @inject("grpc:acme.webbff.v1.WidgetLayoutIntegrationService") private readonly webbffWidgetLayoutIntegrationClient: webbffWidgetLayoutIntegrationServiceApi.WidgetLayoutIntegrationServiceClient,
    @inject("grpc:acme.webbff.v1.WidgetLayoutQueryService") private readonly webbffWidgetLayoutQueryClient: webbffWidgetLayoutQueryServiceApi.WidgetLayoutQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Takes a stream of page compositions and answers once at the end.
   */
  async batchCreatePageCompositions(req: webbffPageCompositionServiceApi.BatchCreatePageCompositionsRequest): Promise<webbffPageCompositionServiceApi.BatchCreatePageCompositionsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchCreatePageCompositions", req);
    this.logger.info("batch_create_page_compositions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationQueryServiceApi.ResolveNotificationsRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<notificationsNotificationQueryServiceApi.ResolveNotificationsRequest, notificationsNotificationQueryServiceApi.ResolveNotificationsResponse> =
      (input, done) => this.notificationsNotificationQueryClient.resolveNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    let selected2_1: string | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected2_1 = ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.counterparty?.widgetLayoutId ?? "");
        break;
      default:
        selected2_1 = "";
    }
    let selected2_2: googleTimestampApi.Timestamp | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected2_2 = (req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.updatedAt;
        break;
      default:
        selected2_2 = undefined;
    }
    const request2 = webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceRequest.fromPartial({
      context: req?.context,
      details: {
        messageId: (reply1?.result?.message ?? ""),
        receivedAt: selected2_2,
      },
      widgetLayoutId: (selected2_1 ?? ""),
    });
    const invoke2: Unary<webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceRequest, webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceResponse> =
      (input, done) => this.webbffWidgetLayoutIntegrationClient.disconnectWidgetLayoutSource(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceRequest, webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.etag ?? "") });
    return mergeResponses(
      webbffPageCompositionServiceApi.BatchCreatePageCompositionsResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      webbffPageCompositionServiceApi.BatchCreatePageCompositionsResponse.fromPartial({ result: { status: (reply2?.outcome?.status ?? "") } }),
    );
  }

  /**
   * Returns several page compositions at once.
   */
  async batchGetPageCompositions(req: webbffPageCompositionServiceApi.BatchGetPageCompositionsRequest): Promise<webbffPageCompositionServiceApi.BatchGetPageCompositionsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchGetPageCompositions", req);
    this.logger.info("batch_get_page_compositions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffClientSessionIntegrationServiceApi.ReplayClientSessionEventsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      context: req?.context,
      details: {
        messageId: (req?.context?.tenantId ?? ""),
        receivedAt: req?.context?.deadline,
      },
    });
    const method1 = "replayClientSessionEvents" as const;
    const invoke1: Unary<webbffClientSessionIntegrationServiceApi.ReplayClientSessionEventsRequest, webbffClientSessionIntegrationServiceApi.ReplayClientSessionEventsResponse> =
      (input, done) => this.webbffClientSessionIntegrationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webbffClientSessionIntegrationServiceApi.ReplayClientSessionEventsRequest, webbffClientSessionIntegrationServiceApi.ReplayClientSessionEventsResponse>(invoke1, request1);
    return webbffPageCompositionServiceApi.BatchGetPageCompositionsResponse.fromPartial({
      result: {
        referenceIds: (reply1?.result?.referenceIds ?? []),
        status: (reply1?.outcome?.status ?? ""),
      },
    });
  }

  /**
   * Creates a page composition.
   */
  async clonePageComposition(req: webbffPageCompositionServiceApi.ClonePageCompositionRequest): Promise<webbffPageCompositionServiceApi.ClonePageCompositionResponse> {
    validateContext(req.context);
    if (req.pageComposition) {
      await this.repository.save(toPageCompositionRecord(req.context.tenantId, req.pageComposition));
    }
    await this.repository.record(req.context.tenantId, "ClonePageComposition", req);
    this.logger.info("clone_page_composition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffWidgetLayoutQueryServiceApi.CountWidgetLayoutsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.pageComposition?.billingAddress?.region ?? "") },
    });
    const proxy1 = forwarding(this.webbffWidgetLayoutQueryClient);
    const invoke1: Unary<webbffWidgetLayoutQueryServiceApi.CountWidgetLayoutsRequest, webbffWidgetLayoutQueryServiceApi.CountWidgetLayoutsResponse> =
      (input, done) => proxy1.countWidgetLayouts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webbffWidgetLayoutQueryServiceApi.CountWidgetLayoutsRequest, webbffWidgetLayoutQueryServiceApi.CountWidgetLayoutsResponse>(invoke1, request1);
    const request2 = experimentsExperimentApprovalServiceApi.EscalateExperimentRequest.fromPartial({
      context: req?.context,
      experiment: {
        audit: {
          createdBy: (req?.pageComposition?.audit?.createdBy ?? ""),
          updatedBy: (req?.pageComposition?.audit?.updatedBy ?? ""),
        },
        location: {
          locality: (req?.pageComposition?.billingAddress?.locality ?? ""),
          region: (req?.pageComposition?.billingAddress?.region ?? ""),
        },
      },
    });
    const invoke2: Unary<experimentsExperimentApprovalServiceApi.EscalateExperimentRequest, experimentsExperimentApprovalServiceApi.EscalateExperimentResponse> =
      (input, done) => this.experimentsExperimentApprovalClient.escalateExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExperimentApprovalServiceApi.EscalateExperimentRequest, experimentsExperimentApprovalServiceApi.EscalateExperimentResponse>(invoke2, request2);
    const settled3 = await Promise.allSettled((req?.pageComposition?.lines ?? []).map(async (item) => {
      const request3 = messagingParticipantApprovalServiceApi.CommentParticipantApprovalRequest.fromPartial({
        context: req?.context,
        participant: {
          attributes: Object.fromEntries(Object.entries((item?.attributes ?? {}))),
          audit: { updatedBy: (req?.pageComposition?.audit?.updatedBy ?? "") },
          primaryAddress: {
            lines: (req?.pageComposition?.billingAddress?.lines ?? []).map((value) => value),
          },
        },
      });
      const invoke3: Unary<messagingParticipantApprovalServiceApi.CommentParticipantApprovalRequest, messagingParticipantApprovalServiceApi.CommentParticipantApprovalResponse> =
        (input, done) => this.messagingParticipantApprovalClient.commentParticipantApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<messagingParticipantApprovalServiceApi.CommentParticipantApprovalRequest, messagingParticipantApprovalServiceApi.CommentParticipantApprovalResponse>(invoke3, request3);
      return reply3;
    }));
    const results3: messagingParticipantApprovalServiceApi.CommentParticipantApprovalResponse[] = [];
    for (const result of settled3) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results3.push(result.value);
    }
    const reply3 = results3.at(-1) ?? messagingParticipantApprovalServiceApi.CommentParticipantApprovalResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      webbffPageCompositionServiceApi.ClonePageCompositionResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      webbffPageCompositionServiceApi.ClonePageCompositionResponse.fromPartial({
        pageComposition: {
          audit: {
            createdAt: reply2?.experiment?.audit?.createdAt,
            createdBy: (reply2?.experiment?.audit?.createdBy ?? ""),
          },
        },
      }),
      webbffPageCompositionServiceApi.ClonePageCompositionResponse.fromPartial({
        pageComposition: {
          billingAddress: req?.pageComposition?.billingAddress,
          status: req?.pageComposition?.status,
        },
      }),
    );
  }

  /**
   * Creates a page composition.
   */
  async createPageComposition(req: webbffPageCompositionServiceApi.CreatePageCompositionRequest): Promise<webbffPageCompositionServiceApi.CreatePageCompositionResponse> {
    validateContext(req.context);
    if (req.pageComposition) {
      await this.repository.save(toPageCompositionRecord(req.context.tenantId, req.pageComposition));
    }
    await this.repository.record(req.context.tenantId, "CreatePageComposition", req);
    this.logger.info("create_page_composition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffPageCompositionNotificationServiceApi.SendPageCompositionTestNoticeRequest.fromPartial({
      context: req?.context,
      details: { recipient: { email: (req?.context?.actor?.email ?? "") } },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<webbffPageCompositionNotificationServiceApi.SendPageCompositionTestNoticeRequest, webbffPageCompositionNotificationServiceApi.SendPageCompositionTestNoticeResponse> =
      (input, done) => this.webbffPageCompositionNotificationClient.sendPageCompositionTestNotice(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webbffPageCompositionNotificationServiceApi.SendPageCompositionTestNoticeRequest, webbffPageCompositionNotificationServiceApi.SendPageCompositionTestNoticeResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = webbffWidgetLayoutQueryServiceApi.PeekWidgetLayoutRequest.fromPartial({
      context: input2?.context,
      widgetLayoutId: (input2?.pageComposition?.counterparty?.widgetLayoutId ?? ""),
    });
    const invoke2: Unary<webbffWidgetLayoutQueryServiceApi.PeekWidgetLayoutRequest, webbffWidgetLayoutQueryServiceApi.PeekWidgetLayoutResponse> =
      (input, done) => this.webbffWidgetLayoutQueryClient.peekWidgetLayout(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webbffWidgetLayoutQueryServiceApi.PeekWidgetLayoutRequest, webbffWidgetLayoutQueryServiceApi.PeekWidgetLayoutResponse>(invoke2, request2);
    let selected3_1: string | undefined;
    switch (reply1?.pageComposition?.settlement?.$case) {
      case "card":
        selected3_1 = ((reply1?.pageComposition?.settlement?.$case === "card" ? reply1?.pageComposition?.settlement.card : undefined)?.holderName ?? "");
        break;
      default:
        selected3_1 = "";
    }
    let selected3_3: string | undefined;
    switch (reply1?.pageComposition?.settlement?.$case) {
      case "card":
        selected3_3 = ((reply1?.pageComposition?.settlement?.$case === "card" ? reply1?.pageComposition?.settlement.card : undefined)?.network ?? "");
        break;
      default:
        selected3_3 = "";
    }
    const request3 = campaignsCampaignBudgetApprovalServiceApi.RejectCampaignBudgetRequest.fromPartial({
      campaignBudget: {
        funding: { $case: "card", card: {
          holderName: (selected3_1 ?? ""),
          network: (selected3_3 ?? ""),
        } },
        holder: { displayName: (reply2?.widgetLayout?.manager?.displayName ?? "") },
      },
      context: req?.context,
    });
    const invoke3: Unary<campaignsCampaignBudgetApprovalServiceApi.RejectCampaignBudgetRequest, campaignsCampaignBudgetApprovalServiceApi.RejectCampaignBudgetResponse> =
      (input, done) => this.campaignsCampaignBudgetApprovalClient.rejectCampaignBudget(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<campaignsCampaignBudgetApprovalServiceApi.RejectCampaignBudgetRequest, campaignsCampaignBudgetApprovalServiceApi.RejectCampaignBudgetResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      webbffPageCompositionServiceApi.CreatePageCompositionResponse.fromPartial({
        pageComposition: {
          counterparty: {
            displayName: (reply1?.pageComposition?.counterparty?.displayName ?? ""),
          },
        },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      webbffPageCompositionServiceApi.CreatePageCompositionResponse.fromPartial({
        pageComposition: {
          billingAddress: { countryCode: (reply2?.widgetLayout?.location?.countryCode ?? "") },
        },
      }),
      webbffPageCompositionServiceApi.CreatePageCompositionResponse.fromPartial({
        pageComposition: { audit: { etag: (reply3?.campaignBudget?.audit?.etag ?? "") } },
      }),
      webbffPageCompositionServiceApi.CreatePageCompositionResponse.fromPartial({
        pageComposition: {
          issuedAt: req?.pageComposition?.issuedAt,
          status: req?.pageComposition?.status,
        },
      }),
    );
  }

  /**
   * Deletes a page composition.
   */
  async deletePageComposition(req: webbffPageCompositionServiceApi.DeletePageCompositionRequest): Promise<webbffPageCompositionServiceApi.DeletePageCompositionResponse> {
    validateContext(req.context);
    if (!req.pageCompositionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_composition_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeletePageComposition", req);
    this.logger.info("delete_page_composition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationWorkflowServiceApi.ListRecommendationWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        ownerId: (req?.pageCompositionId ?? ""),
      },
    });
    const decoded1 = personalizationRecommendationWorkflowServiceApi.ListRecommendationWorkflowsRequest.fromJSON(
      JSON.parse(JSON.stringify(personalizationRecommendationWorkflowServiceApi.ListRecommendationWorkflowsRequest.toJSON(request1))),
    );
    const invoke1: Unary<personalizationRecommendationWorkflowServiceApi.ListRecommendationWorkflowsRequest, personalizationRecommendationWorkflowServiceApi.ListRecommendationWorkflowsResponse> =
      (input, done) => this.personalizationRecommendationWorkflowClient.listRecommendationWorkflows(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationRecommendationWorkflowServiceApi.ListRecommendationWorkflowsRequest, personalizationRecommendationWorkflowServiceApi.ListRecommendationWorkflowsResponse>(invoke1, decoded1);
    const request2 = webbffWidgetLayoutQueryServiceApi.BrowseWidgetLayoutsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.webbff.v1.BrowseWidgetLayoutsRequest",
      value: Buffer.from(webbffWidgetLayoutQueryServiceApi.BrowseWidgetLayoutsRequest.encode(request2).finish()),
    });
    const unpacked2 = webbffWidgetLayoutQueryServiceApi.BrowseWidgetLayoutsRequest.decode(envelope2.value);
    const invoke2: Unary<webbffWidgetLayoutQueryServiceApi.BrowseWidgetLayoutsRequest, webbffWidgetLayoutQueryServiceApi.BrowseWidgetLayoutsResponse> =
      (input, done) => this.webbffWidgetLayoutQueryClient.browseWidgetLayouts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webbffWidgetLayoutQueryServiceApi.BrowseWidgetLayoutsRequest, webbffWidgetLayoutQueryServiceApi.BrowseWidgetLayoutsResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.etag ?? "") });
    return mergeResponses(
      webbffPageCompositionServiceApi.DeletePageCompositionResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      webbffPageCompositionServiceApi.DeletePageCompositionResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a page composition.
   */
  async getPageComposition(req: webbffPageCompositionServiceApi.GetPageCompositionRequest): Promise<webbffPageCompositionServiceApi.GetPageCompositionResponse> {
    validateContext(req.context);
    if (!req.pageCompositionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_composition_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetPageComposition", req);
    this.logger.info("get_page_composition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      context: req?.context,
      details: {
        messageId: (req?.context?.traceId ?? ""),
        receivedAt: req?.context?.deadline,
      },
    });
    const client1 = this.clients.get<webbffWidgetLayoutIntegrationServiceApi.WidgetLayoutIntegrationServiceClient>("acme.webbff.v1.WidgetLayoutIntegrationService");
    const invoke1: Unary<webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceRequest, webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceResponse> =
      (input, done) => client1.disconnectWidgetLayoutSource(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceRequest, webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceResponse>(invoke1, request1);
    const request2 = notificationsNotificationQueryServiceApi.ResolveNotificationsRequest.fromPartial({ context: req?.context });
    const invoke2: Unary<notificationsNotificationQueryServiceApi.ResolveNotificationsRequest, notificationsNotificationQueryServiceApi.ResolveNotificationsResponse> =
      (input, done) => this.notificationsNotificationQueryClient.resolveNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<notificationsNotificationQueryServiceApi.ResolveNotificationsRequest, notificationsNotificationQueryServiceApi.ResolveNotificationsResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = webbffWidgetLayoutIntegrationServiceApi.RelayWidgetLayoutMessagesRequest.fromPartial({
      frame: { $case: "change", change: {
        children: [{
          children: [{ parentId: (req?.context?.actor?.userId ?? "") }],
          parentId: (req?.context?.actor?.userId ?? ""),
        }],
        parentId: (req?.context?.actor?.userId ?? ""),
      } },
      context: req?.context,
    });
    const stream3 = this.webbffWidgetLayoutIntegrationClient.relayWidgetLayoutMessages(metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const reading3 = collect(stream3);
    const writing3 = (async () => {
      await write(stream3, request3);
      stream3.end();
    })();
    const [messages3] = await Promise.all([reading3, writing3]);
    const reply3 = messages3.at(-1) ?? webbffWidgetLayoutIntegrationServiceApi.RelayWidgetLayoutMessagesResponse.fromPartial({});
    return mergeResponses(
      webbffPageCompositionServiceApi.GetPageCompositionResponse.fromPartial({
        pageComposition: { audit: { updatedAt: reply1?.widgetLayout?.audit?.updatedAt } },
      }),
      webbffPageCompositionServiceApi.GetPageCompositionResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      webbffPageCompositionServiceApi.GetPageCompositionResponse.fromPartial({
        pageComposition: { pageCompositionId: (req?.pageCompositionId ?? "") },
      }),
    );
  }

  /**
   * Lists page compositions a page at a time.
   */
  async listPageCompositions(req: webbffPageCompositionServiceApi.ListPageCompositionsRequest): Promise<webbffPageCompositionServiceApi.ListPageCompositionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPageCompositions", req);
    this.logger.info("list_page_compositions", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webbffPageCompositionServiceApi.ListPageCompositionsResponse.fromPartial({});
  }

  /**
   * Lists page compositions a page at a time.
   */
  async searchPageCompositions(req: webbffPageCompositionServiceApi.SearchPageCompositionsRequest): Promise<webbffPageCompositionServiceApi.SearchPageCompositionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SearchPageCompositions", req);
    this.logger.info("search_page_compositions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = modelregistryRegisteredModelQueryServiceApi.FindRegisteredModelsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
    });
    const invoke1: Unary<modelregistryRegisteredModelQueryServiceApi.FindRegisteredModelsRequest, modelregistryRegisteredModelQueryServiceApi.FindRegisteredModelsResponse> =
      (input, done) => this.modelregistryRegisteredModelQueryClient.findRegisteredModels(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<modelregistryRegisteredModelQueryServiceApi.FindRegisteredModelsRequest, modelregistryRegisteredModelQueryServiceApi.FindRegisteredModelsResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webbffPageCompositionServiceApi.SearchPageCompositionsResponse.fromPartial({
      pageInfo: {
        nextPageToken: (reply1?.pageInfo?.nextPageToken ?? ""),
        totalSize: (reply1?.pageInfo?.totalSize ?? 0),
      },
    });
  }

  /**
   * Changes a page composition.
   */
  async updatePageComposition(req: webbffPageCompositionServiceApi.UpdatePageCompositionRequest): Promise<webbffPageCompositionServiceApi.UpdatePageCompositionResponse> {
    validateContext(req.context);
    if (req.pageComposition) {
      await this.repository.save(toPageCompositionRecord(req.context.tenantId, req.pageComposition));
    }
    await this.repository.record(req.context.tenantId, "UpdatePageComposition", req);
    this.logger.info("update_page_composition", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_3: string | undefined;
    switch (req?.pageComposition?.settlement?.$case) {
      case "card":
        selected1_3 = ((req?.pageComposition?.settlement?.$case === "card" ? req?.pageComposition?.settlement.card : undefined)?.token ?? "");
        break;
      default:
        selected1_3 = "";
    }
    const request1 = campaignsCampaignBudgetApprovalServiceApi.DelegateCampaignBudgetApprovalRequest.fromPartial({
      campaignBudget: {
        audit: {
          createdAt: req?.pageComposition?.audit?.createdAt,
          updatedBy: (req?.pageComposition?.audit?.updatedBy ?? ""),
        },
        funding: { $case: "card", card: { token: (selected1_3 ?? "") } },
        holder: { displayName: (req?.pageComposition?.counterparty?.displayName ?? "") },
      },
      context: req?.context,
    });
    const invoke1: Unary<campaignsCampaignBudgetApprovalServiceApi.DelegateCampaignBudgetApprovalRequest, campaignsCampaignBudgetApprovalServiceApi.DelegateCampaignBudgetApprovalResponse> =
      (input, done) => this.campaignsCampaignBudgetApprovalClient.delegateCampaignBudgetApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<campaignsCampaignBudgetApprovalServiceApi.DelegateCampaignBudgetApprovalRequest, campaignsCampaignBudgetApprovalServiceApi.DelegateCampaignBudgetApprovalResponse>(invoke1, request1);
    const request2 = webbffClientSessionNotificationServiceApi.SubscribeClientSessionUpdatesRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (reply1?.campaignBudget?.contact?.email ?? ""),
          phone: (reply1?.campaignBudget?.contact?.phone ?? ""),
          preferredChannel: (reply1?.campaignBudget?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke2: Unary<webbffClientSessionNotificationServiceApi.SubscribeClientSessionUpdatesRequest, webbffClientSessionNotificationServiceApi.SubscribeClientSessionUpdatesResponse> =
      (input, done) => this.webbffClientSessionNotificationClient.subscribeClientSessionUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesRequest.fromPartial({
      context: req?.context,
      details: {
        channel: ((reply2?.clientSession?.origin?.$case === "channel" ? reply2?.clientSession?.origin.channel : undefined)?.channel ?? ""),
        recipient: {
          email: (reply1?.campaignBudget?.holder?.email ?? ""),
          name: reply1?.campaignBudget?.contact?.name,
          phone: (reply2?.clientSession?.requester?.phone ?? ""),
        },
      },
    });
    const reply3 = await this.workQueue.enqueue<webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesRequest, webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesResponse>(
      "acme.webbff.v1.PageCompositionService/UpdatePageComposition:2", request3,
    );
    this.logger.info("local_audit", { value: (req?.pageComposition?.audit?.etag ?? "") });
    return mergeResponses(
      webbffPageCompositionServiceApi.UpdatePageCompositionResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      webbffPageCompositionServiceApi.UpdatePageCompositionResponse.fromPartial({
        pageComposition: { audit: { createdAt: reply2?.clientSession?.audit?.createdAt } },
      }),
      webbffPageCompositionServiceApi.UpdatePageCompositionResponse.fromPartial({
        pageComposition: {
          billingAddress: {
            lines: (reply3?.pageComposition?.billingAddress?.lines ?? []),
            locality: (reply3?.pageComposition?.billingAddress?.locality ?? ""),
          },
        },
      }),
      webbffPageCompositionServiceApi.UpdatePageCompositionResponse.fromPartial({
        pageComposition: {
          dueAt: req?.pageComposition?.dueAt,
          number: (req?.pageComposition?.number ?? ""),
        },
      }),
    );
  }

  /**
   * Streams the changes of page compositions as they happen.
   */
  async watchPageCompositions(req: webbffPageCompositionServiceApi.WatchPageCompositionsRequest): Promise<webbffPageCompositionServiceApi.WatchPageCompositionsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "WatchPageCompositions", req);
    this.logger.info("watch_page_compositions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationQueryServiceApi.ResolveNotificationsRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<notificationsNotificationQueryServiceApi.ResolveNotificationsRequest, notificationsNotificationQueryServiceApi.ResolveNotificationsResponse> =
      (input, done) => this.notificationsNotificationQueryClient.resolveNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<notificationsNotificationQueryServiceApi.ResolveNotificationsRequest, notificationsNotificationQueryServiceApi.ResolveNotificationsResponse>(invoke1, request1));
    const request2 = messagingConversationReportingServiceApi.CountConversationTotalsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
    });
    const invoke2: Unary<messagingConversationReportingServiceApi.CountConversationTotalsRequest, messagingConversationReportingServiceApi.CountConversationTotalsResponse> =
      (input, done) => this.messagingConversationReportingClient.countConversationTotals(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<messagingConversationReportingServiceApi.CountConversationTotalsResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          phone: (req?.subscriber?.phone ?? ""),
          preferredChannel: (req?.subscriber?.preferredChannel ?? ""),
        },
      },
    });
    const invoke3: Unary<webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersRequest, webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersResponse> =
      (input, done) => this.webbffPageCompositionNotificationClient.notifyPageCompositionWatchers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    const request4 = notificationsDeliveryAttemptNotificationServiceApi.ListDeliveryAttemptSubscriptionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        ownerId: (req?.filter?.ownerId ?? ""),
        query: (req?.filter?.query ?? ""),
        region: (reply3?.pageComposition?.billingAddress?.region ?? ""),
      },
    });
    const invoke4: Unary<notificationsDeliveryAttemptNotificationServiceApi.ListDeliveryAttemptSubscriptionsRequest, notificationsDeliveryAttemptNotificationServiceApi.ListDeliveryAttemptSubscriptionsResponse> =
      (input, done) => this.notificationsDeliveryAttemptNotificationClient.listDeliveryAttemptSubscriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke4 = promisify(invoke4);
    const reply4 = requireReply(await asyncInvoke4(request4));
    this.logger.info("local_audit", { value: (req?.subscriber?.email ?? "") });
    return mergeResponses(
      webbffPageCompositionServiceApi.WatchPageCompositionsResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      webbffPageCompositionServiceApi.WatchPageCompositionsResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      webbffPageCompositionServiceApi.WatchPageCompositionsResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          referenceIds: (reply3?.result?.referenceIds ?? []),
        },
      }),
      webbffPageCompositionServiceApi.WatchPageCompositionsResponse.fromPartial({ result: { message: (reply4?.result?.message ?? "") } }),
      webbffPageCompositionServiceApi.WatchPageCompositionsResponse.fromPartial({
        pageComposition: { billingAddress: { region: (req?.filter?.region ?? "") } },
      }),
    );
  }
}
