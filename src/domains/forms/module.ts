/**
 * Register the forms team's public gRPC boundary and workers.
 */

import * as anomaliesAnomalyServiceApi from "../../../.cache/proto/acme/anomalies/v1/anomaly_service.js";
import * as communityPostValidationServiceApi from "../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as customersCustomerCalculationServiceApi from "../../../.cache/proto/acme/customers/v1/customer_calculation_service.js";
import * as formsFormApprovalServiceApi from "../../../.cache/proto/acme/forms/v1/form_approval_service.js";
import * as formsFormCalculationServiceApi from "../../../.cache/proto/acme/forms/v1/form_calculation_service.js";
import * as formsFormFieldApprovalServiceApi from "../../../.cache/proto/acme/forms/v1/form_field_approval_service.js";
import * as formsFormFieldCalculationServiceApi from "../../../.cache/proto/acme/forms/v1/form_field_calculation_service.js";
import * as formsFormFieldLifecycleServiceApi from "../../../.cache/proto/acme/forms/v1/form_field_lifecycle_service.js";
import * as formsFormFieldValidationServiceApi from "../../../.cache/proto/acme/forms/v1/form_field_validation_service.js";
import * as formsFormFieldWorkflowServiceApi from "../../../.cache/proto/acme/forms/v1/form_field_workflow_service.js";
import * as formsFormQueryServiceApi from "../../../.cache/proto/acme/forms/v1/form_query_service.js";
import * as formsFormServiceApi from "../../../.cache/proto/acme/forms/v1/form_service.js";
import * as formsFormSubmissionApprovalServiceApi from "../../../.cache/proto/acme/forms/v1/form_submission_approval_service.js";
import * as formsFormSubmissionCalculationServiceApi from "../../../.cache/proto/acme/forms/v1/form_submission_calculation_service.js";
import * as formsFormSubmissionLifecycleServiceApi from "../../../.cache/proto/acme/forms/v1/form_submission_lifecycle_service.js";
import * as formsFormSubmissionQueryServiceApi from "../../../.cache/proto/acme/forms/v1/form_submission_query_service.js";
import * as formsFormSubmissionValidationServiceApi from "../../../.cache/proto/acme/forms/v1/form_submission_validation_service.js";
import * as formsFormSubmissionWorkflowServiceApi from "../../../.cache/proto/acme/forms/v1/form_submission_workflow_service.js";
import * as formsFormValidationServiceApi from "../../../.cache/proto/acme/forms/v1/form_validation_service.js";
import * as formsFormWorkflowServiceApi from "../../../.cache/proto/acme/forms/v1/form_workflow_service.js";
import * as labelingLabelingTaskQueryServiceApi from "../../../.cache/proto/acme/labeling/v1/labeling_task_query_service.js";
import * as personalizationAffinityReportingServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_reporting_service.js";
import * as schedulingShiftQueryServiceApi from "../../../.cache/proto/acme/scheduling/v1/shift_query_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import { ClientRegistry } from "../../platform/registry.js";
import { call, metadataFor } from "../../platform/rpc.js";
import { WorkQueue } from "../../platform/work-queue.js";
import {
  FormFieldCalculationHandler,
  implementation as bindFormFieldCalculationHandler,
} from "./features/form-field/form-field-calculation.handler.js";
import {
  FormFieldWorkflowHandler,
  implementation as bindFormFieldWorkflowHandler,
} from "./features/form-field/form-field-workflow.handler.js";
import {
  FormSubmissionApprovalHandler,
  implementation as bindFormSubmissionApprovalHandler,
} from "./features/form-submission/form-submission-approval.handler.js";
import {
  FormSubmissionQueryHandler,
  implementation as bindFormSubmissionQueryHandler,
} from "./features/form-submission/form-submission-query.handler.js";
import {
  FormApprovalHandler,
  implementation as bindFormApprovalHandler,
} from "./features/form/form-approval.handler.js";
import {
  FormValidationHandler,
  implementation as bindFormValidationHandler,
} from "./features/form/form-validation.handler.js";
import {
  FormFieldApprovalHandler,
  implementation as bindFormFieldApprovalHandler,
} from "./services/form-field-approval.js";
import {
  FormFieldValidationHandler,
  implementation as bindFormFieldValidationHandler,
} from "./services/form-field-validation.js";
import {
  FormSubmissionLifecycleHandler,
  implementation as bindFormSubmissionLifecycleHandler,
} from "./services/form-submission-lifecycle.js";
import {
  FormSubmissionWorkflowHandler,
  implementation as bindFormSubmissionWorkflowHandler,
} from "./services/form-submission-workflow.js";
import { FormHandler, implementation as bindFormHandler } from "./services/form.js";
import { FormCalculationHandler, implementation as bindFormCalculationHandler } from "./transport/form-calculation.js";
import {
  FormFieldLifecycleHandler,
  implementation as bindFormFieldLifecycleHandler,
} from "./transport/form-field-lifecycle.js";
import { FormQueryHandler, implementation as bindFormQueryHandler } from "./transport/form-query.js";
import {
  FormSubmissionCalculationHandler,
  implementation as bindFormSubmissionCalculationHandler,
} from "./transport/form-submission-calculation.js";
import {
  FormSubmissionValidationHandler,
  implementation as bindFormSubmissionValidationHandler,
} from "./transport/form-submission-validation.js";
import { FormWorkflowHandler, implementation as bindFormWorkflowHandler } from "./transport/form-workflow.js";
import { type Server } from "@grpc/grpc-js";
import { type DependencyContainer } from "tsyringe";

