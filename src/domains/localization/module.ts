/**
 * Register the localization team's public gRPC boundary and workers.
 */

import * as customersCustomerCalculationServiceApi from "../../../.cache/proto/acme/customers/v1/customer_calculation_service.js";
import * as featurestoreFeatureViewCalculationServiceApi from "../../../.cache/proto/acme/featurestore/v1/feature_view_calculation_service.js";
import * as ledgerLedgerAccountQueryServiceApi from "../../../.cache/proto/acme/ledger/v1/ledger_account_query_service.js";
import * as localizationLocaleApprovalServiceApi from "../../../.cache/proto/acme/localization/v1/locale_approval_service.js";
import * as localizationLocaleCalculationServiceApi from "../../../.cache/proto/acme/localization/v1/locale_calculation_service.js";
import * as localizationLocaleLifecycleServiceApi from "../../../.cache/proto/acme/localization/v1/locale_lifecycle_service.js";
import * as localizationLocaleQueryServiceApi from "../../../.cache/proto/acme/localization/v1/locale_query_service.js";
import * as localizationLocaleValidationServiceApi from "../../../.cache/proto/acme/localization/v1/locale_validation_service.js";
import * as localizationLocaleWorkflowServiceApi from "../../../.cache/proto/acme/localization/v1/locale_workflow_service.js";
import * as localizationTranslationJobApprovalServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_approval_service.js";
import * as localizationTranslationJobCalculationServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_calculation_service.js";
import * as localizationTranslationJobLifecycleServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_lifecycle_service.js";
import * as localizationTranslationJobReportingServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_reporting_service.js";
import * as localizationTranslationJobValidationServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_validation_service.js";
import * as localizationTranslationJobWorkflowServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_workflow_service.js";
import * as localizationTranslationKeyApprovalServiceApi from "../../../.cache/proto/acme/localization/v1/translation_key_approval_service.js";
import * as localizationTranslationKeyCalculationServiceApi from "../../../.cache/proto/acme/localization/v1/translation_key_calculation_service.js";
import * as localizationTranslationKeyQueryServiceApi from "../../../.cache/proto/acme/localization/v1/translation_key_query_service.js";
import * as localizationTranslationKeyServiceApi from "../../../.cache/proto/acme/localization/v1/translation_key_service.js";
import * as localizationTranslationKeyValidationServiceApi from "../../../.cache/proto/acme/localization/v1/translation_key_validation_service.js";
import * as localizationTranslationKeyWorkflowServiceApi from "../../../.cache/proto/acme/localization/v1/translation_key_workflow_service.js";
import * as notificationsDeliveryAttemptExportServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_export_service.js";
import * as notificationsDeliveryAttemptValidationServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_validation_service.js";
import * as notificationsNotificationHistoryServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import * as notificationsNotificationNotificationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_notification_service.js";
import * as notificationsNotificationTemplateValidationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_validation_service.js";
import * as personalizationAffinityApprovalServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_approval_service.js";
import * as recruitingJobOpeningCalculationServiceApi from "../../../.cache/proto/acme/recruiting/v1/job_opening_calculation_service.js";
import { ClientRegistry } from "../../platform/registry.js";
import { call, metadataFor } from "../../platform/rpc.js";
import { WorkQueue } from "../../platform/work-queue.js";
import {
  LocaleCalculationHandler,
  implementation as bindLocaleCalculationHandler,
} from "./features/locale/locale-calculation.handler.js";
import {
  LocaleValidationHandler,
  implementation as bindLocaleValidationHandler,
} from "./features/locale/locale-validation.handler.js";
import {
  TranslationJobCalculationHandler,
  implementation as bindTranslationJobCalculationHandler,
} from "./features/translation-job/translation-job-calculation.handler.js";
import {
  TranslationJobValidationHandler,
  implementation as bindTranslationJobValidationHandler,
} from "./features/translation-job/translation-job-validation.handler.js";
import {
  TranslationKeyCalculationHandler,
  implementation as bindTranslationKeyCalculationHandler,
} from "./features/translation-key/translation-key-calculation.handler.js";
import {
  TranslationKeyValidationHandler,
  implementation as bindTranslationKeyValidationHandler,
} from "./features/translation-key/translation-key-validation.handler.js";
import { LocaleApprovalHandler, implementation as bindLocaleApprovalHandler } from "./services/locale-approval.js";
import { LocaleQueryHandler, implementation as bindLocaleQueryHandler } from "./services/locale-query.js";
import {
  TranslationJobApprovalHandler,
  implementation as bindTranslationJobApprovalHandler,
} from "./services/translation-job-approval.js";
import {
  TranslationJobReportingHandler,
  implementation as bindTranslationJobReportingHandler,
} from "./services/translation-job-reporting.js";
import {
  TranslationKeyApprovalHandler,
  implementation as bindTranslationKeyApprovalHandler,
} from "./services/translation-key-approval.js";
import { TranslationKeyHandler, implementation as bindTranslationKeyHandler } from "./services/translation-key.js";
import { LocaleLifecycleHandler, implementation as bindLocaleLifecycleHandler } from "./transport/locale-lifecycle.js";
import { LocaleWorkflowHandler, implementation as bindLocaleWorkflowHandler } from "./transport/locale-workflow.js";
import {
  TranslationJobLifecycleHandler,
  implementation as bindTranslationJobLifecycleHandler,
} from "./transport/translation-job-lifecycle.js";
import {
  TranslationJobWorkflowHandler,
  implementation as bindTranslationJobWorkflowHandler,
} from "./transport/translation-job-workflow.js";
import {
  TranslationKeyQueryHandler,
  implementation as bindTranslationKeyQueryHandler,
} from "./transport/translation-key-query.js";
import {
  TranslationKeyWorkflowHandler,
  implementation as bindTranslationKeyWorkflowHandler,
} from "./transport/translation-key-workflow.js";
import { type Server } from "@grpc/grpc-js";
import { type DependencyContainer } from "tsyringe";

