/**
 * Register the surveys team's public gRPC boundary and workers.
 */

import * as communityBadgeCalculationServiceApi from "../../../.cache/proto/acme/community/v1/badge_calculation_service.js";
import * as customersConsentRecordCalculationServiceApi from "../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as customersCustomerSegmentCalculationServiceApi from "../../../.cache/proto/acme/customers/v1/customer_segment_calculation_service.js";
import * as customersCustomerValidationServiceApi from "../../../.cache/proto/acme/customers/v1/customer_validation_service.js";
import * as experimentsVariantCalculationServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_calculation_service.js";
import * as notificationsDeliveryAttemptCalculationServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_calculation_service.js";
import * as surveysQuestionApprovalServiceApi from "../../../.cache/proto/acme/surveys/v1/question_approval_service.js";
import * as surveysQuestionCalculationServiceApi from "../../../.cache/proto/acme/surveys/v1/question_calculation_service.js";
import * as surveysQuestionValidationServiceApi from "../../../.cache/proto/acme/surveys/v1/question_validation_service.js";
import * as surveysQuestionWorkflowServiceApi from "../../../.cache/proto/acme/surveys/v1/question_workflow_service.js";
import * as surveysSurveyApprovalServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_approval_service.js";
import * as surveysSurveyQueryServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_query_service.js";
import * as surveysSurveyResponseApprovalServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_response_approval_service.js";
import * as surveysSurveyResponseQueryServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_response_query_service.js";
import * as surveysSurveyResponseValidationServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_response_validation_service.js";
import * as surveysSurveyResponseWorkflowServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_response_workflow_service.js";
import * as surveysSurveyServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_service.js";
import * as surveysSurveyWorkflowServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_workflow_service.js";
import { ClientRegistry } from "../../platform/registry.js";
import { call, metadataFor } from "../../platform/rpc.js";
import { WorkQueue } from "../../platform/work-queue.js";
import {
  QuestionApprovalHandler,
  implementation as bindQuestionApprovalHandler,
} from "./features/question/question-approval.handler.js";
import {
  QuestionWorkflowHandler,
  implementation as bindQuestionWorkflowHandler,
} from "./features/question/question-workflow.handler.js";
import {
  SurveyResponseApprovalHandler,
  implementation as bindSurveyResponseApprovalHandler,
} from "./features/survey-response/survey-response-approval.handler.js";
import {
  SurveyResponseWorkflowHandler,
  implementation as bindSurveyResponseWorkflowHandler,
} from "./features/survey-response/survey-response-workflow.handler.js";
import {
  QuestionValidationHandler,
  implementation as bindQuestionValidationHandler,
} from "./services/question-validation.js";
import { SurveyQueryHandler, implementation as bindSurveyQueryHandler } from "./services/survey-query.js";
import {
  SurveyResponseValidationHandler,
  implementation as bindSurveyResponseValidationHandler,
} from "./services/survey-response-validation.js";
import { SurveyWorkflowHandler, implementation as bindSurveyWorkflowHandler } from "./services/survey-workflow.js";
import {
  QuestionCalculationHandler,
  implementation as bindQuestionCalculationHandler,
} from "./transport/question-calculation.js";
import { SurveyApprovalHandler, implementation as bindSurveyApprovalHandler } from "./transport/survey-approval.js";
import {
  SurveyResponseQueryHandler,
  implementation as bindSurveyResponseQueryHandler,
} from "./transport/survey-response-query.js";
import { SurveyHandler, implementation as bindSurveyHandler } from "./transport/survey.js";
import { type Server } from "@grpc/grpc-js";
import { type DependencyContainer } from "tsyringe";

export function register(server: Server, scope: DependencyContainer): void {
  server.addService(surveysQuestionApprovalServiceApi.QuestionApprovalServiceService, bindQuestionApprovalHandler(scope.resolve(QuestionApprovalHandler)));
  server.addService(surveysQuestionCalculationServiceApi.QuestionCalculationServiceService, bindQuestionCalculationHandler(scope.resolve(QuestionCalculationHandler)));
  server.addService(surveysQuestionValidationServiceApi.QuestionValidationServiceService, bindQuestionValidationHandler(scope.resolve(QuestionValidationHandler)));
  server.addService(surveysQuestionWorkflowServiceApi.QuestionWorkflowServiceService, bindQuestionWorkflowHandler(scope.resolve(QuestionWorkflowHandler)));
  server.addService(surveysSurveyApprovalServiceApi.SurveyApprovalServiceService, bindSurveyApprovalHandler(scope.resolve(SurveyApprovalHandler)));
  server.addService(surveysSurveyQueryServiceApi.SurveyQueryServiceService, bindSurveyQueryHandler(scope.resolve(SurveyQueryHandler)));
  server.addService(surveysSurveyResponseApprovalServiceApi.SurveyResponseApprovalServiceService, bindSurveyResponseApprovalHandler(scope.resolve(SurveyResponseApprovalHandler)));
  server.addService(surveysSurveyResponseQueryServiceApi.SurveyResponseQueryServiceService, bindSurveyResponseQueryHandler(scope.resolve(SurveyResponseQueryHandler)));
  server.addService(surveysSurveyResponseValidationServiceApi.SurveyResponseValidationServiceService, bindSurveyResponseValidationHandler(scope.resolve(SurveyResponseValidationHandler)));
  server.addService(surveysSurveyResponseWorkflowServiceApi.SurveyResponseWorkflowServiceService, bindSurveyResponseWorkflowHandler(scope.resolve(SurveyResponseWorkflowHandler)));
  server.addService(surveysSurveyServiceApi.SurveyServiceService, bindSurveyHandler(scope.resolve(SurveyHandler)));
  server.addService(surveysSurveyWorkflowServiceApi.SurveyWorkflowServiceService, bindSurveyWorkflowHandler(scope.resolve(SurveyWorkflowHandler)));
}