export function register(server: Server, scope: DependencyContainer): void {
  server.addService(formsFormApprovalServiceApi.FormApprovalServiceService, bindFormApprovalHandler(scope.resolve(FormApprovalHandler)));
  server.addService(formsFormCalculationServiceApi.FormCalculationServiceService, bindFormCalculationHandler(scope.resolve(FormCalculationHandler)));
  server.addService(formsFormFieldApprovalServiceApi.FormFieldApprovalServiceService, bindFormFieldApprovalHandler(scope.resolve(FormFieldApprovalHandler)));
  server.addService(formsFormFieldCalculationServiceApi.FormFieldCalculationServiceService, bindFormFieldCalculationHandler(scope.resolve(FormFieldCalculationHandler)));
  server.addService(formsFormFieldLifecycleServiceApi.FormFieldLifecycleServiceService, bindFormFieldLifecycleHandler(scope.resolve(FormFieldLifecycleHandler)));
  server.addService(formsFormFieldValidationServiceApi.FormFieldValidationServiceService, bindFormFieldValidationHandler(scope.resolve(FormFieldValidationHandler)));
  server.addService(formsFormFieldWorkflowServiceApi.FormFieldWorkflowServiceService, bindFormFieldWorkflowHandler(scope.resolve(FormFieldWorkflowHandler)));
  server.addService(formsFormQueryServiceApi.FormQueryServiceService, bindFormQueryHandler(scope.resolve(FormQueryHandler)));
  server.addService(formsFormServiceApi.FormServiceService, bindFormHandler(scope.resolve(FormHandler)));
  server.addService(formsFormSubmissionApprovalServiceApi.FormSubmissionApprovalServiceService, bindFormSubmissionApprovalHandler(scope.resolve(FormSubmissionApprovalHandler)));
  server.addService(formsFormSubmissionCalculationServiceApi.FormSubmissionCalculationServiceService, bindFormSubmissionCalculationHandler(scope.resolve(FormSubmissionCalculationHandler)));
  server.addService(formsFormSubmissionLifecycleServiceApi.FormSubmissionLifecycleServiceService, bindFormSubmissionLifecycleHandler(scope.resolve(FormSubmissionLifecycleHandler)));
  server.addService(formsFormSubmissionQueryServiceApi.FormSubmissionQueryServiceService, bindFormSubmissionQueryHandler(scope.resolve(FormSubmissionQueryHandler)));
  server.addService(formsFormSubmissionValidationServiceApi.FormSubmissionValidationServiceService, bindFormSubmissionValidationHandler(scope.resolve(FormSubmissionValidationHandler)));
  server.addService(formsFormSubmissionWorkflowServiceApi.FormSubmissionWorkflowServiceService, bindFormSubmissionWorkflowHandler(scope.resolve(FormSubmissionWorkflowHandler)));
  server.addService(formsFormValidationServiceApi.FormValidationServiceService, bindFormValidationHandler(scope.resolve(FormValidationHandler)));
  server.addService(formsFormWorkflowServiceApi.FormWorkflowServiceService, bindFormWorkflowHandler(scope.resolve(FormWorkflowHandler)));
}

