/**
 * Computes the figures of an audience member, such as totals, taxes, and estimates. Remote work stays behind typed
 * client ports.
 */

import * as audiencesAudienceMemberCalculationServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_member_calculation_service.js";
import * as boxofficeBoxOfficeSaleCalculationServiceApi from "../../../../../.cache/proto/acme/boxoffice/v1/box_office_sale_calculation_service.js";
import * as careplansCarePlanQueryServiceApi from "../../../../../.cache/proto/acme/careplans/v1/care_plan_query_service.js";
import * as communityForumValidationServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as concessionsConcessionStandQueryServiceApi from "../../../../../.cache/proto/acme/concessions/v1/concession_stand_query_service.js";
import * as formsFormFieldCalculationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_field_calculation_service.js";
import * as ledgerLedgerAccountServiceApi from "../../../../../.cache/proto/acme/ledger/v1/ledger_account_service.js";
import * as mediaMediaAssetValidationServiceApi from "../../../../../.cache/proto/acme/media/v1/media_asset_validation_service.js";
import * as metricsMetricSeriesServiceApi from "../../../../../.cache/proto/acme/metrics/v1/metric_series_service.js";
import * as notificationsDeliveryAttemptExportServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_export_service.js";
import * as notificationsNotificationTemplateCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_calculation_service.js";
import * as notificationsNotificationTemplateExportServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import * as notificationsSubscriptionApprovalServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_approval_service.js";
import * as surveysSurveyResponseValidationServiceApi from "../../../../../.cache/proto/acme/surveys/v1/survey_response_validation_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, forwarding, metadataFor, operation, promised, type Unary } from "../../../../platform/rpc.js";
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toAudienceMemberRecord } from "../../data/records.js";
import { AudiencesRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate audience member operations and persist audit data.
 */
@injectable()
export class AudienceMemberCalculationWorkflow {
  constructor(
    @inject(AudiencesRepository) private readonly repository: AudiencesRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.boxoffice.v1.BoxOfficeSaleCalculationService") private readonly boxofficeBoxOfficeSaleCalculationClient: boxofficeBoxOfficeSaleCalculationServiceApi.BoxOfficeSaleCalculationServiceClient,
    @inject("grpc:acme.careplans.v1.CarePlanQueryService") private readonly careplansCarePlanQueryClient: careplansCarePlanQueryServiceApi.CarePlanQueryServiceClient,
    @inject("grpc:acme.community.v1.ForumValidationService") private readonly communityForumValidationClient: communityForumValidationServiceApi.ForumValidationServiceClient,
    @inject("grpc:acme.concessions.v1.ConcessionStandQueryService") private readonly concessionsConcessionStandQueryClient: concessionsConcessionStandQueryServiceApi.ConcessionStandQueryServiceClient,
    @inject("grpc:acme.forms.v1.FormFieldCalculationService") private readonly formsFormFieldCalculationClient: formsFormFieldCalculationServiceApi.FormFieldCalculationServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountService") private readonly ledgerLedgerAccountClient: ledgerLedgerAccountServiceApi.LedgerAccountServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetValidationService") private readonly mediaMediaAssetValidationClient: mediaMediaAssetValidationServiceApi.MediaAssetValidationServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesService") private readonly metricsMetricSeriesClient: metricsMetricSeriesServiceApi.MetricSeriesServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptExportService") private readonly notificationsDeliveryAttemptExportClient: notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateCalculationService") private readonly notificationsNotificationTemplateCalculationClient: notificationsNotificationTemplateCalculationServiceApi.NotificationTemplateCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateExportService") private readonly notificationsNotificationTemplateExportClient: notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionApprovalService") private readonly notificationsSubscriptionApprovalClient: notificationsSubscriptionApprovalServiceApi.SubscriptionApprovalServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseValidationService") private readonly surveysSurveyResponseValidationClient: surveysSurveyResponseValidationServiceApi.SurveyResponseValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates an audience member.
   */
  async calculateAudienceMember(req: audiencesAudienceMemberCalculationServiceApi.CalculateAudienceMemberRequest): Promise<audiencesAudienceMemberCalculationServiceApi.CalculateAudienceMemberResponse> {
    validateContext(req.context);
    if (req.audienceMember) {
      await this.repository.save(toAudienceMemberRecord(req.context.tenantId, req.audienceMember));
    }
    await this.repository.record(req.context.tenantId, "CalculateAudienceMember", req);
    this.logger.info("calculate_audience_member", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ledgerLedgerAccountServiceApi.CreateLedgerAccountRequest.fromPartial({
      context: req?.context,
      ledgerAccount: {
        audit: {
          createdBy: (req?.audienceMember?.audit?.createdBy ?? ""),
          updatedBy: (req?.audienceMember?.audit?.updatedBy ?? ""),
        },
        contact: {
          email: (req?.audienceMember?.contact?.email ?? ""),
          name: req?.audienceMember?.contact?.name,
        },
      },
    });
    const invoke1: Unary<ledgerLedgerAccountServiceApi.CreateLedgerAccountRequest, ledgerLedgerAccountServiceApi.CreateLedgerAccountResponse> =
      (input, done) => this.ledgerLedgerAccountClient.createLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = mediaMediaAssetValidationServiceApi.LintMediaAssetsRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (reply1?.ledgerAccount?.contact?.phone ?? "") } },
      mediaAsset: {
        locator: { $case: "address", address: { region: (req?.audienceMember?.primaryAddress?.region ?? "") } },
        audit: {
          createdAt: req?.audienceMember?.audit?.createdAt,
          updatedAt: req?.audienceMember?.audit?.updatedAt,
        },
      },
    });
    const reply2 = await this.workQueue.enqueue<mediaMediaAssetValidationServiceApi.LintMediaAssetsRequest, mediaMediaAssetValidationServiceApi.LintMediaAssetsResponse>(
      "acme.audiences.v1.AudienceMemberCalculationService/CalculateAudienceMember:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceMemberCalculationServiceApi.CalculateAudienceMemberResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      audiencesAudienceMemberCalculationServiceApi.CalculateAudienceMemberResponse.fromPartial({
        audienceMember: { audit: { etag: (reply2?.mediaAsset?.audit?.etag ?? "") } },
      }),
      audiencesAudienceMemberCalculationServiceApi.CalculateAudienceMemberResponse.fromPartial({
        audienceMember: {
          audienceMemberId: (req?.audienceMemberId ?? ""),
          status: req?.audienceMember?.status,
        },
      }),
    );
  }

  /**
   * Compares an audience member.
   */
  async compareAudienceMemberOptions(req: audiencesAudienceMemberCalculationServiceApi.CompareAudienceMemberOptionsRequest): Promise<audiencesAudienceMemberCalculationServiceApi.CompareAudienceMemberOptionsResponse> {
    validateContext(req.context);
    if (req.audienceMember) {
      await this.repository.save(toAudienceMemberRecord(req.context.tenantId, req.audienceMember));
    }
    await this.repository.record(req.context.tenantId, "CompareAudienceMemberOptions", req);
    this.logger.info("compare_audience_member_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumValidationServiceApi.PreviewForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            manager: {
              displayName: (req?.audienceMember?.relationshipManager?.displayName ?? ""),
            },
          }],
        }],
      },
    });
    const invoke1: Unary<communityForumValidationServiceApi.PreviewForumRequest, communityForumValidationServiceApi.PreviewForumResponse> =
      (input, done) => this.communityForumValidationClient.previewForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<communityForumValidationServiceApi.PreviewForumRequest, communityForumValidationServiceApi.PreviewForumResponse>(invoke1, request1));
    const request2 = surveysSurveyResponseValidationServiceApi.CheckSurveyResponseEligibilityRequest.fromPartial({
      context: req?.context,
      surveyResponse: { subject: { email: (reply1?.forum?.manager?.email ?? "") } },
    });
    const invoke2: Unary<surveysSurveyResponseValidationServiceApi.CheckSurveyResponseEligibilityRequest, surveysSurveyResponseValidationServiceApi.CheckSurveyResponseEligibilityResponse> =
      (input, done) => this.surveysSurveyResponseValidationClient.checkSurveyResponseEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<surveysSurveyResponseValidationServiceApi.CheckSurveyResponseEligibilityResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = boxofficeBoxOfficeSaleCalculationServiceApi.CompareBoxOfficeSaleOptionsRequest.fromPartial({
      boxOfficeSale: { audit: { etag: (req?.audienceMember?.audit?.etag ?? "") } },
      context: req?.context,
      details: {
        destination: {
          countryCode: (req?.details?.destination?.countryCode ?? ""),
          locality: (req?.details?.destination?.locality ?? ""),
          recipient: (req?.details?.destination?.recipient ?? ""),
        },
      },
    });
    const invoke3: Unary<boxofficeBoxOfficeSaleCalculationServiceApi.CompareBoxOfficeSaleOptionsRequest, boxofficeBoxOfficeSaleCalculationServiceApi.CompareBoxOfficeSaleOptionsResponse> =
      (input, done) => this.boxofficeBoxOfficeSaleCalculationClient.compareBoxOfficeSaleOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    const request4 = concessionsConcessionStandQueryServiceApi.FindConcessionStandsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.forum?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply3?.result?.details ?? {}))),
        ownerId: (reply3?.boxOfficeSale?.counterparty?.cashDrawerId ?? ""),
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const invoke4: Unary<concessionsConcessionStandQueryServiceApi.FindConcessionStandsRequest, concessionsConcessionStandQueryServiceApi.FindConcessionStandsResponse> =
      (input, done) => this.concessionsConcessionStandQueryClient.findConcessionStands(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke4 = promisify(invoke4);
    const reply4 = requireReply(await asyncInvoke4(request4));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceMemberCalculationServiceApi.CompareAudienceMemberOptionsResponse.fromPartial({
        audienceMember: {
          audit: {
            updatedAt: reply1?.forum?.audit?.updatedAt,
            updatedBy: (reply1?.forum?.audit?.updatedBy ?? ""),
          },
        },
      }),
      audiencesAudienceMemberCalculationServiceApi.CompareAudienceMemberOptionsResponse.fromPartial({
        audienceMember: { attributes: (reply2?.surveyResponse?.attributes ?? {}) },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      audiencesAudienceMemberCalculationServiceApi.CompareAudienceMemberOptionsResponse.fromPartial({
        audienceMember: {
          primaryAddress: {
            countryCode: (reply3?.boxOfficeSale?.billingAddress?.countryCode ?? ""),
          },
        },
        breakdown: {
          currencyCode: (reply3?.boxOfficeSale?.counterparty?.currencyCode ?? ""),
        },
      }),
      audiencesAudienceMemberCalculationServiceApi.CompareAudienceMemberOptionsResponse.fromPartial({
        result: {
          details: (reply4?.result?.details ?? {}),
          referenceIds: (reply4?.result?.referenceIds ?? []),
        },
      }),
      audiencesAudienceMemberCalculationServiceApi.CompareAudienceMemberOptionsResponse.fromPartial({
        audienceMember: {
          audienceMemberId: (req?.audienceMemberId ?? ""),
          name: req?.audienceMember?.name,
        },
      }),
    );
  }

  /**
   * Estimates an audience member.
   */
  async estimateAudienceMember(req: audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberRequest): Promise<audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberResponse> {
    validateContext(req.context);
    if (req.audienceMember) {
      await this.repository.save(toAudienceMemberRecord(req.context.tenantId, req.audienceMember));
    }
    await this.repository.record(req.context.tenantId, "EstimateAudienceMember", req);
    this.logger.info("estimate_audience_member", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = careplansCarePlanQueryServiceApi.CountCarePlansRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.audienceMember?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.audienceMember?.attributes ?? {}))),
        ownerId: (req?.audienceMember?.relationshipManager?.userId ?? ""),
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const method1 = "countCarePlans" as const;
    const invoke1: Unary<careplansCarePlanQueryServiceApi.CountCarePlansRequest, careplansCarePlanQueryServiceApi.CountCarePlansResponse> =
      (input, done) => this.careplansCarePlanQueryClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<careplansCarePlanQueryServiceApi.CountCarePlansRequest, careplansCarePlanQueryServiceApi.CountCarePlansResponse>(invoke1, request1);
    const request2 = ledgerLedgerAccountServiceApi.WatchLedgerAccountsRequest.fromPartial({
      context: req?.context,
      subscriber: {
        preferredChannel: (req?.audienceMember?.contact?.preferredChannel ?? ""),
      },
    });
    const stream2 = this.ledgerLedgerAccountClient.watchLedgerAccounts(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? ledgerLedgerAccountServiceApi.WatchLedgerAccountsResponse.fromPartial({});
    const request3 = metricsMetricSeriesServiceApi.UpdateMetricSeriesRequest.fromPartial({
      context: req?.context,
      metricSeries: {
        locator: { $case: "address", address: { countryCode: (req?.details?.destination?.countryCode ?? "") } },
        owner: { email: (req?.audienceMember?.contact?.email ?? "") },
      },
    });
    const proxy3 = forwarding(this.metricsMetricSeriesClient);
    const invoke3: Unary<metricsMetricSeriesServiceApi.UpdateMetricSeriesRequest, metricsMetricSeriesServiceApi.UpdateMetricSeriesResponse> =
      (input, done) => proxy3.updateMetricSeries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<metricsMetricSeriesServiceApi.UpdateMetricSeriesRequest, metricsMetricSeriesServiceApi.UpdateMetricSeriesResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberResponse.fromPartial({
        audienceMember: { audit: { createdAt: reply3?.metricSeries?.audit?.createdAt } },
      }),
      audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberResponse.fromPartial({
        audienceMember: {
          audienceMemberId: (req?.audienceMemberId ?? ""),
          status: req?.audienceMember?.status,
        },
      }),
    );
  }

  /**
   * Explains an audience member.
   */
  async explainAudienceMemberCalculation(req: audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationRequest): Promise<audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationResponse> {
    validateContext(req.context);
    if (req.audienceMember) {
      await this.repository.save(toAudienceMemberRecord(req.context.tenantId, req.audienceMember));
    }
    await this.repository.record(req.context.tenantId, "ExplainAudienceMemberCalculation", req);
    this.logger.info("explain_audience_member_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.audienceMember?.audit?.updatedAt,
        region: (req?.audienceMember?.primaryAddress?.region ?? ""),
      },
    });
    const invoke1: Unary<notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsRequest, notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsResponse> =
      (input, done) => this.notificationsSubscriptionApprovalClient.listPendingSubscriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsRequest, notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsResponse>(invoke1, request1);
    const request2 = notificationsNotificationTemplateExportServiceApi.ListNotificationTemplateExportsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.audienceMember?.primaryAddress?.region ?? "") },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<notificationsNotificationTemplateExportServiceApi.ListNotificationTemplateExportsRequest, notificationsNotificationTemplateExportServiceApi.ListNotificationTemplateExportsResponse> =
      (input, done) => this.notificationsNotificationTemplateExportClient.listNotificationTemplateExports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationTemplateExportServiceApi.ListNotificationTemplateExportsRequest, notificationsNotificationTemplateExportServiceApi.ListNotificationTemplateExportsResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationResponse.fromPartial({
        audienceMember: {
          audienceMemberId: (req?.audienceMemberId ?? ""),
          name: req?.audienceMember?.name,
        },
      }),
    );
  }

  /**
   * Returns an audience member.
   */
  async getAudienceMemberRates(req: audiencesAudienceMemberCalculationServiceApi.GetAudienceMemberRatesRequest): Promise<audiencesAudienceMemberCalculationServiceApi.GetAudienceMemberRatesResponse> {
    validateContext(req.context);
    if (!req.audienceMemberId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "audience_member_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetAudienceMemberRates", req);
    this.logger.info("get_audience_member_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = formsFormFieldCalculationServiceApi.EstimateFormFieldRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((input1?.context?.baggage ?? {}))),
      context: input1?.context,
      formField: {
        audit: { createdAt: input1?.context?.deadline },
        owner: {
          email: (input1?.context?.actor?.email ?? ""),
          userId: (input1?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<formsFormFieldCalculationServiceApi.EstimateFormFieldRequest, formsFormFieldCalculationServiceApi.EstimateFormFieldResponse> =
      (input, done) => this.formsFormFieldCalculationClient.estimateFormField(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormFieldCalculationServiceApi.EstimateFormFieldRequest, formsFormFieldCalculationServiceApi.EstimateFormFieldResponse>(invoke1, request1);
    return mergeResponses(
      audiencesAudienceMemberCalculationServiceApi.GetAudienceMemberRatesResponse.fromPartial({
        audienceMember: {
          audit: { updatedBy: (reply1?.formField?.audit?.updatedBy ?? "") },
          contact: { email: (reply1?.formField?.owner?.email ?? "") },
        },
      }),
      audiencesAudienceMemberCalculationServiceApi.GetAudienceMemberRatesResponse.fromPartial({ audienceMember: { audienceMemberId: (req?.audienceMemberId ?? "") } }),
    );
  }

  /**
   * Quotes an audience member.
   */
  async quoteAudienceMember(req: audiencesAudienceMemberCalculationServiceApi.QuoteAudienceMemberRequest): Promise<audiencesAudienceMemberCalculationServiceApi.QuoteAudienceMemberResponse> {
    validateContext(req.context);
    if (req.audienceMember) {
      await this.repository.save(toAudienceMemberRecord(req.context.tenantId, req.audienceMember));
    }
    await this.repository.record(req.context.tenantId, "QuoteAudienceMember", req);
    this.logger.info("quote_audience_member", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionRequest.fromPartial({
      context: req?.context,
      subscription: {
        owner: {
          email: (req?.audienceMember?.contact?.email ?? ""),
          userId: (req?.audienceMember?.relationshipManager?.userId ?? ""),
        },
      },
    });
    const cloned1: notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionRequest, notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionResponse> =
      (input, done) => this.notificationsSubscriptionApprovalClient.submitSubscription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionRequest, notificationsSubscriptionApprovalServiceApi.SubmitSubscriptionResponse>(invoke1, cloned1);
    const request2 = mediaMediaAssetValidationServiceApi.PreviewMediaAssetRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        locator: { $case: "address", address: {
          lines: (req?.audienceMember?.primaryAddress?.lines ?? []).map((value) => value),
        } },
        audit: { etag: (req?.audienceMember?.audit?.etag ?? "") },
      },
    });
    const decoded2 = mediaMediaAssetValidationServiceApi.PreviewMediaAssetRequest.fromJSON(
      JSON.parse(JSON.stringify(mediaMediaAssetValidationServiceApi.PreviewMediaAssetRequest.toJSON(request2))),
    );
    const invoke2: Unary<mediaMediaAssetValidationServiceApi.PreviewMediaAssetRequest, mediaMediaAssetValidationServiceApi.PreviewMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetValidationClient.previewMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaMediaAssetValidationServiceApi.PreviewMediaAssetRequest, mediaMediaAssetValidationServiceApi.PreviewMediaAssetResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceMemberCalculationServiceApi.QuoteAudienceMemberResponse.fromPartial({
        audienceMember: {
          relationshipManager: { userId: (reply1?.subscription?.owner?.userId ?? "") },
        },
      }),
      audiencesAudienceMemberCalculationServiceApi.QuoteAudienceMemberResponse.fromPartial({
        audienceMember: {
          primaryAddress: {
            region: ((reply2?.mediaAsset?.locator?.$case === "address" ? reply2?.mediaAsset?.locator.address : undefined)?.region ?? ""),
          },
        },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      audiencesAudienceMemberCalculationServiceApi.QuoteAudienceMemberResponse.fromPartial({
        audienceMember: {
          audienceMemberId: (req?.audienceMemberId ?? ""),
          name: req?.audienceMember?.name,
        },
      }),
    );
  }

  /**
   * Simulates an audience member.
   */
  async simulateAudienceMember(req: audiencesAudienceMemberCalculationServiceApi.SimulateAudienceMemberRequest): Promise<audiencesAudienceMemberCalculationServiceApi.SimulateAudienceMemberResponse> {
    validateContext(req.context);
    if (req.audienceMember) {
      await this.repository.save(toAudienceMemberRecord(req.context.tenantId, req.audienceMember));
    }
    await this.repository.record(req.context.tenantId, "SimulateAudienceMember", req);
    this.logger.info("simulate_audience_member", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateExportServiceApi.StreamNotificationTemplateExportRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.details?.destination?.region ?? "") },
    });
    const stream1 = this.notificationsNotificationTemplateExportClient.streamNotificationTemplateExport(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? notificationsNotificationTemplateExportServiceApi.StreamNotificationTemplateExportResponse.fromPartial({});
    const request2 = notificationsDeliveryAttemptExportServiceApi.StreamDeliveryAttemptExportRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.audienceMember?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.audienceMember?.attributes ?? {}))),
        ownerId: (req?.audienceMemberId ?? ""),
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const stream2 = this.notificationsDeliveryAttemptExportClient.streamDeliveryAttemptExport(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? notificationsDeliveryAttemptExportServiceApi.StreamDeliveryAttemptExportResponse.fromPartial({});
    const request3 = notificationsNotificationTemplateCalculationServiceApi.SimulateNotificationTemplateRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { recipient: (req?.details?.destination?.recipient ?? "") },
      },
      notificationTemplate: {
        audit: { updatedBy: (req?.audienceMember?.audit?.updatedBy ?? "") },
        billingAddress: {
          countryCode: (req?.audienceMember?.primaryAddress?.countryCode ?? ""),
          recipient: (req?.audienceMember?.primaryAddress?.recipient ?? ""),
        },
      },
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.notifications.v1.SimulateNotificationTemplateRequest",
      value: Buffer.from(notificationsNotificationTemplateCalculationServiceApi.SimulateNotificationTemplateRequest.encode(request3).finish()),
    });
    const unpacked3 = notificationsNotificationTemplateCalculationServiceApi.SimulateNotificationTemplateRequest.decode(envelope3.value);
    const invoke3: Unary<notificationsNotificationTemplateCalculationServiceApi.SimulateNotificationTemplateRequest, notificationsNotificationTemplateCalculationServiceApi.SimulateNotificationTemplateResponse> =
      (input, done) => this.notificationsNotificationTemplateCalculationClient.simulateNotificationTemplate(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsNotificationTemplateCalculationServiceApi.SimulateNotificationTemplateRequest, notificationsNotificationTemplateCalculationServiceApi.SimulateNotificationTemplateResponse>(invoke3, unpacked3);
    const request4 = notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (req?.audienceMember?.relationshipManager?.email ?? ""),
          name: req?.audienceMember?.name,
        },
      },
    });
    const client4 = this.clients.get<notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient>("acme.notifications.v1.DeliveryAttemptExportService");
    const invoke4: Unary<notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportResponse> =
      (input, done) => client4.shareDeliveryAttemptExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceMemberCalculationServiceApi.SimulateAudienceMemberResponse.fromPartial({
        audienceMember: {
          primaryAddress: {
            countryCode: (reply3?.notificationTemplate?.billingAddress?.countryCode ?? ""),
          },
        },
      }),
      audiencesAudienceMemberCalculationServiceApi.SimulateAudienceMemberResponse.fromPartial({ result: { message: (reply4?.outcome?.message ?? "") } }),
      audiencesAudienceMemberCalculationServiceApi.SimulateAudienceMemberResponse.fromPartial({
        audienceMember: {
          audienceMemberId: (req?.audienceMemberId ?? ""),
          contact: req?.audienceMember?.contact,
        },
      }),
    );
  }
}
