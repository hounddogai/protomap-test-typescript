/**
 * Computes the figures of a transcode job, such as totals, taxes, and estimates. Remote work stays behind typed
 * client ports.
 */

import * as chatChatRoomCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_calculation_service.js";
import * as experimentsExperimentServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as formsFormValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_validation_service.js";
import * as mediaMediaAssetCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_calculation_service.js";
import * as mediaMediaAssetValidationServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_validation_service.js";
import * as mediaRenditionCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_calculation_service.js";
import * as mediaTranscodeJobCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_calculation_service.js";
import * as metricsMetricSeriesValidationServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_validation_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import * as surveysSurveyResponseValidationServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_response_validation_service.js";
import * as venuesVenueQueryServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_query_service.js";
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
  operation,
  promised,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toTranscodeJobRecord } from "../data/records.js";
import { MediaRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate transcode job operations and persist audit data.
 */
@injectable()
export class TranscodeJobCalculationWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.ChatRoomCalculationService") private readonly chatChatRoomCalculationClient: chatChatRoomCalculationServiceApi.ChatRoomCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentService") private readonly experimentsExperimentClient: experimentsExperimentServiceApi.ExperimentServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagQueryService") private readonly featureflagsFeatureFlagQueryClient: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient,
    @inject("grpc:acme.forms.v1.FormValidationService") private readonly formsFormValidationClient: formsFormValidationServiceApi.FormValidationServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetCalculationService") private readonly mediaMediaAssetCalculationClient: mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetValidationService") private readonly mediaMediaAssetValidationClient: mediaMediaAssetValidationServiceApi.MediaAssetValidationServiceClient,
    @inject("grpc:acme.media.v1.RenditionCalculationService") private readonly mediaRenditionCalculationClient: mediaRenditionCalculationServiceApi.RenditionCalculationServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesValidationService") private readonly metricsMetricSeriesValidationClient: metricsMetricSeriesValidationServiceApi.MetricSeriesValidationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileCalculationService") private readonly personalizationProfileCalculationClient: personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseValidationService") private readonly surveysSurveyResponseValidationClient: surveysSurveyResponseValidationServiceApi.SurveyResponseValidationServiceClient,
    @inject("grpc:acme.venues.v1.VenueQueryService") private readonly venuesVenueQueryClient: venuesVenueQueryServiceApi.VenueQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a transcode job.
   */
  async calculateTranscodeJob(req: mediaTranscodeJobCalculationServiceApi.CalculateTranscodeJobRequest): Promise<mediaTranscodeJobCalculationServiceApi.CalculateTranscodeJobResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "CalculateTranscodeJob", req);
    this.logger.info("calculate_transcode_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetValidationServiceApi.ExplainMediaAssetDecisionRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.transcodeJob?.requester?.email ?? ""),
          phone: (req?.transcodeJob?.requester?.phone ?? ""),
        },
      },
      mediaAsset: {
        locator: { $case: "address", address: { locality: (req?.details?.destination?.locality ?? "") } },
      },
    });
    const invoke1: Unary<mediaMediaAssetValidationServiceApi.ExplainMediaAssetDecisionRequest, mediaMediaAssetValidationServiceApi.ExplainMediaAssetDecisionResponse> =
      (input, done) => this.mediaMediaAssetValidationClient.explainMediaAssetDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    let selected2_2: string | undefined;
    switch (reply1?.mediaAsset?.locator?.$case) {
      case "address":
        selected2_2 = ((reply1?.mediaAsset?.locator?.$case === "address" ? reply1?.mediaAsset?.locator.address : undefined)?.countryCode ?? "");
        break;
      default:
        selected2_2 = "";
    }
    let selected2_3: string | undefined;
    switch (reply1?.mediaAsset?.locator?.$case) {
      case "address":
        selected2_3 = ((reply1?.mediaAsset?.locator?.$case === "address" ? reply1?.mediaAsset?.locator.address : undefined)?.recipient ?? "");
        break;
      default:
        selected2_3 = "";
    }
    let selected2_4: string | undefined;
    switch (reply1?.mediaAsset?.locator?.$case) {
      case "address":
        selected2_4 = ((reply1?.mediaAsset?.locator?.$case === "address" ? reply1?.mediaAsset?.locator.address : undefined)?.locality ?? "");
        break;
      default:
        selected2_4 = "";
    }
    const request2 = mediaRenditionCalculationServiceApi.EstimateRenditionRequest.fromPartial({
      context: req?.context,
      rendition: {
        locator: { $case: "address", address: {
          countryCode: (selected2_2 ?? ""),
          locality: (selected2_4 ?? ""),
          recipient: (selected2_3 ?? ""),
        } },
        dimensions: { length: (reply1?.mediaAsset?.dimensions?.length ?? 0) },
      },
    });
    const invoke2: Unary<mediaRenditionCalculationServiceApi.EstimateRenditionRequest, mediaRenditionCalculationServiceApi.EstimateRenditionResponse> =
      (input, done) => this.mediaRenditionCalculationClient.estimateRendition(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaRenditionCalculationServiceApi.EstimateRenditionRequest, mediaRenditionCalculationServiceApi.EstimateRenditionResponse>(invoke2, request2);
    const tasks3: Array<() => Promise<venuesVenueQueryServiceApi.SuggestVenuesResponse>> = [];
    for (const item of (req?.transcodeJob?.comments ?? [])) {
      tasks3.push(async () => {
        const request3 = venuesVenueQueryServiceApi.SuggestVenuesRequest.fromPartial({
          context: req?.context,
          filter: {
            createdAfter: item?.createdAt,
            labels: Object.fromEntries(Object.entries((req?.transcodeJob?.customFields ?? {}))),
            ownerId: (item?.commentId ?? ""),
            region: (req?.details?.destination?.region ?? ""),
          },
        });
        const invoke3: Unary<venuesVenueQueryServiceApi.SuggestVenuesRequest, venuesVenueQueryServiceApi.SuggestVenuesResponse> =
          (input, done) => this.venuesVenueQueryClient.suggestVenues(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply3 = await call<venuesVenueQueryServiceApi.SuggestVenuesRequest, venuesVenueQueryServiceApi.SuggestVenuesResponse>(invoke3, request3);
        return reply3;
      });
    }
    const results3 = await Promise.all(tasks3.map((task) => task()));
    const reply3 = results3.at(-1) ?? venuesVenueQueryServiceApi.SuggestVenuesResponse.fromPartial({});
    const request4 = chatChatRoomCalculationServiceApi.SimulateChatRoomRequest.fromPartial({
      chatRoom: {
        locator: { $case: "address", address: { region: (req?.details?.destination?.region ?? "") } },
        components: { primary: {
          componentId: (reply2?.rendition?.components?.["primary"]?.componentId ?? ""),
        } },
        dimensions: { unit: (reply1?.mediaAsset?.dimensions?.unit ?? "") },
        owner: {
          email: ((req?.transcodeJob?.origin?.$case === "customer" ? req?.transcodeJob?.origin.customer : undefined)?.email ?? ""),
        },
      },
      context: req?.context,
    });
    const method4 = "simulateChatRoom" as const;
    const invoke4: Unary<chatChatRoomCalculationServiceApi.SimulateChatRoomRequest, chatChatRoomCalculationServiceApi.SimulateChatRoomResponse> =
      (input, done) => this.chatChatRoomCalculationClient[method4](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<chatChatRoomCalculationServiceApi.SimulateChatRoomRequest, chatChatRoomCalculationServiceApi.SimulateChatRoomResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobCalculationServiceApi.CalculateTranscodeJobResponse.fromPartial({
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
        transcodeJob: { assignee: { email: (reply1?.mediaAsset?.owner?.email ?? "") } },
      }),
      mediaTranscodeJobCalculationServiceApi.CalculateTranscodeJobResponse.fromPartial({
        breakdown: { total: reply2?.breakdown?.total },
        transcodeJob: { assignee: { userId: (reply2?.rendition?.owner?.userId ?? "") } },
      }),
      mediaTranscodeJobCalculationServiceApi.CalculateTranscodeJobResponse.fromPartial({
        result: { status: (reply4?.result?.status ?? "") },
        transcodeJob: { tags: (reply4?.chatRoom?.tags ?? []) },
      }),
      mediaTranscodeJobCalculationServiceApi.CalculateTranscodeJobResponse.fromPartial({
        breakdown: { currencyCode: (req?.details?.currencyCode ?? "") },
        transcodeJob: { transcodeJobId: (req?.transcodeJobId ?? "") },
      }),
    );
  }

  /**
   * Compares a transcode job.
   */
  async compareTranscodeJobOptions(req: mediaTranscodeJobCalculationServiceApi.CompareTranscodeJobOptionsRequest): Promise<mediaTranscodeJobCalculationServiceApi.CompareTranscodeJobOptionsResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "CompareTranscodeJobOptions", req);
    this.logger.info("compare_transcode_job_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.transcodeJob?.comments ?? []).map(async (item) => {
      const request1 = metricsMetricSeriesValidationServiceApi.ExplainMetricSeriesDecisionRequest.fromPartial({
        context: req?.context,
        metricSeries: {
          audit: {
            createdAt: item?.createdAt,
            updatedBy: (req?.transcodeJob?.audit?.updatedBy ?? ""),
          },
          owner: { email: (item?.authorEmail ?? "") },
        },
      });
      const invoke1: Unary<metricsMetricSeriesValidationServiceApi.ExplainMetricSeriesDecisionRequest, metricsMetricSeriesValidationServiceApi.ExplainMetricSeriesDecisionResponse> =
        (input, done) => this.metricsMetricSeriesValidationClient.explainMetricSeriesDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<metricsMetricSeriesValidationServiceApi.ExplainMetricSeriesDecisionRequest, metricsMetricSeriesValidationServiceApi.ExplainMetricSeriesDecisionResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? metricsMetricSeriesValidationServiceApi.ExplainMetricSeriesDecisionResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mediaTranscodeJobCalculationServiceApi.CompareTranscodeJobOptionsResponse.fromPartial({
      transcodeJob: {
        priority: (req?.transcodeJob?.priority ?? 0),
        transcodeJobId: (req?.transcodeJobId ?? ""),
      },
    });
  }

  /**
   * Estimates a transcode job.
   */
  async estimateTranscodeJob(req: mediaTranscodeJobCalculationServiceApi.EstimateTranscodeJobRequest): Promise<mediaTranscodeJobCalculationServiceApi.EstimateTranscodeJobResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "EstimateTranscodeJob", req);
    this.logger.info("estimate_transcode_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileCalculationServiceApi.RecalculateProfilesRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: (req?.details?.destination?.lines ?? []).map((value) => value),
          postalCode: (req?.details?.destination?.postalCode ?? ""),
        },
      },
      profile: {
        audit: { createdAt: req?.transcodeJob?.audit?.createdAt },
        primaryAddress: { recipient: (req?.details?.destination?.recipient ?? "") },
      },
    });
    const proxy1 = forwarding(this.personalizationProfileCalculationClient);
    const invoke1: Unary<personalizationProfileCalculationServiceApi.RecalculateProfilesRequest, personalizationProfileCalculationServiceApi.RecalculateProfilesResponse> =
      (input, done) => proxy1.recalculateProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileCalculationServiceApi.RecalculateProfilesRequest, personalizationProfileCalculationServiceApi.RecalculateProfilesResponse>(invoke1, request1);
    let selected2_3: string | undefined;
    switch (req?.transcodeJob?.origin?.$case) {
      case "customer":
        selected2_3 = ((req?.transcodeJob?.origin?.$case === "customer" ? req?.transcodeJob?.origin.customer : undefined)?.customerId ?? "");
        break;
      default:
        selected2_3 = "";
    }
    const request2 = experimentsExperimentServiceApi.SearchExperimentsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.profile?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.profile?.attributes ?? {}))),
        ownerId: (selected2_3 ?? ""),
        region: (reply1?.profile?.primaryAddress?.region ?? ""),
      },
    });
    const invoke2: Unary<experimentsExperimentServiceApi.SearchExperimentsRequest, experimentsExperimentServiceApi.SearchExperimentsResponse> =
      (input, done) => this.experimentsExperimentClient.searchExperiments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExperimentServiceApi.SearchExperimentsRequest, experimentsExperimentServiceApi.SearchExperimentsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobCalculationServiceApi.EstimateTranscodeJobResponse.fromPartial({
        result: { status: (reply1?.result?.status ?? "") },
        transcodeJob: {
          requester: { email: (reply1?.profile?.relationshipManager?.email ?? "") },
        },
      }),
      mediaTranscodeJobCalculationServiceApi.EstimateTranscodeJobResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      mediaTranscodeJobCalculationServiceApi.EstimateTranscodeJobResponse.fromPartial({
        transcodeJob: {
          priority: (req?.transcodeJob?.priority ?? 0),
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a transcode job.
   */
  async explainTranscodeJobCalculation(req: mediaTranscodeJobCalculationServiceApi.ExplainTranscodeJobCalculationRequest): Promise<mediaTranscodeJobCalculationServiceApi.ExplainTranscodeJobCalculationResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "ExplainTranscodeJobCalculation", req);
    this.logger.info("explain_transcode_job_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionCalculationServiceApi.QuoteRenditionRequest.fromPartial({
      context: req?.context,
      rendition: {
        audit: {
          createdBy: (req?.transcodeJob?.audit?.createdBy ?? ""),
          etag: (req?.transcodeJob?.audit?.etag ?? ""),
        },
        owner: { email: (req?.transcodeJob?.requester?.email ?? "") },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<mediaRenditionCalculationServiceApi.QuoteRenditionRequest, mediaRenditionCalculationServiceApi.QuoteRenditionResponse> =
      (input, done) => this.mediaRenditionCalculationClient.quoteRendition(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaRenditionCalculationServiceApi.QuoteRenditionRequest, mediaRenditionCalculationServiceApi.QuoteRenditionResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = mediaRenditionCalculationServiceApi.CompareRenditionOptionsRequest.fromPartial({
      context: input2?.context,
      details: {
        destination: {
          recipient: ((reply1?.rendition?.locator?.$case === "address" ? reply1?.rendition?.locator.address : undefined)?.recipient ?? ""),
        },
      },
      rendition: {
        audit: { updatedAt: input2?.transcodeJob?.audit?.updatedAt },
        dimensions: {
          length: (reply1?.rendition?.dimensions?.length ?? 0),
          width: (reply1?.rendition?.dimensions?.width ?? 0),
        },
      },
    });
    const invoke2: Unary<mediaRenditionCalculationServiceApi.CompareRenditionOptionsRequest, mediaRenditionCalculationServiceApi.CompareRenditionOptionsResponse> =
      (input, done) => this.mediaRenditionCalculationClient.compareRenditionOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaRenditionCalculationServiceApi.CompareRenditionOptionsRequest, mediaRenditionCalculationServiceApi.CompareRenditionOptionsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobCalculationServiceApi.ExplainTranscodeJobCalculationResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      mediaTranscodeJobCalculationServiceApi.ExplainTranscodeJobCalculationResponse.fromPartial({
        transcodeJob: { audit: { updatedAt: reply2?.rendition?.audit?.updatedAt } },
      }),
      mediaTranscodeJobCalculationServiceApi.ExplainTranscodeJobCalculationResponse.fromPartial({
        transcodeJob: {
          assignee: req?.transcodeJob?.assignee,
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a transcode job.
   */
  async getTranscodeJobRates(req: mediaTranscodeJobCalculationServiceApi.GetTranscodeJobRatesRequest): Promise<mediaTranscodeJobCalculationServiceApi.GetTranscodeJobRatesResponse> {
    validateContext(req.context);
    if (!req.transcodeJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "transcode_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetTranscodeJobRates", req);
    this.logger.info("get_transcode_job_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionCalculationServiceApi.QuoteRenditionRequest.fromPartial({
      context: req?.context,
      rendition: {
        audit: { updatedAt: req?.context?.deadline },
        components: { primary: { componentId: (req?.transcodeJobId ?? "") } },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const cloned1: mediaRenditionCalculationServiceApi.QuoteRenditionRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<mediaRenditionCalculationServiceApi.QuoteRenditionRequest, mediaRenditionCalculationServiceApi.QuoteRenditionResponse> =
      (input, done) => this.mediaRenditionCalculationClient.quoteRendition(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaRenditionCalculationServiceApi.QuoteRenditionRequest, mediaRenditionCalculationServiceApi.QuoteRenditionResponse>(invoke1, cloned1);
    const request2 = metricsMetricSeriesValidationServiceApi.NormalizeMetricSeriesRequest.fromPartial({
      context: req?.context,
      metricSeries: { dimensions: { length: (reply1?.rendition?.dimensions?.length ?? 0) } },
    });
    const decoded2 = metricsMetricSeriesValidationServiceApi.NormalizeMetricSeriesRequest.fromJSON(
      JSON.parse(JSON.stringify(metricsMetricSeriesValidationServiceApi.NormalizeMetricSeriesRequest.toJSON(request2))),
    );
    const invoke2: Unary<metricsMetricSeriesValidationServiceApi.NormalizeMetricSeriesRequest, metricsMetricSeriesValidationServiceApi.NormalizeMetricSeriesResponse> =
      (input, done) => this.metricsMetricSeriesValidationClient.normalizeMetricSeries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<metricsMetricSeriesValidationServiceApi.NormalizeMetricSeriesRequest, metricsMetricSeriesValidationServiceApi.NormalizeMetricSeriesResponse>(invoke2, decoded2);
    return mergeResponses(
      mediaTranscodeJobCalculationServiceApi.GetTranscodeJobRatesResponse.fromPartial({
        transcodeJob: {
          assignee: { email: (reply1?.rendition?.owner?.email ?? "") },
          audit: { updatedBy: (reply1?.rendition?.audit?.updatedBy ?? "") },
        },
      }),
      mediaTranscodeJobCalculationServiceApi.GetTranscodeJobRatesResponse.fromPartial({
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
        transcodeJob: { audit: { updatedBy: (reply2?.metricSeries?.audit?.updatedBy ?? "") } },
      }),
      mediaTranscodeJobCalculationServiceApi.GetTranscodeJobRatesResponse.fromPartial({ transcodeJob: { transcodeJobId: (req?.transcodeJobId ?? "") } }),
    );
  }

  /**
   * Quotes a transcode job.
   */
  async quoteTranscodeJob(req: mediaTranscodeJobCalculationServiceApi.QuoteTranscodeJobRequest): Promise<mediaTranscodeJobCalculationServiceApi.QuoteTranscodeJobResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "QuoteTranscodeJob", req);
    this.logger.info("quote_transcode_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseRequest.fromPartial({
      context: req?.context,
      surveyResponse: {
        subject: {
          email: ((req?.transcodeJob?.origin?.$case === "customer" ? req?.transcodeJob?.origin.customer : undefined)?.email ?? ""),
        },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.surveys.v1.NormalizeSurveyResponseRequest",
      value: Buffer.from(surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseRequest.encode(request1).finish()),
    });
    const unpacked1 = surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseRequest.decode(envelope1.value);
    const invoke1: Unary<surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseRequest, surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseResponse> =
      (input, done) => this.surveysSurveyResponseValidationClient.normalizeSurveyResponse(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseRequest, surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseResponse>(invoke1, unpacked1);
    const request2 = mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: (req?.details?.destination?.lines ?? []).map((value) => value),
          recipient: (req?.details?.destination?.recipient ?? ""),
        },
      },
      mediaAsset: {
        locator: { $case: "address", address: {
          locality: (req?.details?.destination?.locality ?? ""),
          region: (req?.details?.destination?.region ?? ""),
        } },
      },
    });
    const client2 = this.clients.get<mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient>("acme.media.v1.MediaAssetCalculationService");
    const invoke2: Unary<mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest, mediaMediaAssetCalculationServiceApi.QuoteMediaAssetResponse> =
      (input, done) => client2.quoteMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest, mediaMediaAssetCalculationServiceApi.QuoteMediaAssetResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobCalculationServiceApi.QuoteTranscodeJobResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      mediaTranscodeJobCalculationServiceApi.QuoteTranscodeJobResponse.fromPartial({ breakdown: { total: reply2?.breakdown?.total } }),
      mediaTranscodeJobCalculationServiceApi.QuoteTranscodeJobResponse.fromPartial({
        transcodeJob: {
          assignee: req?.transcodeJob?.assignee,
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Recalculates a transcode job.
   */
  async recalculateTranscodeJobs(req: mediaTranscodeJobCalculationServiceApi.RecalculateTranscodeJobsRequest): Promise<mediaTranscodeJobCalculationServiceApi.RecalculateTranscodeJobsResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "RecalculateTranscodeJobs", req);
    this.logger.info("recalculate_transcode_jobs", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionCalculationServiceApi.CalculateRenditionRequest.fromPartial({
      context: req?.context,
      rendition: { audit: { etag: (req?.transcodeJob?.audit?.etag ?? "") } },
    });
    const invoke1: Unary<mediaRenditionCalculationServiceApi.CalculateRenditionRequest, mediaRenditionCalculationServiceApi.CalculateRenditionResponse> =
      (input, done) => this.mediaRenditionCalculationClient.calculateRendition(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<mediaRenditionCalculationServiceApi.CalculateRenditionRequest, mediaRenditionCalculationServiceApi.CalculateRenditionResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = personalizationProfileCalculationServiceApi.SimulateProfileRequest.fromPartial({
      context: req?.context,
      profile: {
        contact: {
          email: ((req?.transcodeJob?.origin?.$case === "customer" ? req?.transcodeJob?.origin.customer : undefined)?.email ?? ""),
          preferredChannel: (req?.transcodeJob?.requester?.preferredChannel ?? ""),
        },
      },
    });
    const invoke2: Unary<personalizationProfileCalculationServiceApi.SimulateProfileRequest, personalizationProfileCalculationServiceApi.SimulateProfileResponse> =
      (input, done) => this.personalizationProfileCalculationClient.simulateProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<personalizationProfileCalculationServiceApi.SimulateProfileRequest, personalizationProfileCalculationServiceApi.SimulateProfileResponse>(invoke2, request2));
    const request3 = featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
    });
    const invoke3: Unary<featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagQueryClient.summarizeFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await workflow("RecalculateTranscodeJobs.SummarizeFeatureFlags", () => call<featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobCalculationServiceApi.RecalculateTranscodeJobsResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      mediaTranscodeJobCalculationServiceApi.RecalculateTranscodeJobsResponse.fromPartial({
        transcodeJob: {
          audit: { createdAt: reply2?.profile?.audit?.createdAt },
          requester: { email: (reply2?.profile?.relationshipManager?.email ?? "") },
        },
      }),
      mediaTranscodeJobCalculationServiceApi.RecalculateTranscodeJobsResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      mediaTranscodeJobCalculationServiceApi.RecalculateTranscodeJobsResponse.fromPartial({
        transcodeJob: {
          priority: (req?.transcodeJob?.priority ?? 0),
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Simulates a transcode job.
   */
  async simulateTranscodeJob(req: mediaTranscodeJobCalculationServiceApi.SimulateTranscodeJobRequest): Promise<mediaTranscodeJobCalculationServiceApi.SimulateTranscodeJobResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "SimulateTranscodeJob", req);
    this.logger.info("simulate_transcode_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormValidationServiceApi.CheckFormEligibilityRequest.fromPartial({
      context: req?.context,
      form: {
        audit: { updatedBy: (req?.transcodeJob?.audit?.updatedBy ?? "") },
        counterparty: {
          email: ((req?.transcodeJob?.origin?.$case === "customer" ? req?.transcodeJob?.origin.customer : undefined)?.email ?? ""),
        },
      },
    });
    const invoke1: Unary<formsFormValidationServiceApi.CheckFormEligibilityRequest, formsFormValidationServiceApi.CheckFormEligibilityResponse> =
      (input, done) => this.formsFormValidationClient.checkFormEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        locator: { $case: "address", address: {
          countryCode: (reply1?.form?.billingAddress?.countryCode ?? ""),
          lines: (req?.details?.destination?.lines ?? []).map((value) => value),
          locality: (reply1?.form?.billingAddress?.locality ?? ""),
        } },
        audit: { createdAt: req?.transcodeJob?.audit?.createdAt },
      },
    });
    const reply2 = await this.workQueue.enqueue<mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsRequest, mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsResponse>(
      "acme.media.v1.TranscodeJobCalculationService/SimulateTranscodeJob:1", request2,
    );
    const settled3 = await Promise.allSettled((req?.transcodeJob?.comments ?? []).map(async (item) => {
      const request3 = mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest.fromPartial({
        context: req?.context,
        details: {
          destination: {
            lines: ((reply2?.mediaAsset?.locator?.$case === "address" ? reply2?.mediaAsset?.locator.address : undefined)?.lines ?? []).map((value) => value),
          },
        },
        rendition: {
          audit: { createdAt: item?.createdAt },
          owner: { email: (item?.authorEmail ?? "") },
        },
      });
      const invoke3: Unary<mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest, mediaRenditionCalculationServiceApi.RecalculateRenditionsResponse> =
        (input, done) => this.mediaRenditionCalculationClient.recalculateRenditions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest, mediaRenditionCalculationServiceApi.RecalculateRenditionsResponse>(invoke3, request3);
      return reply3;
    }));
    const results3: mediaRenditionCalculationServiceApi.RecalculateRenditionsResponse[] = [];
    for (const result of settled3) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results3.push(result.value);
    }
    const reply3 = results3.at(-1) ?? mediaRenditionCalculationServiceApi.RecalculateRenditionsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobCalculationServiceApi.SimulateTranscodeJobResponse.fromPartial({ transcodeJob: { audit: { etag: (reply1?.form?.audit?.etag ?? "") } } }),
      mediaTranscodeJobCalculationServiceApi.SimulateTranscodeJobResponse.fromPartial({ breakdown: { currencyCode: (reply2?.breakdown?.currencyCode ?? "") } }),
      mediaTranscodeJobCalculationServiceApi.SimulateTranscodeJobResponse.fromPartial({
        transcodeJob: {
          status: req?.transcodeJob?.status,
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for TranscodeJobCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class TranscodeJobCalculationHandler {
  constructor(@inject(TranscodeJobCalculationWorkflow) private readonly workflow: TranscodeJobCalculationWorkflow) {}

  /**
   * Calculates a transcode job.
   */
  calculateTranscodeJob = unary<mediaTranscodeJobCalculationServiceApi.CalculateTranscodeJobRequest, mediaTranscodeJobCalculationServiceApi.CalculateTranscodeJobResponse>(
    (request) => this.workflow.calculateTranscodeJob(request),
  );

  /**
   * Compares a transcode job.
   */
  compareTranscodeJobOptions = unary<mediaTranscodeJobCalculationServiceApi.CompareTranscodeJobOptionsRequest, mediaTranscodeJobCalculationServiceApi.CompareTranscodeJobOptionsResponse>(
    (request) => this.workflow.compareTranscodeJobOptions(request),
  );

  /**
   * Estimates a transcode job.
   */
  estimateTranscodeJob = (call: ServerUnaryCall<mediaTranscodeJobCalculationServiceApi.EstimateTranscodeJobRequest, mediaTranscodeJobCalculationServiceApi.EstimateTranscodeJobResponse>, done: sendUnaryData<mediaTranscodeJobCalculationServiceApi.EstimateTranscodeJobResponse>): void => {
    void this.workflow.estimateTranscodeJob(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Explains a transcode job.
   */
  explainTranscodeJobCalculation = unary<mediaTranscodeJobCalculationServiceApi.ExplainTranscodeJobCalculationRequest, mediaTranscodeJobCalculationServiceApi.ExplainTranscodeJobCalculationResponse>(
    (request) => this.workflow.explainTranscodeJobCalculation(request),
  );

  /**
   * Returns a transcode job.
   */
  getTranscodeJobRates = unary<mediaTranscodeJobCalculationServiceApi.GetTranscodeJobRatesRequest, mediaTranscodeJobCalculationServiceApi.GetTranscodeJobRatesResponse>(
    (request) => this.workflow.getTranscodeJobRates(request),
  );

  /**
   * Quotes a transcode job.
   */
  quoteTranscodeJob = (call: ServerUnaryCall<mediaTranscodeJobCalculationServiceApi.QuoteTranscodeJobRequest, mediaTranscodeJobCalculationServiceApi.QuoteTranscodeJobResponse>, done: sendUnaryData<mediaTranscodeJobCalculationServiceApi.QuoteTranscodeJobResponse>): void => {
    void this.workflow.quoteTranscodeJob(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Recalculates a transcode job.
   */
  recalculateTranscodeJobs = unary<mediaTranscodeJobCalculationServiceApi.RecalculateTranscodeJobsRequest, mediaTranscodeJobCalculationServiceApi.RecalculateTranscodeJobsResponse>(
    (request) => this.workflow.recalculateTranscodeJobs(request),
  );

  /**
   * Simulates a transcode job.
   */
  simulateTranscodeJob = unary<mediaTranscodeJobCalculationServiceApi.SimulateTranscodeJobRequest, mediaTranscodeJobCalculationServiceApi.SimulateTranscodeJobResponse>(
    (request) => this.workflow.simulateTranscodeJob(request),
  );
}

export function implementation(handler: TranscodeJobCalculationHandler): mediaTranscodeJobCalculationServiceApi.TranscodeJobCalculationServiceServer {
  return {
    calculateTranscodeJob: handler.calculateTranscodeJob,
    compareTranscodeJobOptions: handler.compareTranscodeJobOptions,
    estimateTranscodeJob: handler.estimateTranscodeJob,
    explainTranscodeJobCalculation: handler.explainTranscodeJobCalculation,
    getTranscodeJobRates: handler.getTranscodeJobRates,
    quoteTranscodeJob: handler.quoteTranscodeJob,
    recalculateTranscodeJobs: handler.recalculateTranscodeJobs,
    simulateTranscodeJob: handler.simulateTranscodeJob,
  };
}
