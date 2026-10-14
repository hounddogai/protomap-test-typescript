/**
 * Manages surveys: creates, reads, changes, and lists them. Remote work stays behind typed client ports.
 */

import * as communityBadgeValidationServiceApi from "../../../../.cache/proto/acme/community/v1/badge_validation_service.js";
import * as identityUserQueryServiceApi from "../../../../.cache/proto/acme/identity/v1/user_query_service.js";
import * as maintenanceWorkOrderQueryServiceApi from "../../../../.cache/proto/acme/maintenance/v1/work_order_query_service.js";
import * as notificationsDeliveryAttemptHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_history_service.js";
import * as surveysQuestionCalculationServiceApi from "../../../../.cache/proto/acme/surveys/v1/question_calculation_service.js";
import * as surveysSurveyQueryServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_query_service.js";
import * as surveysSurveyResponseQueryServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_response_query_service.js";
import * as surveysSurveyResponseValidationServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_response_validation_service.js";
import * as surveysSurveyServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_service.js";
import * as telematicsTelemetryReadingQueryServiceApi from "../../../../.cache/proto/acme/telematics/v1/telemetry_reading_query_service.js";
import * as webhooksWebhookEndpointServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import * as googleTimestampApi from "../../../../.cache/proto/google/protobuf/timestamp.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  promised,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toSurveyRecord } from "../data/records.js";
import { SurveysRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate survey operations and persist audit data.
 */
@injectable()
export class SurveyWorkflow {
  constructor(
    @inject(SurveysRepository) private readonly repository: SurveysRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.BadgeValidationService") private readonly communityBadgeValidationClient: communityBadgeValidationServiceApi.BadgeValidationServiceClient,
    @inject("grpc:acme.identity.v1.UserQueryService") private readonly identityUserQueryClient: identityUserQueryServiceApi.UserQueryServiceClient,
    @inject("grpc:acme.maintenance.v1.WorkOrderQueryService") private readonly maintenanceWorkOrderQueryClient: maintenanceWorkOrderQueryServiceApi.WorkOrderQueryServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptHistoryService") private readonly notificationsDeliveryAttemptHistoryClient: notificationsDeliveryAttemptHistoryServiceApi.DeliveryAttemptHistoryServiceClient,
    @inject("grpc:acme.surveys.v1.QuestionCalculationService") private readonly surveysQuestionCalculationClient: surveysQuestionCalculationServiceApi.QuestionCalculationServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyQueryService") private readonly surveysSurveyQueryClient: surveysSurveyQueryServiceApi.SurveyQueryServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseQueryService") private readonly surveysSurveyResponseQueryClient: surveysSurveyResponseQueryServiceApi.SurveyResponseQueryServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseValidationService") private readonly surveysSurveyResponseValidationClient: surveysSurveyResponseValidationServiceApi.SurveyResponseValidationServiceClient,
    @inject("grpc:acme.telematics.v1.TelemetryReadingQueryService") private readonly telematicsTelemetryReadingQueryClient: telematicsTelemetryReadingQueryServiceApi.TelemetryReadingQueryServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointService") private readonly webhooksWebhookEndpointClient: webhooksWebhookEndpointServiceApi.WebhookEndpointServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Takes a stream of surveys and answers once at the end.
   */
  async batchCreateSurveys(req: surveysSurveyServiceApi.BatchCreateSurveysRequest): Promise<surveysSurveyServiceApi.BatchCreateSurveysResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchCreateSurveys", req);
    this.logger.info("batch_create_surveys", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          name: (req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.name,
          phone: ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.phone ?? ""),
        },
      },
      surveyResponse: {
        subject: {
          email: ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.email ?? ""),
        },
      },
    });
    const invoke1: Unary<surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseRequest, surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseResponse> =
      (input, done) => this.surveysSurveyResponseValidationClient.previewSurveyResponse(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    let selected2_1: string | undefined;
    switch (req?.chunk?.$case) {
      case "header":
        selected2_1 = ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.email ?? "");
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
    const request2 = communityBadgeValidationServiceApi.PreviewBadgeRequest.fromPartial({
      badge: {
        audit: { updatedAt: selected2_2 },
        owner: { email: (selected2_1 ?? "") },
      },
      context: req?.context,
    });
    const invoke2: Unary<communityBadgeValidationServiceApi.PreviewBadgeRequest, communityBadgeValidationServiceApi.PreviewBadgeResponse> =
      (input, done) => this.communityBadgeValidationClient.previewBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityBadgeValidationServiceApi.PreviewBadgeRequest, communityBadgeValidationServiceApi.PreviewBadgeResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.etag ?? "") });
    return mergeResponses(
      surveysSurveyServiceApi.BatchCreateSurveysResponse.fromPartial({ result: { status: (reply1?.outcome?.status ?? "") } }),
      surveysSurveyServiceApi.BatchCreateSurveysResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          message: (reply2?.result?.message ?? ""),
        },
      }),
    );
  }

  /**
   * Returns several surveys at once.
   */
  async batchGetSurveys(req: surveysSurveyServiceApi.BatchGetSurveysRequest): Promise<surveysSurveyServiceApi.BatchGetSurveysResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchGetSurveys", req);
    this.logger.info("batch_get_surveys", { tenant: req.context.tenantId, trace: req.context.traceId });
    return surveysSurveyServiceApi.BatchGetSurveysResponse.fromPartial({});
  }

  /**
   * Creates a survey.
   */
  async cloneSurvey(req: surveysSurveyServiceApi.CloneSurveyRequest): Promise<surveysSurveyServiceApi.CloneSurveyResponse> {
    validateContext(req.context);
    if (req.survey) {
      await this.repository.save(toSurveyRecord(req.context.tenantId, req.survey));
    }
    await this.repository.record(req.context.tenantId, "CloneSurvey", req);
    this.logger.info("clone_survey", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptHistoryServiceApi.ListDeliveryAttemptVersionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.survey?.audit?.updatedAt,
        region: (req?.survey?.billingAddress?.region ?? ""),
      },
    });
    const method1 = "listDeliveryAttemptVersions" as const;
    const invoke1: Unary<notificationsDeliveryAttemptHistoryServiceApi.ListDeliveryAttemptVersionsRequest, notificationsDeliveryAttemptHistoryServiceApi.ListDeliveryAttemptVersionsResponse> =
      (input, done) => this.notificationsDeliveryAttemptHistoryClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptHistoryServiceApi.ListDeliveryAttemptVersionsRequest, notificationsDeliveryAttemptHistoryServiceApi.ListDeliveryAttemptVersionsResponse>(invoke1, request1);
    const request2 = surveysSurveyQueryServiceApi.LookupSurveyRequest.fromPartial({
      context: req?.context,
      surveyId: (req?.survey?.surveyId ?? ""),
    });
    const proxy2 = forwarding(this.surveysSurveyQueryClient);
    const invoke2: Unary<surveysSurveyQueryServiceApi.LookupSurveyRequest, surveysSurveyQueryServiceApi.LookupSurveyResponse> =
      (input, done) => proxy2.lookupSurvey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<surveysSurveyQueryServiceApi.LookupSurveyRequest, surveysSurveyQueryServiceApi.LookupSurveyResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      surveysSurveyServiceApi.CloneSurveyResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      surveysSurveyServiceApi.CloneSurveyResponse.fromPartial({ survey: { notes: (reply2?.survey?.notes ?? "") } }),
      surveysSurveyServiceApi.CloneSurveyResponse.fromPartial({
        survey: {
          billingAddress: req?.survey?.billingAddress,
          total: req?.survey?.total,
        },
      }),
    );
  }

  /**
   * Creates a survey.
   */
  async createSurvey(req: surveysSurveyServiceApi.CreateSurveyRequest): Promise<surveysSurveyServiceApi.CreateSurveyResponse> {
    validateContext(req.context);
    if (req.survey) {
      await this.repository.save(toSurveyRecord(req.context.tenantId, req.survey));
    }
    await this.repository.record(req.context.tenantId, "CreateSurvey", req);
    this.logger.info("create_survey", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyQueryServiceApi.LookupSurveyRequest.fromPartial({
      context: req?.context,
      surveyId: (req?.survey?.surveyId ?? ""),
    });
    const invoke1: Unary<surveysSurveyQueryServiceApi.LookupSurveyRequest, surveysSurveyQueryServiceApi.LookupSurveyResponse> =
      (input, done) => this.surveysSurveyQueryClient.lookupSurvey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysSurveyQueryServiceApi.LookupSurveyRequest, surveysSurveyQueryServiceApi.LookupSurveyResponse>(invoke1, request1);
    const request2 = surveysSurveyResponseQueryServiceApi.BrowseSurveyResponsesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.survey?.audit?.updatedAt,
        region: (reply1?.survey?.billingAddress?.region ?? ""),
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<surveysSurveyResponseQueryServiceApi.BrowseSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.BrowseSurveyResponsesResponse> =
      (input, done) => this.surveysSurveyResponseQueryClient.browseSurveyResponses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<surveysSurveyResponseQueryServiceApi.BrowseSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.BrowseSurveyResponsesResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      surveysSurveyServiceApi.CreateSurveyResponse.fromPartial({
        result: { status: (reply1?.result?.status ?? "") },
        survey: {
          counterparty: { questionId: (reply1?.survey?.counterparty?.questionId ?? "") },
        },
      }),
      surveysSurveyServiceApi.CreateSurveyResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      surveysSurveyServiceApi.CreateSurveyResponse.fromPartial({
        survey: {
          dueAt: req?.survey?.dueAt,
          surveyId: (req?.survey?.surveyId ?? ""),
        },
      }),
    );
  }

  /**
   * Deletes a survey.
   */
  async deleteSurvey(req: surveysSurveyServiceApi.DeleteSurveyRequest): Promise<surveysSurveyServiceApi.DeleteSurveyResponse> {
    validateContext(req.context);
    if (!req.surveyId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "survey_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeleteSurvey", req);
    this.logger.info("delete_survey", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = identityUserQueryServiceApi.ResolveUsersRequest.fromPartial({ context: input1?.context });
    const invoke1: Unary<identityUserQueryServiceApi.ResolveUsersRequest, identityUserQueryServiceApi.ResolveUsersResponse> =
      (input, done) => this.identityUserQueryClient.resolveUsers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<identityUserQueryServiceApi.ResolveUsersRequest, identityUserQueryServiceApi.ResolveUsersResponse>(invoke1, request1);
    const request2 = telematicsTelemetryReadingQueryServiceApi.ExportTelemetryReadingsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (reply1?.result?.correlationId ?? ""),
      },
    });
    const stream2 = this.telematicsTelemetryReadingQueryClient.exportTelemetryReadings(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? telematicsTelemetryReadingQueryServiceApi.ExportTelemetryReadingsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.etag ?? "") });
    return surveysSurveyServiceApi.DeleteSurveyResponse.fromPartial({
      result: {
        referenceIds: (reply1?.result?.referenceIds ?? []),
        status: (reply1?.result?.status ?? ""),
      },
    });
  }

  /**
   * Returns a survey.
   */
  async getSurvey(req: surveysSurveyServiceApi.GetSurveyRequest): Promise<surveysSurveyServiceApi.GetSurveyResponse> {
    validateContext(req.context);
    if (!req.surveyId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "survey_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetSurvey", req);
    this.logger.info("get_survey", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyQueryServiceApi.BrowseSurveysRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        ownerId: (req?.surveyId ?? ""),
      },
    });
    const cloned1: surveysSurveyQueryServiceApi.BrowseSurveysRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<surveysSurveyQueryServiceApi.BrowseSurveysRequest, surveysSurveyQueryServiceApi.BrowseSurveysResponse> =
      (input, done) => this.surveysSurveyQueryClient.browseSurveys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysSurveyQueryServiceApi.BrowseSurveysRequest, surveysSurveyQueryServiceApi.BrowseSurveysResponse>(invoke1, cloned1);
    const request2 = maintenanceWorkOrderQueryServiceApi.ResolveWorkOrdersRequest.fromPartial({ context: req?.context });
    const decoded2 = maintenanceWorkOrderQueryServiceApi.ResolveWorkOrdersRequest.fromJSON(
      JSON.parse(JSON.stringify(maintenanceWorkOrderQueryServiceApi.ResolveWorkOrdersRequest.toJSON(request2))),
    );
    const invoke2: Unary<maintenanceWorkOrderQueryServiceApi.ResolveWorkOrdersRequest, maintenanceWorkOrderQueryServiceApi.ResolveWorkOrdersResponse> =
      (input, done) => this.maintenanceWorkOrderQueryClient.resolveWorkOrders(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<maintenanceWorkOrderQueryServiceApi.ResolveWorkOrdersRequest, maintenanceWorkOrderQueryServiceApi.ResolveWorkOrdersResponse>(invoke2, decoded2);
    return mergeResponses(
      surveysSurveyServiceApi.GetSurveyResponse.fromPartial({
        result: {
          referenceIds: (reply1?.result?.referenceIds ?? []),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      surveysSurveyServiceApi.GetSurveyResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      surveysSurveyServiceApi.GetSurveyResponse.fromPartial({ survey: { surveyId: (req?.surveyId ?? "") } }),
    );
  }

  /**
   * Lists surveys a page at a time.
   */
  async listSurveys(req: surveysSurveyServiceApi.ListSurveysRequest): Promise<surveysSurveyServiceApi.ListSurveysResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListSurveys", req);
    this.logger.info("list_surveys", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookEndpointServiceApi.BatchGetWebhookEndpointsRequest.fromPartial({ context: req?.context });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.webhooks.v1.BatchGetWebhookEndpointsRequest",
      value: Buffer.from(webhooksWebhookEndpointServiceApi.BatchGetWebhookEndpointsRequest.encode(request1).finish()),
    });
    const unpacked1 = webhooksWebhookEndpointServiceApi.BatchGetWebhookEndpointsRequest.decode(envelope1.value);
    const invoke1: Unary<webhooksWebhookEndpointServiceApi.BatchGetWebhookEndpointsRequest, webhooksWebhookEndpointServiceApi.BatchGetWebhookEndpointsResponse> =
      (input, done) => this.webhooksWebhookEndpointClient.batchGetWebhookEndpoints(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookEndpointServiceApi.BatchGetWebhookEndpointsRequest, webhooksWebhookEndpointServiceApi.BatchGetWebhookEndpointsResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return surveysSurveyServiceApi.ListSurveysResponse.fromPartial({
      pageInfo: { nextPageToken: (reply1?.pageInfo?.nextPageToken ?? "") },
      result: { message: (reply1?.result?.message ?? "") },
    });
  }

  /**
   * Changes a survey.
   */
  async updateSurvey(req: surveysSurveyServiceApi.UpdateSurveyRequest): Promise<surveysSurveyServiceApi.UpdateSurveyResponse> {
    validateContext(req.context);
    if (req.survey) {
      await this.repository.save(toSurveyRecord(req.context.tenantId, req.survey));
    }
    await this.repository.record(req.context.tenantId, "UpdateSurvey", req);
    this.logger.info("update_survey", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyQueryServiceApi.CountSurveysRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.survey?.audit?.updatedAt,
        region: (req?.survey?.billingAddress?.region ?? ""),
      },
    });
    const client1 = this.clients.get<surveysSurveyQueryServiceApi.SurveyQueryServiceClient>("acme.surveys.v1.SurveyQueryService");
    const invoke1: Unary<surveysSurveyQueryServiceApi.CountSurveysRequest, surveysSurveyQueryServiceApi.CountSurveysResponse> =
      (input, done) => client1.countSurveys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysSurveyQueryServiceApi.CountSurveysRequest, surveysSurveyQueryServiceApi.CountSurveysResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.survey?.audit?.etag ?? "") });
    return mergeResponses(
      surveysSurveyServiceApi.UpdateSurveyResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      surveysSurveyServiceApi.UpdateSurveyResponse.fromPartial({
        survey: {
          dueAt: req?.survey?.dueAt,
          notes: (req?.survey?.notes ?? ""),
        },
      }),
    );
  }

  /**
   * Streams the changes of surveys as they happen.
   */
  async watchSurveys(req: surveysSurveyServiceApi.WatchSurveysRequest): Promise<surveysSurveyServiceApi.WatchSurveysResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "WatchSurveys", req);
    this.logger.info("watch_surveys", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysQuestionCalculationServiceApi.CalculateQuestionRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
      question: {
        owner: {
          email: (req?.subscriber?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<surveysQuestionCalculationServiceApi.CalculateQuestionRequest, surveysQuestionCalculationServiceApi.CalculateQuestionResponse> =
      (input, done) => this.surveysQuestionCalculationClient.calculateQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<surveysQuestionCalculationServiceApi.CalculateQuestionRequest, surveysQuestionCalculationServiceApi.CalculateQuestionResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = surveysSurveyQueryServiceApi.SummarizeSurveysRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
      context: req?.context,
      details: { period: reply1?.question?.effective },
      reason: ((reply1?.question?.action?.$case === "block" ? reply1?.question?.action.block : undefined)?.reason ?? ""),
    });
    const invoke2: Unary<surveysSurveyQueryServiceApi.SummarizeSurveysRequest, surveysSurveyQueryServiceApi.SummarizeSurveysResponse> =
      (input, done) => this.surveysSurveyQueryClient.summarizeSurveys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<surveysSurveyQueryServiceApi.SummarizeSurveysRequest, surveysSurveyQueryServiceApi.SummarizeSurveysResponse>(invoke2, request2));
    const request3 = surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseRequest.fromPartial({
      context: req?.context,
      surveyResponse: { subject: { email: (reply1?.question?.owner?.email ?? "") } },
    });
    const invoke3: Unary<surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseRequest, surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseResponse> =
      (input, done) => this.surveysSurveyResponseValidationClient.previewSurveyResponse(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await workflow("WatchSurveys.PreviewSurveyResponse", () => call<surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseRequest, surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.subscriber?.preferredChannel ?? "") });
    return mergeResponses(
      surveysSurveyServiceApi.WatchSurveysResponse.fromPartial({
        survey: {
          audit: {
            etag: (reply1?.question?.audit?.etag ?? ""),
            updatedAt: reply1?.question?.audit?.updatedAt,
          },
        },
      }),
      surveysSurveyServiceApi.WatchSurveysResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      surveysSurveyServiceApi.WatchSurveysResponse.fromPartial({ result: { status: (reply3?.outcome?.status ?? "") } }),
      surveysSurveyServiceApi.WatchSurveysResponse.fromPartial({ survey: { billingAddress: { region: (req?.filter?.region ?? "") } } }),
    );
  }
}