export function startWorkers(scope: DependencyContainer): void {
  const queue = scope.resolve<WorkQueue>("workQueue");
  const clients = scope.resolve<ClientRegistry>("clients");
  const client0 = clients.get<customersCustomerSegmentCalculationServiceApi.CustomerSegmentCalculationServiceClient>("acme.customers.v1.CustomerSegmentCalculationService");
  queue.consume<customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationRequest, customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationResponse>("acme.surveys.v1.QuestionApprovalService/ListPendingQuestions:0", async (request) =>
    call<customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationRequest, customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationResponse>((input, done) => client0.explainCustomerSegmentCalculation(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client1 = clients.get<communityBadgeCalculationServiceApi.BadgeCalculationServiceClient>("acme.community.v1.BadgeCalculationService");
  queue.consume<communityBadgeCalculationServiceApi.CalculateBadgeRequest, communityBadgeCalculationServiceApi.CalculateBadgeResponse>("acme.surveys.v1.QuestionCalculationService/QuoteQuestion:1", async (request) =>
    call<communityBadgeCalculationServiceApi.CalculateBadgeRequest, communityBadgeCalculationServiceApi.CalculateBadgeResponse>((input, done) => client1.calculateBadge(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client2 = clients.get<experimentsVariantCalculationServiceApi.VariantCalculationServiceClient>("acme.experiments.v1.VariantCalculationService");
  queue.consume<experimentsVariantCalculationServiceApi.CalculateVariantRequest, experimentsVariantCalculationServiceApi.CalculateVariantResponse>("acme.surveys.v1.QuestionValidationService/PreviewQuestion:0", async (request) =>
    call<experimentsVariantCalculationServiceApi.CalculateVariantRequest, experimentsVariantCalculationServiceApi.CalculateVariantResponse>((input, done) => client2.calculateVariant(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client3 = clients.get<customersCustomerValidationServiceApi.CustomerValidationServiceClient>("acme.customers.v1.CustomerValidationService");
  queue.consume<customersCustomerValidationServiceApi.ExplainCustomerDecisionRequest, customersCustomerValidationServiceApi.ExplainCustomerDecisionResponse>("acme.surveys.v1.SurveyApprovalService/CommentSurveyApproval:1", async (request) =>
    call<customersCustomerValidationServiceApi.ExplainCustomerDecisionRequest, customersCustomerValidationServiceApi.ExplainCustomerDecisionResponse>((input, done) => client3.explainCustomerDecision(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client4 = clients.get<surveysSurveyResponseValidationServiceApi.SurveyResponseValidationServiceClient>("acme.surveys.v1.SurveyResponseValidationService");
  queue.consume<surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseRequest, surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseResponse>("acme.surveys.v1.SurveyQueryService/FindSurveys:0", async (request) =>
    call<surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseRequest, surveysSurveyResponseValidationServiceApi.NormalizeSurveyResponseResponse>((input, done) => client4.normalizeSurveyResponse(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client5 = clients.get<customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient>("acme.customers.v1.ConsentRecordCalculationService");
  queue.consume<customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsRequest, customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsResponse>("acme.surveys.v1.SurveyResponseApprovalService/SubmitSurveyResponse:1", async (request) =>
    call<customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsRequest, customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsResponse>((input, done) => client5.compareConsentRecordOptions(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client6 = clients.get<notificationsDeliveryAttemptCalculationServiceApi.DeliveryAttemptCalculationServiceClient>("acme.notifications.v1.DeliveryAttemptCalculationService");
  queue.consume<notificationsDeliveryAttemptCalculationServiceApi.ExplainDeliveryAttemptCalculationRequest, notificationsDeliveryAttemptCalculationServiceApi.ExplainDeliveryAttemptCalculationResponse>("acme.surveys.v1.SurveyResponseValidationService/NormalizeSurveyResponse:3", async (request) =>
    call<notificationsDeliveryAttemptCalculationServiceApi.ExplainDeliveryAttemptCalculationRequest, notificationsDeliveryAttemptCalculationServiceApi.ExplainDeliveryAttemptCalculationResponse>((input, done) => client6.explainDeliveryAttemptCalculation(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client7 = clients.get<surveysQuestionApprovalServiceApi.QuestionApprovalServiceClient>("acme.surveys.v1.QuestionApprovalService");
  queue.consume<surveysQuestionApprovalServiceApi.RecallQuestionRequest, surveysQuestionApprovalServiceApi.RecallQuestionResponse>("acme.surveys.v1.SurveyResponseWorkflowService/StartSurveyResponseWorkflow:0", async (request) =>
    call<surveysQuestionApprovalServiceApi.RecallQuestionRequest, surveysQuestionApprovalServiceApi.RecallQuestionResponse>((input, done) => client7.recallQuestion(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client8 = clients.get<surveysQuestionCalculationServiceApi.QuestionCalculationServiceClient>("acme.surveys.v1.QuestionCalculationService");
  queue.consume<surveysQuestionCalculationServiceApi.CompareQuestionOptionsRequest, surveysQuestionCalculationServiceApi.CompareQuestionOptionsResponse>("acme.surveys.v1.SurveyWorkflowService/AdvanceSurveyWorkflow:1", async (request) =>
    call<surveysQuestionCalculationServiceApi.CompareQuestionOptionsRequest, surveysQuestionCalculationServiceApi.CompareQuestionOptionsResponse>((input, done) => client8.compareQuestionOptions(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
}