export function startWorkers(scope: DependencyContainer): void {
  const queue = scope.resolve<WorkQueue>("workQueue");
  const clients = scope.resolve<ClientRegistry>("clients");
  const client0 = clients.get<customersCustomerCalculationServiceApi.CustomerCalculationServiceClient>("acme.customers.v1.CustomerCalculationService");
  queue.consume<customersCustomerCalculationServiceApi.SimulateCustomerRequest, customersCustomerCalculationServiceApi.SimulateCustomerResponse>("acme.forms.v1.FormApprovalService/EscalateForm:0", async (request) =>
    call<customersCustomerCalculationServiceApi.SimulateCustomerRequest, customersCustomerCalculationServiceApi.SimulateCustomerResponse>((input, done) => client0.simulateCustomer(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client1 = clients.get<labelingLabelingTaskQueryServiceApi.LabelingTaskQueryServiceClient>("acme.labeling.v1.LabelingTaskQueryService");
  queue.consume<labelingLabelingTaskQueryServiceApi.SuggestLabelingTasksRequest, labelingLabelingTaskQueryServiceApi.SuggestLabelingTasksResponse>("acme.forms.v1.FormCalculationService/QuoteForm:1", async (request) =>
    call<labelingLabelingTaskQueryServiceApi.SuggestLabelingTasksRequest, labelingLabelingTaskQueryServiceApi.SuggestLabelingTasksResponse>((input, done) => client1.suggestLabelingTasks(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client2 = clients.get<communityPostValidationServiceApi.PostValidationServiceClient>("acme.community.v1.PostValidationService");
  queue.consume<communityPostValidationServiceApi.LintPostsRequest, communityPostValidationServiceApi.LintPostsResponse>("acme.forms.v1.FormFieldCalculationService/CalculateFormField:0", async (request) =>
    call<communityPostValidationServiceApi.LintPostsRequest, communityPostValidationServiceApi.LintPostsResponse>((input, done) => client2.lintPosts(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client3 = clients.get<formsFormSubmissionValidationServiceApi.FormSubmissionValidationServiceClient>("acme.forms.v1.FormSubmissionValidationService");
  queue.consume<formsFormSubmissionValidationServiceApi.LintFormSubmissionsRequest, formsFormSubmissionValidationServiceApi.LintFormSubmissionsResponse>("acme.forms.v1.FormFieldLifecycleService/ReinstateFormField:0", async (request) =>
    call<formsFormSubmissionValidationServiceApi.LintFormSubmissionsRequest, formsFormSubmissionValidationServiceApi.LintFormSubmissionsResponse>((input, done) => client3.lintFormSubmissions(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client4 = clients.get<formsFormSubmissionValidationServiceApi.FormSubmissionValidationServiceClient>("acme.forms.v1.FormSubmissionValidationService");
  queue.consume<formsFormSubmissionValidationServiceApi.NormalizeFormSubmissionRequest, formsFormSubmissionValidationServiceApi.NormalizeFormSubmissionResponse>("acme.forms.v1.FormFieldValidationService/ValidateFormField:0", async (request) =>
    call<formsFormSubmissionValidationServiceApi.NormalizeFormSubmissionRequest, formsFormSubmissionValidationServiceApi.NormalizeFormSubmissionResponse>((input, done) => client4.normalizeFormSubmission(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client5 = clients.get<formsFormFieldCalculationServiceApi.FormFieldCalculationServiceClient>("acme.forms.v1.FormFieldCalculationService");
  queue.consume<formsFormFieldCalculationServiceApi.CalculateFormFieldRequest, formsFormFieldCalculationServiceApi.CalculateFormFieldResponse>("acme.forms.v1.FormQueryService/BrowseForms:0", async (request) =>
    call<formsFormFieldCalculationServiceApi.CalculateFormFieldRequest, formsFormFieldCalculationServiceApi.CalculateFormFieldResponse>((input, done) => client5.calculateFormField(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client6 = clients.get<searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient>("acme.search.v1.SearchIndexValidationService");
  queue.consume<searchSearchIndexValidationServiceApi.LintSearchIndexesRequest, searchSearchIndexValidationServiceApi.LintSearchIndexesResponse>("acme.forms.v1.FormService/ListForms:1", async (request) =>
    call<searchSearchIndexValidationServiceApi.LintSearchIndexesRequest, searchSearchIndexValidationServiceApi.LintSearchIndexesResponse>((input, done) => client6.lintSearchIndexes(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client7 = clients.get<schedulingShiftQueryServiceApi.ShiftQueryServiceClient>("acme.scheduling.v1.ShiftQueryService");
  queue.consume<schedulingShiftQueryServiceApi.BrowseShiftsRequest, schedulingShiftQueryServiceApi.BrowseShiftsResponse>("acme.forms.v1.FormSubmissionApprovalService/RecallFormSubmission:3", async (request) =>
    call<schedulingShiftQueryServiceApi.BrowseShiftsRequest, schedulingShiftQueryServiceApi.BrowseShiftsResponse>((input, done) => client7.browseShifts(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client8 = clients.get<personalizationAffinityReportingServiceApi.AffinityReportingServiceClient>("acme.personalization.v1.AffinityReportingService");
  queue.consume<personalizationAffinityReportingServiceApi.GenerateAffinityReportRequest, personalizationAffinityReportingServiceApi.GenerateAffinityReportResponse>("acme.forms.v1.FormSubmissionLifecycleService/ExpireFormSubmission:0", async (request) =>
    call<personalizationAffinityReportingServiceApi.GenerateAffinityReportRequest, personalizationAffinityReportingServiceApi.GenerateAffinityReportResponse>((input, done) => client8.generateAffinityReport(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client9 = clients.get<anomaliesAnomalyServiceApi.AnomalyServiceClient>("acme.anomalies.v1.AnomalyService");
  queue.consume<anomaliesAnomalyServiceApi.UpdateAnomalyRequest, anomaliesAnomalyServiceApi.UpdateAnomalyResponse>("acme.forms.v1.FormSubmissionQueryService/ResolveFormSubmissions:0", async (request) =>
    call<anomaliesAnomalyServiceApi.UpdateAnomalyRequest, anomaliesAnomalyServiceApi.UpdateAnomalyResponse>((input, done) => client9.updateAnomaly(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client10 = clients.get<formsFormValidationServiceApi.FormValidationServiceClient>("acme.forms.v1.FormValidationService");
  queue.consume<formsFormValidationServiceApi.ExplainFormDecisionRequest, formsFormValidationServiceApi.ExplainFormDecisionResponse>("acme.forms.v1.FormSubmissionWorkflowService/AdvanceFormSubmissionWorkflow:0", async (request) =>
    call<formsFormValidationServiceApi.ExplainFormDecisionRequest, formsFormValidationServiceApi.ExplainFormDecisionResponse>((input, done) => client10.explainFormDecision(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client11 = clients.get<formsFormCalculationServiceApi.FormCalculationServiceClient>("acme.forms.v1.FormCalculationService");
  queue.consume<formsFormCalculationServiceApi.GetFormRatesRequest, formsFormCalculationServiceApi.GetFormRatesResponse>("acme.forms.v1.FormValidationService/ExplainFormDecision:2", async (request) =>
    call<formsFormCalculationServiceApi.GetFormRatesRequest, formsFormCalculationServiceApi.GetFormRatesResponse>((input, done) => client11.getFormRates(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client12 = clients.get<formsFormSubmissionApprovalServiceApi.FormSubmissionApprovalServiceClient>("acme.forms.v1.FormSubmissionApprovalService");
  queue.consume<formsFormSubmissionApprovalServiceApi.RecallFormSubmissionRequest, formsFormSubmissionApprovalServiceApi.RecallFormSubmissionResponse>("acme.forms.v1.FormWorkflowService/InspectFormWorkflow:0", async (request) =>
    call<formsFormSubmissionApprovalServiceApi.RecallFormSubmissionRequest, formsFormSubmissionApprovalServiceApi.RecallFormSubmissionResponse>((input, done) => client12.recallFormSubmission(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
}
