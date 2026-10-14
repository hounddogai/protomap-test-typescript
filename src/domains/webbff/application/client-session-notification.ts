/**
 * Tells the people who follow a client session what changed. Remote work stays behind typed client ports.
 */

import * as authorizationAccessPolicyValidationServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_validation_service.js";
import * as documentsDocumentServiceApi from "../../../../.cache/proto/acme/documents/v1/document_service.js";
import * as formsFormSubmissionWorkflowServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_workflow_service.js";
import * as mediaTranscodeJobImportServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_import_service.js";
import * as notificationsDeliveryAttemptNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_notification_service.js";
import * as personalizationAffinitySyncServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_sync_service.js";
import * as personalizationProfileApprovalServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_approval_service.js";
import * as surveysSurveyApprovalServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_approval_service.js";
import * as surveysSurveyResponseApprovalServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_response_approval_service.js";
import * as venuesVenueValidationServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_validation_service.js";
import * as webbffClientSessionIntegrationServiceApi from "../../../../.cache/proto/acme/webbff/v1/client_session_integration_service.js";
import * as webbffClientSessionNotificationServiceApi from "../../../../.cache/proto/acme/webbff/v1/client_session_notification_service.js";
import * as webbffPageCompositionQueryServiceApi from "../../../../.cache/proto/acme/webbff/v1/page_composition_query_service.js";
import * as webbffWidgetLayoutNotificationServiceApi from "../../../../.cache/proto/acme/webbff/v1/widget_layout_notification_service.js";
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
import { collect, upload } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { WebbffRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate client session operations and persist audit data.
 */
@injectable()
export class ClientSessionNotificationWorkflow {
  constructor(
    @inject(WebbffRepository) private readonly repository: WebbffRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyValidationService") private readonly authorizationAccessPolicyValidationClient: authorizationAccessPolicyValidationServiceApi.AccessPolicyValidationServiceClient,
    @inject("grpc:acme.documents.v1.DocumentService") private readonly documentsDocumentClient: documentsDocumentServiceApi.DocumentServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionWorkflowService") private readonly formsFormSubmissionWorkflowClient: formsFormSubmissionWorkflowServiceApi.FormSubmissionWorkflowServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobImportService") private readonly mediaTranscodeJobImportClient: mediaTranscodeJobImportServiceApi.TranscodeJobImportServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptNotificationService") private readonly notificationsDeliveryAttemptNotificationClient: notificationsDeliveryAttemptNotificationServiceApi.DeliveryAttemptNotificationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinitySyncService") private readonly personalizationAffinitySyncClient: personalizationAffinitySyncServiceApi.AffinitySyncServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileApprovalService") private readonly personalizationProfileApprovalClient: personalizationProfileApprovalServiceApi.ProfileApprovalServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyApprovalService") private readonly surveysSurveyApprovalClient: surveysSurveyApprovalServiceApi.SurveyApprovalServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseApprovalService") private readonly surveysSurveyResponseApprovalClient: surveysSurveyResponseApprovalServiceApi.SurveyResponseApprovalServiceClient,
    @inject("grpc:acme.venues.v1.VenueValidationService") private readonly venuesVenueValidationClient: venuesVenueValidationServiceApi.VenueValidationServiceClient,
    @inject("grpc:acme.webbff.v1.ClientSessionIntegrationService") private readonly webbffClientSessionIntegrationClient: webbffClientSessionIntegrationServiceApi.ClientSessionIntegrationServiceClient,
    @inject("grpc:acme.webbff.v1.PageCompositionQueryService") private readonly webbffPageCompositionQueryClient: webbffPageCompositionQueryServiceApi.PageCompositionQueryServiceClient,
    @inject("grpc:acme.webbff.v1.WidgetLayoutNotificationService") private readonly webbffWidgetLayoutNotificationClient: webbffWidgetLayoutNotificationServiceApi.WidgetLayoutNotificationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Returns a client session.
   */
  async getClientSessionPreferences(req: webbffClientSessionNotificationServiceApi.GetClientSessionPreferencesRequest): Promise<webbffClientSessionNotificationServiceApi.GetClientSessionPreferencesResponse> {
    validateContext(req.context);
    if (!req.clientSessionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "client_session_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetClientSessionPreferences", req);
    this.logger.info("get_client_session_preferences", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffClientSessionIntegrationServiceApi.TestClientSessionConnectionRequest.fromPartial({
      clientSessionId: (req?.clientSessionId ?? ""),
      context: req?.context,
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.webbff.v1.TestClientSessionConnectionRequest",
      value: Buffer.from(webbffClientSessionIntegrationServiceApi.TestClientSessionConnectionRequest.encode(request1).finish()),
    });
    const unpacked1 = webbffClientSessionIntegrationServiceApi.TestClientSessionConnectionRequest.decode(envelope1.value);
    const invoke1: Unary<webbffClientSessionIntegrationServiceApi.TestClientSessionConnectionRequest, webbffClientSessionIntegrationServiceApi.TestClientSessionConnectionResponse> =
      (input, done) => this.webbffClientSessionIntegrationClient.testClientSessionConnection(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webbffClientSessionIntegrationServiceApi.TestClientSessionConnectionRequest, webbffClientSessionIntegrationServiceApi.TestClientSessionConnectionResponse>(invoke1, unpacked1);
    const request2 = authorizationAccessPolicyValidationServiceApi.CheckAccessPolicyEligibilityRequest.fromPartial({
      accessPolicy: {
        audit: {
          createdBy: (reply1?.clientSession?.audit?.createdBy ?? ""),
          updatedBy: (reply1?.clientSession?.audit?.updatedBy ?? ""),
        },
        owner: { email: (reply1?.clientSession?.assignee?.email ?? "") },
      },
      context: req?.context,
      details: {
        contact: {
          preferredChannel: (reply1?.clientSession?.requester?.preferredChannel ?? ""),
        },
      },
    });
    const client2 = this.clients.get<authorizationAccessPolicyValidationServiceApi.AccessPolicyValidationServiceClient>("acme.authorization.v1.AccessPolicyValidationService");
    const invoke2: Unary<authorizationAccessPolicyValidationServiceApi.CheckAccessPolicyEligibilityRequest, authorizationAccessPolicyValidationServiceApi.CheckAccessPolicyEligibilityResponse> =
      (input, done) => client2.checkAccessPolicyEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<authorizationAccessPolicyValidationServiceApi.CheckAccessPolicyEligibilityRequest, authorizationAccessPolicyValidationServiceApi.CheckAccessPolicyEligibilityResponse>(invoke2, request2);
    return mergeResponses(
      webbffClientSessionNotificationServiceApi.GetClientSessionPreferencesResponse.fromPartial({ clientSession: { requester: reply1?.clientSession?.requester } }),
      webbffClientSessionNotificationServiceApi.GetClientSessionPreferencesResponse.fromPartial({
        clientSession: {
          assignee: { email: (reply2?.accessPolicy?.owner?.email ?? "") },
          comments: [{ createdAt: reply2?.accessPolicy?.audit?.createdAt }],
        },
      }),
      webbffClientSessionNotificationServiceApi.GetClientSessionPreferencesResponse.fromPartial({ clientSession: { clientSessionId: (req?.clientSessionId ?? "") } }),
    );
  }

  /**
   * Lists client sessions a page at a time.
   */
  async listClientSessionSubscriptions(req: webbffClientSessionNotificationServiceApi.ListClientSessionSubscriptionsRequest): Promise<webbffClientSessionNotificationServiceApi.ListClientSessionSubscriptionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListClientSessionSubscriptions", req);
    this.logger.info("list_client_session_subscriptions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        query: (req?.filter?.query ?? ""),
      },
      page: { pageSize: (req?.page?.pageSize ?? 0) },
    });
    const invoke1: Unary<webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesRequest, webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesResponse> =
      (input, done) => this.webbffClientSessionIntegrationClient.listClientSessionSources(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesRequest, webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webbffClientSessionNotificationServiceApi.ListClientSessionSubscriptionsResponse.fromPartial({
      pageInfo: { totalSize: (reply1?.pageInfo?.totalSize ?? 0) },
      result: { status: (reply1?.result?.status ?? "") },
    });
  }

  /**
   * Notifys a client session.
   */
  async notifyClientSessionWatchers(req: webbffClientSessionNotificationServiceApi.NotifyClientSessionWatchersRequest): Promise<webbffClientSessionNotificationServiceApi.NotifyClientSessionWatchersResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "NotifyClientSessionWatchers", req);
    this.logger.info("notify_client_session_watchers", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormSubmissionWorkflowServiceApi.PauseFormSubmissionWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          name: req?.details?.recipient?.name,
          phone: (req?.details?.recipient?.phone ?? ""),
        },
      },
    });
    const invoke1: Unary<formsFormSubmissionWorkflowServiceApi.PauseFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.PauseFormSubmissionWorkflowResponse> =
      (input, done) => this.formsFormSubmissionWorkflowClient.pauseFormSubmissionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<formsFormSubmissionWorkflowServiceApi.PauseFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.PauseFormSubmissionWorkflowResponse>(invoke1, request1));
    const request2 = authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyRequest.fromPartial({
      accessPolicy: {
        action: { $case: "block", block: { reason: (req?.reason ?? "") } },
        owner: {
          displayName: (reply1?.formSubmission?.subject?.displayName ?? ""),
          email: (req?.details?.recipient?.email ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke2: Unary<authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyRequest, authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyResponse> =
      (input, done) => this.authorizationAccessPolicyValidationClient.scoreAccessPolicy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("NotifyClientSessionWatchers.ScoreAccessPolicy", () => call<authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyRequest, authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.details?.channel ?? "") });
    return mergeResponses(
      webbffClientSessionNotificationServiceApi.NotifyClientSessionWatchersResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          details: (reply1?.result?.details ?? {}),
        },
      }),
      webbffClientSessionNotificationServiceApi.NotifyClientSessionWatchersResponse.fromPartial({
        clientSession: { audit: { updatedBy: (reply2?.accessPolicy?.audit?.updatedBy ?? "") } },
      }),
      webbffClientSessionNotificationServiceApi.NotifyClientSessionWatchersResponse.fromPartial({
        clientSession: {
          clientSessionId: (req?.clientSessionId ?? ""),
          requester: { name: req?.details?.recipient?.name },
        },
      }),
    );
  }

  /**
   * Sends a client session.
   */
  async sendClientSessionTestNotice(req: webbffClientSessionNotificationServiceApi.SendClientSessionTestNoticeRequest): Promise<webbffClientSessionNotificationServiceApi.SendClientSessionTestNoticeResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SendClientSessionTestNotice", req);
    this.logger.info("send_client_session_test_notice", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffPageCompositionQueryServiceApi.SummarizePageCompositionsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.details?.variables ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<webbffPageCompositionQueryServiceApi.SummarizePageCompositionsRequest, webbffPageCompositionQueryServiceApi.SummarizePageCompositionsResponse> =
      (input, done) => this.webbffPageCompositionQueryClient.summarizePageCompositions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = personalizationAffinitySyncServiceApi.ListAffinityConflictsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.details?.variables ?? {}))),
        ownerId: (req?.details?.templateId ?? ""),
      },
    });
    const reply2 = await this.workQueue.enqueue<personalizationAffinitySyncServiceApi.ListAffinityConflictsRequest, personalizationAffinitySyncServiceApi.ListAffinityConflictsResponse>(
      "acme.webbff.v1.ClientSessionNotificationService/SendClientSessionTestNotice:1", request2,
    );
    const request3 = venuesVenueValidationServiceApi.ExplainVenueDecisionRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.recipient?.email ?? ""),
          phone: (req?.details?.recipient?.phone ?? ""),
          preferredChannel: (req?.details?.recipient?.preferredChannel ?? ""),
        },
      },
    });
    const invoke3: Unary<venuesVenueValidationServiceApi.ExplainVenueDecisionRequest, venuesVenueValidationServiceApi.ExplainVenueDecisionResponse> =
      (input, done) => this.venuesVenueValidationClient.explainVenueDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await inRequest(req.context!, () => call<venuesVenueValidationServiceApi.ExplainVenueDecisionRequest, venuesVenueValidationServiceApi.ExplainVenueDecisionResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.details?.channel ?? "") });
    return mergeResponses(
      webbffClientSessionNotificationServiceApi.SendClientSessionTestNoticeResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      webbffClientSessionNotificationServiceApi.SendClientSessionTestNoticeResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      webbffClientSessionNotificationServiceApi.SendClientSessionTestNoticeResponse.fromPartial({
        clientSession: {
          audit: {
            createdAt: reply3?.venue?.audit?.createdAt,
            updatedAt: reply3?.venue?.audit?.updatedAt,
          },
        },
      }),
      webbffClientSessionNotificationServiceApi.SendClientSessionTestNoticeResponse.fromPartial({
        clientSession: {
          clientSessionId: (req?.clientSessionId ?? ""),
          requester: { email: (req?.details?.recipient?.email ?? "") },
        },
      }),
    );
  }

  /**
   * Streams the changes of client sessions as they happen.
   */
  async streamClientSessionNotices(req: webbffClientSessionNotificationServiceApi.StreamClientSessionNoticesRequest): Promise<webbffClientSessionNotificationServiceApi.StreamClientSessionNoticesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamClientSessionNotices", req);
    this.logger.info("stream_client_session_notices", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptNotificationServiceApi.StreamDeliveryAttemptNoticesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        query: (req?.filter?.query ?? ""),
        region: (req?.filter?.region ?? ""),
      },
      subscriber: { name: req?.subscriber?.name },
    });
    const stream1 = this.notificationsDeliveryAttemptNotificationClient.streamDeliveryAttemptNotices(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? notificationsDeliveryAttemptNotificationServiceApi.StreamDeliveryAttemptNoticesResponse.fromPartial({});
    const request2 = webbffClientSessionIntegrationServiceApi.DisconnectClientSessionSourceRequest.fromPartial({
      context: req?.context,
      details: {
        messageId: (req?.filter?.ownerId ?? ""),
        receivedAt: req?.since,
      },
    });
    const invoke2: Unary<webbffClientSessionIntegrationServiceApi.DisconnectClientSessionSourceRequest, webbffClientSessionIntegrationServiceApi.DisconnectClientSessionSourceResponse> =
      (input, done) => this.webbffClientSessionIntegrationClient.disconnectClientSessionSource(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<webbffClientSessionIntegrationServiceApi.DisconnectClientSessionSourceResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = documentsDocumentServiceApi.CreateDocumentRequest.fromPartial({
      context: req?.context,
      document: {
        counterparty: {
          displayName: ((reply2?.clientSession?.origin?.$case === "customer" ? reply2?.clientSession?.origin.customer : undefined)?.displayName ?? ""),
          path: ((reply2?.clientSession?.origin?.$case === "customer" ? reply2?.clientSession?.origin.customer : undefined)?.path ?? ""),
        },
        dueAt: reply2?.clientSession?.sla?.dueAt,
      },
    });
    const invoke3: Unary<documentsDocumentServiceApi.CreateDocumentRequest, documentsDocumentServiceApi.CreateDocumentResponse> =
      (input, done) => this.documentsDocumentClient.createDocument(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    this.logger.info("local_audit", { value: (req?.subscriber?.preferredChannel ?? "") });
    return mergeResponses(
      webbffClientSessionNotificationServiceApi.StreamClientSessionNoticesResponse.fromPartial({
        clientSession: {
          assignee: { displayName: (reply2?.clientSession?.assignee?.displayName ?? "") },
          audit: { etag: (reply2?.clientSession?.audit?.etag ?? "") },
        },
      }),
      webbffClientSessionNotificationServiceApi.StreamClientSessionNoticesResponse.fromPartial({ result: { details: (reply3?.result?.details ?? {}) } }),
      webbffClientSessionNotificationServiceApi.StreamClientSessionNoticesResponse.fromPartial({
        clientSession: {
          assignee: { email: (req?.subscriber?.email ?? "") },
          requester: { phone: (req?.subscriber?.phone ?? "") },
        },
      }),
    );
  }

  /**
   * Subscribes a client session.
   */
  async subscribeClientSessionUpdates(req: webbffClientSessionNotificationServiceApi.SubscribeClientSessionUpdatesRequest): Promise<webbffClientSessionNotificationServiceApi.SubscribeClientSessionUpdatesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SubscribeClientSessionUpdates", req);
    this.logger.info("subscribe_client_session_updates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = documentsDocumentServiceApi.CreateDocumentRequest.fromPartial({
      context: req?.context,
      document: {
        audit: { updatedAt: req?.context?.deadline },
        lines: [{
          attributes: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        }],
        metadata: Object.fromEntries(Object.entries((req?.details?.variables ?? {}))),
      },
    });
    const invoke1: Unary<documentsDocumentServiceApi.CreateDocumentRequest, documentsDocumentServiceApi.CreateDocumentResponse> =
      (input, done) => this.documentsDocumentClient.createDocument(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = webbffPageCompositionQueryServiceApi.FindPageCompositionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.document?.issuedAt,
        labels: Object.fromEntries(Object.entries((req?.details?.variables ?? {}))),
        ownerId: (reply1?.document?.counterparty?.documentFolderId ?? ""),
        region: (reply1?.document?.billingAddress?.region ?? ""),
      },
    });
    const method2 = "findPageCompositions" as const;
    const invoke2: Unary<webbffPageCompositionQueryServiceApi.FindPageCompositionsRequest, webbffPageCompositionQueryServiceApi.FindPageCompositionsResponse> =
      (input, done) => this.webbffPageCompositionQueryClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webbffPageCompositionQueryServiceApi.FindPageCompositionsRequest, webbffPageCompositionQueryServiceApi.FindPageCompositionsResponse>(invoke2, request2);
    const request3 = surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          displayName: (reply1?.document?.counterparty?.displayName ?? ""),
          email: (req?.details?.recipient?.email ?? ""),
        },
      },
      surveyResponse: { correlationId: (reply1?.result?.correlationId ?? "") },
    });
    const proxy3 = forwarding(this.surveysSurveyResponseApprovalClient);
    const invoke3: Unary<surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseRequest, surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseResponse> =
      (input, done) => proxy3.approveSurveyResponse(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseRequest, surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseResponse>(invoke3, request3);
    const request4 = webbffWidgetLayoutNotificationServiceApi.UnsubscribeWidgetLayoutUpdatesRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (req?.details?.recipient?.email ?? ""),
          name: req?.details?.recipient?.name,
          phone: (req?.details?.recipient?.phone ?? ""),
        },
      },
    });
    const invoke4: Unary<webbffWidgetLayoutNotificationServiceApi.UnsubscribeWidgetLayoutUpdatesRequest, webbffWidgetLayoutNotificationServiceApi.UnsubscribeWidgetLayoutUpdatesResponse> =
      (input, done) => this.webbffWidgetLayoutNotificationClient.unsubscribeWidgetLayoutUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<webbffWidgetLayoutNotificationServiceApi.UnsubscribeWidgetLayoutUpdatesRequest, webbffWidgetLayoutNotificationServiceApi.UnsubscribeWidgetLayoutUpdatesResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webbffClientSessionNotificationServiceApi.SubscribeClientSessionUpdatesResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      webbffClientSessionNotificationServiceApi.SubscribeClientSessionUpdatesResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      webbffClientSessionNotificationServiceApi.SubscribeClientSessionUpdatesResponse.fromPartial({
        result: { correlationId: (reply3?.surveyResponse?.correlationId ?? "") },
      }),
      webbffClientSessionNotificationServiceApi.SubscribeClientSessionUpdatesResponse.fromPartial({ result: { correlationId: (reply4?.result?.correlationId ?? "") } }),
      webbffClientSessionNotificationServiceApi.SubscribeClientSessionUpdatesResponse.fromPartial({
        clientSession: {
          clientSessionId: (req?.clientSessionId ?? ""),
          requester: { name: req?.details?.recipient?.name },
        },
      }),
    );
  }

  /**
   * Unsubscribes a client session.
   */
  async unsubscribeClientSessionUpdates(req: webbffClientSessionNotificationServiceApi.UnsubscribeClientSessionUpdatesRequest): Promise<webbffClientSessionNotificationServiceApi.UnsubscribeClientSessionUpdatesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "UnsubscribeClientSessionUpdates", req);
    this.logger.info("unsubscribe_client_session_updates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffClientSessionIntegrationServiceApi.DisconnectClientSessionSourceRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      clientSessionId: (req?.clientSessionId ?? ""),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<webbffClientSessionIntegrationServiceApi.DisconnectClientSessionSourceRequest, webbffClientSessionIntegrationServiceApi.DisconnectClientSessionSourceResponse> =
      (input, done) => this.webbffClientSessionIntegrationClient.disconnectClientSessionSource(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webbffClientSessionIntegrationServiceApi.DisconnectClientSessionSourceRequest, webbffClientSessionIntegrationServiceApi.DisconnectClientSessionSourceResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = webbffPageCompositionQueryServiceApi.BrowsePageCompositionsRequest.fromPartial({
      context: input2?.context,
      filter: {
        createdAfter: reply1?.clientSession?.sla?.dueAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (reply1?.clientSession?.assignee?.userId ?? ""),
      },
    });
    const invoke2: Unary<webbffPageCompositionQueryServiceApi.BrowsePageCompositionsRequest, webbffPageCompositionQueryServiceApi.BrowsePageCompositionsResponse> =
      (input, done) => this.webbffPageCompositionQueryClient.browsePageCompositions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webbffPageCompositionQueryServiceApi.BrowsePageCompositionsRequest, webbffPageCompositionQueryServiceApi.BrowsePageCompositionsResponse>(invoke2, request2);
    const request3 = personalizationProfileApprovalServiceApi.EscalateProfileRequest.fromPartial({
      context: req?.context,
      details: {
        approver: { displayName: (reply1?.clientSession?.assignee?.displayName ?? "") },
      },
    });
    const cloned3: personalizationProfileApprovalServiceApi.EscalateProfileRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<personalizationProfileApprovalServiceApi.EscalateProfileRequest, personalizationProfileApprovalServiceApi.EscalateProfileResponse> =
      (input, done) => this.personalizationProfileApprovalClient.escalateProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<personalizationProfileApprovalServiceApi.EscalateProfileRequest, personalizationProfileApprovalServiceApi.EscalateProfileResponse>(invoke3, cloned3);
    const request4 = surveysSurveyApprovalServiceApi.RejectSurveyRequest.fromPartial({
      context: req?.context,
      survey: {
        billingAddress: {
          lines: (reply3?.profile?.primaryAddress?.lines ?? []).map((value) => value),
        },
      },
    });
    const decoded4 = surveysSurveyApprovalServiceApi.RejectSurveyRequest.fromJSON(
      JSON.parse(JSON.stringify(surveysSurveyApprovalServiceApi.RejectSurveyRequest.toJSON(request4))),
    );
    const invoke4: Unary<surveysSurveyApprovalServiceApi.RejectSurveyRequest, surveysSurveyApprovalServiceApi.RejectSurveyResponse> =
      (input, done) => this.surveysSurveyApprovalClient.rejectSurvey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<surveysSurveyApprovalServiceApi.RejectSurveyRequest, surveysSurveyApprovalServiceApi.RejectSurveyResponse>(invoke4, decoded4);
    const request5 = mediaTranscodeJobImportServiceApi.ImportTranscodeJobsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.clientSessionId ?? ""),
        submittedBy: req?.details?.recipient,
      } },
    });
    const reply5 = await upload<mediaTranscodeJobImportServiceApi.ImportTranscodeJobsRequest, mediaTranscodeJobImportServiceApi.ImportTranscodeJobsResponse>(
      (done) => this.mediaTranscodeJobImportClient.importTranscodeJobs(metadataFor(request5.context), { deadline: Date.now() + 15_000 }, done), [request5],
    );
    this.logger.info("local_audit", { value: (req?.details?.channel ?? "") });
    return mergeResponses(
      webbffClientSessionNotificationServiceApi.UnsubscribeClientSessionUpdatesResponse.fromPartial({
        clientSession: { sla: { breached: (reply1?.clientSession?.sla?.breached ?? false) } },
      }),
      webbffClientSessionNotificationServiceApi.UnsubscribeClientSessionUpdatesResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      webbffClientSessionNotificationServiceApi.UnsubscribeClientSessionUpdatesResponse.fromPartial({
        clientSession: { audit: { etag: (reply3?.profile?.audit?.etag ?? "") } },
        outcome: { status: (reply3?.outcome?.status ?? "") },
      }),
      webbffClientSessionNotificationServiceApi.UnsubscribeClientSessionUpdatesResponse.fromPartial({ result: { status: (reply4?.outcome?.status ?? "") } }),
      webbffClientSessionNotificationServiceApi.UnsubscribeClientSessionUpdatesResponse.fromPartial({
        clientSession: {
          clientSessionId: (req?.clientSessionId ?? ""),
          requester: { name: req?.details?.recipient?.name },
        },
      }),
    );
  }
}