export function register(server: Server, scope: DependencyContainer): void {
  server.addService(localizationLocaleApprovalServiceApi.LocaleApprovalServiceService, bindLocaleApprovalHandler(scope.resolve(LocaleApprovalHandler)));
  server.addService(localizationLocaleCalculationServiceApi.LocaleCalculationServiceService, bindLocaleCalculationHandler(scope.resolve(LocaleCalculationHandler)));
  server.addService(localizationLocaleLifecycleServiceApi.LocaleLifecycleServiceService, bindLocaleLifecycleHandler(scope.resolve(LocaleLifecycleHandler)));
  server.addService(localizationLocaleQueryServiceApi.LocaleQueryServiceService, bindLocaleQueryHandler(scope.resolve(LocaleQueryHandler)));
  server.addService(localizationLocaleValidationServiceApi.LocaleValidationServiceService, bindLocaleValidationHandler(scope.resolve(LocaleValidationHandler)));
  server.addService(localizationLocaleWorkflowServiceApi.LocaleWorkflowServiceService, bindLocaleWorkflowHandler(scope.resolve(LocaleWorkflowHandler)));
  server.addService(localizationTranslationJobApprovalServiceApi.TranslationJobApprovalServiceService, bindTranslationJobApprovalHandler(scope.resolve(TranslationJobApprovalHandler)));
  server.addService(localizationTranslationJobCalculationServiceApi.TranslationJobCalculationServiceService, bindTranslationJobCalculationHandler(scope.resolve(TranslationJobCalculationHandler)));
  server.addService(localizationTranslationJobLifecycleServiceApi.TranslationJobLifecycleServiceService, bindTranslationJobLifecycleHandler(scope.resolve(TranslationJobLifecycleHandler)));
  server.addService(localizationTranslationJobReportingServiceApi.TranslationJobReportingServiceService, bindTranslationJobReportingHandler(scope.resolve(TranslationJobReportingHandler)));
  server.addService(localizationTranslationJobValidationServiceApi.TranslationJobValidationServiceService, bindTranslationJobValidationHandler(scope.resolve(TranslationJobValidationHandler)));
  server.addService(localizationTranslationJobWorkflowServiceApi.TranslationJobWorkflowServiceService, bindTranslationJobWorkflowHandler(scope.resolve(TranslationJobWorkflowHandler)));
  server.addService(localizationTranslationKeyApprovalServiceApi.TranslationKeyApprovalServiceService, bindTranslationKeyApprovalHandler(scope.resolve(TranslationKeyApprovalHandler)));
  server.addService(localizationTranslationKeyCalculationServiceApi.TranslationKeyCalculationServiceService, bindTranslationKeyCalculationHandler(scope.resolve(TranslationKeyCalculationHandler)));
  server.addService(localizationTranslationKeyQueryServiceApi.TranslationKeyQueryServiceService, bindTranslationKeyQueryHandler(scope.resolve(TranslationKeyQueryHandler)));
  server.addService(localizationTranslationKeyServiceApi.TranslationKeyServiceService, bindTranslationKeyHandler(scope.resolve(TranslationKeyHandler)));
  server.addService(localizationTranslationKeyValidationServiceApi.TranslationKeyValidationServiceService, bindTranslationKeyValidationHandler(scope.resolve(TranslationKeyValidationHandler)));
  server.addService(localizationTranslationKeyWorkflowServiceApi.TranslationKeyWorkflowServiceService, bindTranslationKeyWorkflowHandler(scope.resolve(TranslationKeyWorkflowHandler)));
}

