/**
 * Checks transcode jobs against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as authorizationAccessPolicyQueryServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_query_service.js";
import * as experimentsExposureValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_validation_service.js";
import * as formsFormValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_validation_service.js";
import * as ledgerLedgerAccountServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_service.js";
import * as mediaMediaAssetCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_calculation_service.js";
import * as mediaMediaAssetValidationServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_validation_service.js";
import * as mediaRenditionCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_calculation_service.js";
import * as mediaTranscodeJobCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_calculation_service.js";
import * as mediaTranscodeJobValidationServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_validation_service.js";
import * as notificationsDeliveryAttemptAdminServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_admin_service.js";
import * as notificationsNotificationValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_validation_service.js";
import * as personalizationProfileQueryServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_query_service.js";
import * as personalizationRecommendationCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_calculation_service.js";
import * as surveysSurveyResponseQueryServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_response_query_service.js";
import * as webhooksWebhookEndpointServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  operation,
  retry,
  type RequestPort,
  type Unary,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toTranscodeJobRecord } from "../data/records.js";
import { MediaRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate transcode job operations and persist audit data.
 */
@injectable()
export class TranscodeJobValidationWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyQueryService") private readonly authorizationAccessPolicyQueryClient: authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureValidationService") private readonly experimentsExposureValidationClient: experimentsExposureValidationServiceApi.ExposureValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormValidationService") private readonly formsFormValidationClient: formsFormValidationServiceApi.FormValidationServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountService") private readonly ledgerLedgerAccountClient: ledgerLedgerAccountServiceApi.LedgerAccountServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetCalculationService") private readonly mediaMediaAssetCalculationClient: mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetValidationService") private readonly mediaMediaAssetValidationClient: mediaMediaAssetValidationServiceApi.MediaAssetValidationServiceClient,
    @inject("grpc:acme.media.v1.RenditionCalculationService") private readonly mediaRenditionCalculationClient: mediaRenditionCalculationServiceApi.RenditionCalculationServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobCalculationService") private readonly mediaTranscodeJobCalculationClient: mediaTranscodeJobCalculationServiceApi.TranscodeJobCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptAdminService") private readonly notificationsDeliveryAttemptAdminClient: notificationsDeliveryAttemptAdminServiceApi.DeliveryAttemptAdminServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationValidationService") private readonly notificationsNotificationValidationClient: notificationsNotificationValidationServiceApi.NotificationValidationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileQueryService") private readonly personalizationProfileQueryClient: personalizationProfileQueryServiceApi.ProfileQueryServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationCalculationService") private readonly personalizationRecommendationCalculationClient: personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseQueryService") private readonly surveysSurveyResponseQueryClient: surveysSurveyResponseQueryServiceApi.SurveyResponseQueryServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointService") private readonly webhooksWebhookEndpointClient: webhooksWebhookEndpointServiceApi.WebhookEndpointServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a transcode job.
   */
  async checkTranscodeJobEligibility(req: mediaTranscodeJobValidationServiceApi.CheckTranscodeJobEligibilityRequest): Promise<mediaTranscodeJobValidationServiceApi.CheckTranscodeJobEligibilityResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "CheckTranscodeJobEligibility", req);
    this.logger.info("check_transcode_job_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_2: string | undefined;
    switch (req?.transcodeJob?.origin?.$case) {
      case "channel":
        selected1_2 = ((req?.transcodeJob?.origin?.$case === "channel" ? req?.transcodeJob?.origin.channel : undefined)?.address ?? "");
        break;
      default:
        selected1_2 = "";
    }
    let selected1_4: string | undefined;
    switch (req?.transcodeJob?.origin?.$case) {
      case "customer":
        selected1_4 = ((req?.transcodeJob?.origin?.$case === "customer" ? req?.transcodeJob?.origin.customer : undefined)?.displayName ?? "");
        break;
      default:
        selected1_4 = "";
    }
    const request1 = mediaTranscodeJobCalculationServiceApi.SimulateTranscodeJobRequest.fromPartial({
      context: req?.context,
      transcodeJob: {
        assignee: { displayName: (selected1_4 ?? "") },
        origin: { $case: "channel", channel: { address: (selected1_2 ?? "") } },
        requester: { email: (req?.details?.contact?.email ?? "") },
        sla: { policyId: (req?.transcodeJob?.sla?.policyId ?? "") },
      },
    });
    const invoke1: Unary<mediaTranscodeJobCalculationServiceApi.SimulateTranscodeJobRequest, mediaTranscodeJobCalculationServiceApi.SimulateTranscodeJobResponse> =
      (input, done) => this.mediaTranscodeJobCalculationClient.simulateTranscodeJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaTranscodeJobCalculationServiceApi.SimulateTranscodeJobRequest, mediaTranscodeJobCalculationServiceApi.SimulateTranscodeJobResponse>(invoke1, request1);
    const request2 = notificationsNotificationValidationServiceApi.CheckNotificationEligibilityRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.contact?.email ?? "") } },
      notification: { assignee: { userId: (req?.transcodeJob?.assignee?.userId ?? "") } },
    });
    const method2 = "checkNotificationEligibility" as const;
    const invoke2: Unary<notificationsNotificationValidationServiceApi.CheckNotificationEligibilityRequest, notificationsNotificationValidationServiceApi.CheckNotificationEligibilityResponse> =
      (input, done) => this.notificationsNotificationValidationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationValidationServiceApi.CheckNotificationEligibilityRequest, notificationsNotificationValidationServiceApi.CheckNotificationEligibilityResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobValidationServiceApi.CheckTranscodeJobEligibilityResponse.fromPartial({
        transcodeJob: {
          requester: {
            email: ((reply1?.transcodeJob?.origin?.$case === "customer" ? reply1?.transcodeJob?.origin.customer : undefined)?.email ?? ""),
          },
        },
      }),
      mediaTranscodeJobValidationServiceApi.CheckTranscodeJobEligibilityResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      mediaTranscodeJobValidationServiceApi.CheckTranscodeJobEligibilityResponse.fromPartial({
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
  async getTranscodeJobRules(req: mediaTranscodeJobValidationServiceApi.GetTranscodeJobRulesRequest): Promise<mediaTranscodeJobValidationServiceApi.GetTranscodeJobRulesResponse> {
    validateContext(req.context);
    if (!req.transcodeJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "transcode_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetTranscodeJobRules", req);
    this.logger.info("get_transcode_job_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureValidationServiceApi.PreviewExposureRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.context?.actor?.email ?? "") } },
    });
    const proxy1 = forwarding(this.experimentsExposureValidationClient);
    const invoke1: Unary<experimentsExposureValidationServiceApi.PreviewExposureRequest, experimentsExposureValidationServiceApi.PreviewExposureResponse> =
      (input, done) => proxy1.previewExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExposureValidationServiceApi.PreviewExposureRequest, experimentsExposureValidationServiceApi.PreviewExposureResponse>(invoke1, request1);
    const request2 = mediaRenditionCalculationServiceApi.SimulateRenditionRequest.fromPartial({
      context: req?.context,
      rendition: {
        owner: { displayName: (reply1?.exposure?.subject?.displayName ?? "") },
      },
    });
    const invoke2: Unary<mediaRenditionCalculationServiceApi.SimulateRenditionRequest, mediaRenditionCalculationServiceApi.SimulateRenditionResponse> =
      (input, done) => this.mediaRenditionCalculationClient.simulateRendition(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaRenditionCalculationServiceApi.SimulateRenditionRequest, mediaRenditionCalculationServiceApi.SimulateRenditionResponse>(invoke2, request2);
    return mergeResponses(
      mediaTranscodeJobValidationServiceApi.GetTranscodeJobRulesResponse.fromPartial({ result: { message: (reply1?.outcome?.message ?? "") } }),
      mediaTranscodeJobValidationServiceApi.GetTranscodeJobRulesResponse.fromPartial({
        transcodeJob: { requester: { email: (reply2?.rendition?.owner?.email ?? "") } },
      }),
      mediaTranscodeJobValidationServiceApi.GetTranscodeJobRulesResponse.fromPartial({ transcodeJob: { transcodeJobId: (req?.transcodeJobId ?? "") } }),
    );
  }

  /**
   * Lints a transcode job.
   */
  async lintTranscodeJobs(req: mediaTranscodeJobValidationServiceApi.LintTranscodeJobsRequest): Promise<mediaTranscodeJobValidationServiceApi.LintTranscodeJobsResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "LintTranscodeJobs", req);
    this.logger.info("lint_transcode_jobs", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptAdminServiceApi.RepairDeliveryAttemptRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      deliveryAttempt: {
        measurements: [{ observedAt: req?.transcodeJob?.audit?.updatedAt }],
        subject: {
          displayName: ((req?.transcodeJob?.origin?.$case === "customer" ? req?.transcodeJob?.origin.customer : undefined)?.displayName ?? ""),
        },
      },
      reason: (req?.reason ?? ""),
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<notificationsDeliveryAttemptAdminServiceApi.RepairDeliveryAttemptRequest, notificationsDeliveryAttemptAdminServiceApi.RepairDeliveryAttemptResponse> =
      (input, done) => this.notificationsDeliveryAttemptAdminClient.repairDeliveryAttempt(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptAdminServiceApi.RepairDeliveryAttemptRequest, notificationsDeliveryAttemptAdminServiceApi.RepairDeliveryAttemptResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = mediaTranscodeJobCalculationServiceApi.GetTranscodeJobRatesRequest.fromPartial({
      context: input2?.context,
      transcodeJobId: (input2?.transcodeJob?.transcodeJobId ?? ""),
    });
    const invoke2: Unary<mediaTranscodeJobCalculationServiceApi.GetTranscodeJobRatesRequest, mediaTranscodeJobCalculationServiceApi.GetTranscodeJobRatesResponse> =
      (input, done) => this.mediaTranscodeJobCalculationClient.getTranscodeJobRates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaTranscodeJobCalculationServiceApi.GetTranscodeJobRatesRequest, mediaTranscodeJobCalculationServiceApi.GetTranscodeJobRatesResponse>(invoke2, request2);
    let selected3_3: string | undefined;
    switch (req?.transcodeJob?.origin?.$case) {
      case "customer":
        selected3_3 = ((req?.transcodeJob?.origin?.$case === "customer" ? req?.transcodeJob?.origin.customer : undefined)?.displayName ?? "");
        break;
      default:
        selected3_3 = "";
    }
    const request3 = ledgerLedgerAccountServiceApi.CloneLedgerAccountRequest.fromPartial({
      context: req?.context,
      ledgerAccount: {
        audit: {
          createdBy: (reply2?.transcodeJob?.audit?.createdBy ?? ""),
          etag: (req?.transcodeJob?.audit?.etag ?? ""),
          updatedAt: req?.transcodeJob?.audit?.updatedAt,
        },
        holder: { displayName: (selected3_3 ?? "") },
      },
    });
    const invoke3: Unary<ledgerLedgerAccountServiceApi.CloneLedgerAccountRequest, ledgerLedgerAccountServiceApi.CloneLedgerAccountResponse> =
      (input, done) => this.ledgerLedgerAccountClient.cloneLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<ledgerLedgerAccountServiceApi.CloneLedgerAccountRequest, ledgerLedgerAccountServiceApi.CloneLedgerAccountResponse>(invoke3, request3);
    const results4 = await Promise.all((req?.transcodeJob?.history ?? []).map(async (item) => {
      const request4 = webhooksWebhookEndpointServiceApi.WatchWebhookEndpointsRequest.fromPartial({
        context: req?.context,
        filter: { createdAfter: item?.changedAt },
        subscriber: {
          email: ((req?.transcodeJob?.origin?.$case === "customer" ? req?.transcodeJob?.origin.customer : undefined)?.email ?? ""),
          name: reply2?.transcodeJob?.requester?.name,
          phone: (req?.transcodeJob?.requester?.phone ?? ""),
        },
      });
      const stream4 = this.webhooksWebhookEndpointClient.watchWebhookEndpoints(request4, metadataFor(request4.context), { deadline: Date.now() + 15_000 });
      const messages4 = await collect(stream4);
      const reply4 = messages4.at(-1) ?? webhooksWebhookEndpointServiceApi.WatchWebhookEndpointsResponse.fromPartial({});
      return reply4;
    }));
    const reply4 = results4.at(-1) ?? webhooksWebhookEndpointServiceApi.WatchWebhookEndpointsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.details?.contact?.preferredChannel ?? "") });
    return mergeResponses(
      mediaTranscodeJobValidationServiceApi.LintTranscodeJobsResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      mediaTranscodeJobValidationServiceApi.LintTranscodeJobsResponse.fromPartial({
        transcodeJob: {
          assignee: { displayName: (reply2?.transcodeJob?.assignee?.displayName ?? "") },
          status: reply2?.transcodeJob?.status,
        },
      }),
      mediaTranscodeJobValidationServiceApi.LintTranscodeJobsResponse.fromPartial({
        transcodeJob: {
          audit: {
            updatedAt: reply3?.ledgerAccount?.audit?.updatedAt,
            updatedBy: (reply3?.ledgerAccount?.audit?.updatedBy ?? ""),
          },
        },
      }),
      mediaTranscodeJobValidationServiceApi.LintTranscodeJobsResponse.fromPartial({
        transcodeJob: {
          subject: (req?.transcodeJob?.subject ?? ""),
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Normalizes a transcode job.
   */
  async normalizeTranscodeJob(req: mediaTranscodeJobValidationServiceApi.NormalizeTranscodeJobRequest): Promise<mediaTranscodeJobValidationServiceApi.NormalizeTranscodeJobResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "NormalizeTranscodeJob", req);
    this.logger.info("normalize_transcode_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.transcodeJob?.assignee?.email ?? ""),
          phone: (req?.details?.contact?.phone ?? ""),
        },
      },
      recommendation: {
        audit: { createdAt: req?.transcodeJob?.audit?.createdAt },
        counterparty: { email: (req?.transcodeJob?.requester?.email ?? "") },
      },
    });
    const decoded1 = personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationRequest.fromJSON(
      JSON.parse(JSON.stringify(personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationRequest.toJSON(request1))),
    );
    const invoke1: Unary<personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationRequest, personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.explainRecommendationCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationRequest, personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationResponse>(invoke1, decoded1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobValidationServiceApi.NormalizeTranscodeJobResponse.fromPartial({ transcodeJob: { sla: { dueAt: reply1?.recommendation?.dueAt } } }),
      mediaTranscodeJobValidationServiceApi.NormalizeTranscodeJobResponse.fromPartial({
        transcodeJob: {
          assignee: req?.transcodeJob?.assignee,
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Previews a transcode job.
   */
  async previewTranscodeJob(req: mediaTranscodeJobValidationServiceApi.PreviewTranscodeJobRequest): Promise<mediaTranscodeJobValidationServiceApi.PreviewTranscodeJobResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "PreviewTranscodeJob", req);
    this.logger.info("preview_transcode_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookEndpointServiceApi.WatchWebhookEndpointsRequest.fromPartial({
      context: req?.context,
      subscriber: {
        email: (req?.details?.contact?.email ?? ""),
        name: req?.transcodeJob?.requester?.name,
        phone: (req?.transcodeJob?.requester?.phone ?? ""),
        preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
      },
    });
    const stream1 = this.webhooksWebhookEndpointClient.watchWebhookEndpoints(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? webhooksWebhookEndpointServiceApi.WatchWebhookEndpointsResponse.fromPartial({});
    const request2 = authorizationAccessPolicyQueryServiceApi.ResolveAccessPoliciesRequest.fromPartial({ context: req?.context });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.authorization.v1.ResolveAccessPoliciesRequest",
      value: Buffer.from(authorizationAccessPolicyQueryServiceApi.ResolveAccessPoliciesRequest.encode(request2).finish()),
    });
    const unpacked2 = authorizationAccessPolicyQueryServiceApi.ResolveAccessPoliciesRequest.decode(envelope2.value);
    const invoke2: Unary<authorizationAccessPolicyQueryServiceApi.ResolveAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.ResolveAccessPoliciesResponse> =
      (input, done) => this.authorizationAccessPolicyQueryClient.resolveAccessPolicies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<authorizationAccessPolicyQueryServiceApi.ResolveAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.ResolveAccessPoliciesResponse>(invoke2, unpacked2);
    const request3 = mediaTranscodeJobCalculationServiceApi.RecalculateTranscodeJobsRequest.fromPartial({
      context: req?.context,
      transcodeJob: { requester: { name: req?.details?.contact?.name } },
    });
    const client3 = this.clients.get<mediaTranscodeJobCalculationServiceApi.TranscodeJobCalculationServiceClient>("acme.media.v1.TranscodeJobCalculationService");
    const invoke3: Unary<mediaTranscodeJobCalculationServiceApi.RecalculateTranscodeJobsRequest, mediaTranscodeJobCalculationServiceApi.RecalculateTranscodeJobsResponse> =
      (input, done) => client3.recalculateTranscodeJobs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<mediaTranscodeJobCalculationServiceApi.RecalculateTranscodeJobsRequest, mediaTranscodeJobCalculationServiceApi.RecalculateTranscodeJobsResponse>(invoke3, request3);
    const request4 = personalizationProfileQueryServiceApi.ResolveProfilesRequest.fromPartial({ context: req?.context });
    const invoke4: Unary<personalizationProfileQueryServiceApi.ResolveProfilesRequest, personalizationProfileQueryServiceApi.ResolveProfilesResponse> =
      (input, done) => this.personalizationProfileQueryClient.resolveProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port4: RequestPort<personalizationProfileQueryServiceApi.ResolveProfilesRequest, personalizationProfileQueryServiceApi.ResolveProfilesResponse> = new GrpcAdapter(invoke4);
    const reply4 = await port4.execute(request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobValidationServiceApi.PreviewTranscodeJobResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      mediaTranscodeJobValidationServiceApi.PreviewTranscodeJobResponse.fromPartial({ transcodeJob: { priority: (reply3?.transcodeJob?.priority ?? 0) } }),
      mediaTranscodeJobValidationServiceApi.PreviewTranscodeJobResponse.fromPartial({ outcome: { message: (reply4?.result?.message ?? "") } }),
      mediaTranscodeJobValidationServiceApi.PreviewTranscodeJobResponse.fromPartial({
        transcodeJob: {
          assignee: req?.transcodeJob?.assignee,
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Scores a transcode job.
   */
  async scoreTranscodeJob(req: mediaTranscodeJobValidationServiceApi.ScoreTranscodeJobRequest): Promise<mediaTranscodeJobValidationServiceApi.ScoreTranscodeJobResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "ScoreTranscodeJob", req);
    this.logger.info("score_transcode_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetCalculationServiceApi.CalculateMediaAssetRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        audit: { updatedAt: req?.transcodeJob?.audit?.updatedAt },
        owner: {
          email: (req?.transcodeJob?.requester?.email ?? ""),
          userId: (req?.transcodeJob?.assignee?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<mediaMediaAssetCalculationServiceApi.CalculateMediaAssetRequest, mediaMediaAssetCalculationServiceApi.CalculateMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetCalculationClient.calculateMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<mediaMediaAssetCalculationServiceApi.CalculateMediaAssetRequest, mediaMediaAssetCalculationServiceApi.CalculateMediaAssetResponse>(invoke1, request1));
    const settled2 = await Promise.allSettled((req?.transcodeJob?.comments ?? []).map(async (item) => {
      const request2 = mediaMediaAssetValidationServiceApi.ValidateMediaAssetRequest.fromPartial({
        context: req?.context,
        details: { contact: { email: (item?.authorEmail ?? "") } },
      });
      const invoke2: Unary<mediaMediaAssetValidationServiceApi.ValidateMediaAssetRequest, mediaMediaAssetValidationServiceApi.ValidateMediaAssetResponse> =
        (input, done) => this.mediaMediaAssetValidationClient.validateMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<mediaMediaAssetValidationServiceApi.ValidateMediaAssetRequest, mediaMediaAssetValidationServiceApi.ValidateMediaAssetResponse>(invoke2, request2);
      return reply2;
    }));
    const results2: mediaMediaAssetValidationServiceApi.ValidateMediaAssetResponse[] = [];
    for (const result of settled2) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results2.push(result.value);
    }
    const reply2 = results2.at(-1) ?? mediaMediaAssetValidationServiceApi.ValidateMediaAssetResponse.fromPartial({});
    let selected3_2: string | undefined;
    switch (req?.transcodeJob?.origin?.$case) {
      case "customer":
        selected3_2 = ((req?.transcodeJob?.origin?.$case === "customer" ? req?.transcodeJob?.origin.customer : undefined)?.email ?? "");
        break;
      default:
        selected3_2 = "";
    }
    const request3 = experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (selected3_2 ?? ""),
          phone: (req?.transcodeJob?.requester?.phone ?? ""),
        },
      },
      exposure: {
        measurements: [{ unit: (reply2?.mediaAsset?.dimensions?.unit ?? "") }],
        subject: { displayName: (reply2?.mediaAsset?.owner?.displayName ?? "") },
      },
    });
    const invoke3: Unary<experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest, experimentsExposureValidationServiceApi.ExplainExposureDecisionResponse> =
      (input, done) => this.experimentsExposureValidationClient.explainExposureDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest, experimentsExposureValidationServiceApi.ExplainExposureDecisionResponse>(invoke3, request3);
    const request4 = surveysSurveyResponseQueryServiceApi.ResolveSurveyResponsesRequest.fromPartial({ context: req?.context });
    const invoke4: Unary<surveysSurveyResponseQueryServiceApi.ResolveSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.ResolveSurveyResponsesResponse> =
      (input, done) => this.surveysSurveyResponseQueryClient.resolveSurveyResponses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task4 = operation(invoke4)(request4);
    const reply4 = await task4();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobValidationServiceApi.ScoreTranscodeJobResponse.fromPartial({ breakdown: { currencyCode: (reply1?.breakdown?.currencyCode ?? "") } }),
      mediaTranscodeJobValidationServiceApi.ScoreTranscodeJobResponse.fromPartial({
        transcodeJob: {
          assignee: { displayName: (reply3?.exposure?.subject?.displayName ?? "") },
        },
      }),
      mediaTranscodeJobValidationServiceApi.ScoreTranscodeJobResponse.fromPartial({ result: { details: (reply4?.result?.details ?? {}) } }),
      mediaTranscodeJobValidationServiceApi.ScoreTranscodeJobResponse.fromPartial({
        transcodeJob: {
          priority: (req?.transcodeJob?.priority ?? 0),
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Validates a transcode job.
   */
  async validateTranscodeJob(req: mediaTranscodeJobValidationServiceApi.ValidateTranscodeJobRequest): Promise<mediaTranscodeJobValidationServiceApi.ValidateTranscodeJobResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "ValidateTranscodeJob", req);
    this.logger.info("validate_transcode_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<formsFormValidationServiceApi.ScoreFormResponse>> = [];
    for (const item of (req?.transcodeJob?.comments ?? [])) {
      tasks1.push(async () => {
        const request1 = formsFormValidationServiceApi.ScoreFormRequest.fromPartial({
          context: req?.context,
          form: {
            audit: { createdAt: item?.createdAt },
            counterparty: { email: (item?.authorEmail ?? "") },
          },
        });
        const invoke1: Unary<formsFormValidationServiceApi.ScoreFormRequest, formsFormValidationServiceApi.ScoreFormResponse> =
          (input, done) => this.formsFormValidationClient.scoreForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<formsFormValidationServiceApi.ScoreFormRequest, formsFormValidationServiceApi.ScoreFormResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? formsFormValidationServiceApi.ScoreFormResponse.fromPartial({});
    const request2 = mediaTranscodeJobCalculationServiceApi.GetTranscodeJobRatesRequest.fromPartial({
      context: req?.context,
      transcodeJobId: (req?.transcodeJob?.transcodeJobId ?? ""),
    });
    const reply2 = await this.workQueue.enqueue<mediaTranscodeJobCalculationServiceApi.GetTranscodeJobRatesRequest, mediaTranscodeJobCalculationServiceApi.GetTranscodeJobRatesResponse>(
      "acme.media.v1.TranscodeJobValidationService/ValidateTranscodeJob:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobValidationServiceApi.ValidateTranscodeJobResponse.fromPartial({
        result: { message: (reply2?.result?.message ?? "") },
        transcodeJob: { tags: (reply2?.transcodeJob?.tags ?? []) },
      }),
      mediaTranscodeJobValidationServiceApi.ValidateTranscodeJobResponse.fromPartial({
        transcodeJob: {
          customFields: (req?.transcodeJob?.customFields ?? {}),
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }
}