export function startWorkers(scope: DependencyContainer): void {
  const queue = scope.resolve<WorkQueue>("workQueue");
  const clients = scope.resolve<ClientRegistry>("clients");
  const client0 = clients.get<localizationTranslationJobValidationServiceApi.TranslationJobValidationServiceClient>("acme.localization.v1.TranslationJobValidationService");
  queue.consume<localizationTranslationJobValidationServiceApi.LintTranslationJobsRequest, localizationTranslationJobValidationServiceApi.LintTranslationJobsResponse>("acme.localization.v1.LocaleApprovalService/GetLocaleApprovalStatus:0", async (request) =>
    call<localizationTranslationJobValidationServiceApi.LintTranslationJobsRequest, localizationTranslationJobValidationServiceApi.LintTranslationJobsResponse>((input, done) => client0.lintTranslationJobs(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client1 = clients.get<notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient>("acme.notifications.v1.DeliveryAttemptValidationService");
  queue.consume<notificationsDeliveryAttemptValidationServiceApi.NormalizeDeliveryAttemptRequest, notificationsDeliveryAttemptValidationServiceApi.NormalizeDeliveryAttemptResponse>("acme.localization.v1.LocaleCalculationService/QuoteLocale:0", async (request) =>
    call<notificationsDeliveryAttemptValidationServiceApi.NormalizeDeliveryAttemptRequest, notificationsDeliveryAttemptValidationServiceApi.NormalizeDeliveryAttemptResponse>((input, done) => client1.normalizeDeliveryAttempt(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client2 = clients.get<personalizationAffinityApprovalServiceApi.AffinityApprovalServiceClient>("acme.personalization.v1.AffinityApprovalService");
  queue.consume<personalizationAffinityApprovalServiceApi.RecallAffinityRequest, personalizationAffinityApprovalServiceApi.RecallAffinityResponse>("acme.localization.v1.LocaleLifecycleService/ScheduleLocaleExpiry:1", async (request) =>
    call<personalizationAffinityApprovalServiceApi.RecallAffinityRequest, personalizationAffinityApprovalServiceApi.RecallAffinityResponse>((input, done) => client2.recallAffinity(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client3 = clients.get<notificationsNotificationTemplateValidationServiceApi.NotificationTemplateValidationServiceClient>("acme.notifications.v1.NotificationTemplateValidationService");
  queue.consume<notificationsNotificationTemplateValidationServiceApi.CheckNotificationTemplateEligibilityRequest, notificationsNotificationTemplateValidationServiceApi.CheckNotificationTemplateEligibilityResponse>("acme.localization.v1.LocaleValidationService/CheckLocaleEligibility:0", async (request) =>
    call<notificationsNotificationTemplateValidationServiceApi.CheckNotificationTemplateEligibilityRequest, notificationsNotificationTemplateValidationServiceApi.CheckNotificationTemplateEligibilityResponse>((input, done) => client3.checkNotificationTemplateEligibility(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client4 = clients.get<notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient>("acme.notifications.v1.DeliveryAttemptExportService");
  queue.consume<notificationsDeliveryAttemptExportServiceApi.RetryDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.RetryDeliveryAttemptExportResponse>("acme.localization.v1.LocaleWorkflowService/CancelLocaleWorkflow:2", async (request) =>
    call<notificationsDeliveryAttemptExportServiceApi.RetryDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.RetryDeliveryAttemptExportResponse>((input, done) => client4.retryDeliveryAttemptExport(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client5 = clients.get<notificationsNotificationNotificationServiceApi.NotificationNotificationServiceClient>("acme.notifications.v1.NotificationNotificationService");
  queue.consume<notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesRequest, notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesResponse>("acme.localization.v1.TranslationJobApprovalService/RecallTranslationJob:0", async (request) =>
    call<notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesRequest, notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesResponse>((input, done) => client5.unsubscribeNotificationUpdates(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client6 = clients.get<customersCustomerCalculationServiceApi.CustomerCalculationServiceClient>("acme.customers.v1.CustomerCalculationService");
  queue.consume<customersCustomerCalculationServiceApi.RecalculateCustomersRequest, customersCustomerCalculationServiceApi.RecalculateCustomersResponse>("acme.localization.v1.TranslationJobLifecycleService/ExpireTranslationJob:0", async (request) =>
    call<customersCustomerCalculationServiceApi.RecalculateCustomersRequest, customersCustomerCalculationServiceApi.RecalculateCustomersResponse>((input, done) => client6.recalculateCustomers(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client7 = clients.get<localizationTranslationKeyServiceApi.TranslationKeyServiceClient>("acme.localization.v1.TranslationKeyService");
  queue.consume<localizationTranslationKeyServiceApi.SearchTranslationKeysRequest, localizationTranslationKeyServiceApi.SearchTranslationKeysResponse>("acme.localization.v1.TranslationJobLifecycleService/TerminateTranslationJob:3", async (request) =>
    call<localizationTranslationKeyServiceApi.SearchTranslationKeysRequest, localizationTranslationKeyServiceApi.SearchTranslationKeysResponse>((input, done) => client7.searchTranslationKeys(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client8 = clients.get<localizationTranslationKeyValidationServiceApi.TranslationKeyValidationServiceClient>("acme.localization.v1.TranslationKeyValidationService");
  queue.consume<localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityRequest, localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityResponse>("acme.localization.v1.TranslationJobValidationService/GetTranslationJobRules:0", async (request) =>
    call<localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityRequest, localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityResponse>((input, done) => client8.checkTranslationKeyEligibility(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client9 = clients.get<ledgerLedgerAccountQueryServiceApi.LedgerAccountQueryServiceClient>("acme.ledger.v1.LedgerAccountQueryService");
  queue.consume<ledgerLedgerAccountQueryServiceApi.SuggestLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.SuggestLedgerAccountsResponse>("acme.localization.v1.TranslationJobWorkflowService/RetryTranslationJobWorkflow:2", async (request) =>
    call<ledgerLedgerAccountQueryServiceApi.SuggestLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.SuggestLedgerAccountsResponse>((input, done) => client9.suggestLedgerAccounts(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client10 = clients.get<localizationTranslationJobCalculationServiceApi.TranslationJobCalculationServiceClient>("acme.localization.v1.TranslationJobCalculationService");
  queue.consume<localizationTranslationJobCalculationServiceApi.EstimateTranslationJobRequest, localizationTranslationJobCalculationServiceApi.EstimateTranslationJobResponse>("acme.localization.v1.TranslationKeyApprovalService/GetTranslationKeyApprovalStatus:1", async (request) =>
    call<localizationTranslationJobCalculationServiceApi.EstimateTranslationJobRequest, localizationTranslationJobCalculationServiceApi.EstimateTranslationJobResponse>((input, done) => client10.estimateTranslationJob(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client11 = clients.get<featurestoreFeatureViewCalculationServiceApi.FeatureViewCalculationServiceClient>("acme.featurestore.v1.FeatureViewCalculationService");
  queue.consume<featurestoreFeatureViewCalculationServiceApi.QuoteFeatureViewRequest, featurestoreFeatureViewCalculationServiceApi.QuoteFeatureViewResponse>("acme.localization.v1.TranslationKeyCalculationService/EstimateTranslationKey:0", async (request) =>
    call<featurestoreFeatureViewCalculationServiceApi.QuoteFeatureViewRequest, featurestoreFeatureViewCalculationServiceApi.QuoteFeatureViewResponse>((input, done) => client11.quoteFeatureView(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client12 = clients.get<localizationTranslationKeyValidationServiceApi.TranslationKeyValidationServiceClient>("acme.localization.v1.TranslationKeyValidationService");
  queue.consume<localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityRequest, localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityResponse>("acme.localization.v1.TranslationKeyQueryService/SummarizeTranslationKeys:0", async (request) =>
    call<localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityRequest, localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityResponse>((input, done) => client12.checkTranslationKeyEligibility(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client13 = clients.get<notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient>("acme.notifications.v1.NotificationHistoryService");
  queue.consume<notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest, notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionResponse>("acme.localization.v1.TranslationKeyValidationService/NormalizeTranslationKey:0", async (request) =>
    call<notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest, notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionResponse>((input, done) => client13.annotateNotificationVersion(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client14 = clients.get<recruitingJobOpeningCalculationServiceApi.JobOpeningCalculationServiceClient>("acme.recruiting.v1.JobOpeningCalculationService");
  queue.consume<recruitingJobOpeningCalculationServiceApi.RecalculateJobOpeningsRequest, recruitingJobOpeningCalculationServiceApi.RecalculateJobOpeningsResponse>("acme.localization.v1.TranslationKeyWorkflowService/PauseTranslationKeyWorkflow:1", async (request) =>
    call<recruitingJobOpeningCalculationServiceApi.RecalculateJobOpeningsRequest, recruitingJobOpeningCalculationServiceApi.RecalculateJobOpeningsResponse>((input, done) => client14.recalculateJobOpenings(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
}
