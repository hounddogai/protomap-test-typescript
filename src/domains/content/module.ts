/**
 * Register the content team's public gRPC boundary and workers.
 */

import * as authorizationAccessPolicyQueryServiceApi from "../../../.cache/proto/acme/authorization/v1/access_policy_query_service.js";
import * as authorizationAccessPolicyServiceApi from "../../../.cache/proto/acme/authorization/v1/access_policy_service.js";
import * as concessionsConcessionStandQueryServiceApi from "../../../.cache/proto/acme/concessions/v1/concession_stand_query_service.js";
import * as contentArticleApprovalServiceApi from "../../../.cache/proto/acme/content/v1/article_approval_service.js";
import * as contentArticleQueryServiceApi from "../../../.cache/proto/acme/content/v1/article_query_service.js";
import * as contentArticleServiceApi from "../../../.cache/proto/acme/content/v1/article_service.js";
import * as contentArticleValidationServiceApi from "../../../.cache/proto/acme/content/v1/article_validation_service.js";
import * as contentArticleWorkflowServiceApi from "../../../.cache/proto/acme/content/v1/article_workflow_service.js";
import * as contentContentBlockApprovalServiceApi from "../../../.cache/proto/acme/content/v1/content_block_approval_service.js";
import * as contentContentBlockCalculationServiceApi from "../../../.cache/proto/acme/content/v1/content_block_calculation_service.js";
import * as contentContentBlockQueryServiceApi from "../../../.cache/proto/acme/content/v1/content_block_query_service.js";
import * as contentContentBlockValidationServiceApi from "../../../.cache/proto/acme/content/v1/content_block_validation_service.js";
import * as contentContentBlockWorkflowServiceApi from "../../../.cache/proto/acme/content/v1/content_block_workflow_service.js";
import * as contentContentRevisionApprovalServiceApi from "../../../.cache/proto/acme/content/v1/content_revision_approval_service.js";
import * as contentContentRevisionCalculationServiceApi from "../../../.cache/proto/acme/content/v1/content_revision_calculation_service.js";
import * as contentContentRevisionValidationServiceApi from "../../../.cache/proto/acme/content/v1/content_revision_validation_service.js";
import * as contentContentRevisionWorkflowServiceApi from "../../../.cache/proto/acme/content/v1/content_revision_workflow_service.js";
import * as contentTaxonomyApprovalServiceApi from "../../../.cache/proto/acme/content/v1/taxonomy_approval_service.js";
import * as contentTaxonomyCalculationServiceApi from "../../../.cache/proto/acme/content/v1/taxonomy_calculation_service.js";
import * as contentTaxonomyLifecycleServiceApi from "../../../.cache/proto/acme/content/v1/taxonomy_lifecycle_service.js";
import * as contentTaxonomyValidationServiceApi from "../../../.cache/proto/acme/content/v1/taxonomy_validation_service.js";
import * as customersCustomerCalculationServiceApi from "../../../.cache/proto/acme/customers/v1/customer_calculation_service.js";
import * as localizationLocaleValidationServiceApi from "../../../.cache/proto/acme/localization/v1/locale_validation_service.js";
import * as mediaMediaAssetSyncServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_sync_service.js";
import * as metricsMetricSeriesServiceApi from "../../../.cache/proto/acme/metrics/v1/metric_series_service.js";
import * as notificationsDeliveryAttemptNotificationServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_notification_service.js";
import * as notificationsSubscriptionHistoryServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_history_service.js";
import * as webhooksWebhookSecretCalculationServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_secret_calculation_service.js";
import { ClientRegistry } from "../../platform/registry.js";
import { call, metadataFor } from "../../platform/rpc.js";
import { WorkQueue } from "../../platform/work-queue.js";
import {
  ArticleApprovalHandler,
  implementation as bindArticleApprovalHandler,
} from "./features/article/article-approval.handler.js";
import {
  ArticleValidationHandler,
  implementation as bindArticleValidationHandler,
} from "./features/article/article-validation.handler.js";
import {
  ContentBlockCalculationHandler,
  implementation as bindContentBlockCalculationHandler,
} from "./features/content-block/content-block-calculation.handler.js";
import {
  ContentBlockWorkflowHandler,
  implementation as bindContentBlockWorkflowHandler,
} from "./features/content-block/content-block-workflow.handler.js";
import {
  ContentRevisionValidationHandler,
  implementation as bindContentRevisionValidationHandler,
} from "./features/content-revision/content-revision-validation.handler.js";
import {
  TaxonomyCalculationHandler,
  implementation as bindTaxonomyCalculationHandler,
} from "./features/taxonomy/taxonomy-calculation.handler.js";
import { ArticleHandler, implementation as bindArticleHandler } from "./services/article.js";
import {
  ContentBlockApprovalHandler,
  implementation as bindContentBlockApprovalHandler,
} from "./services/content-block-approval.js";
import {
  ContentBlockValidationHandler,
  implementation as bindContentBlockValidationHandler,
} from "./services/content-block-validation.js";
import {
  ContentRevisionCalculationHandler,
  implementation as bindContentRevisionCalculationHandler,
} from "./services/content-revision-calculation.js";
import {
  TaxonomyApprovalHandler,
  implementation as bindTaxonomyApprovalHandler,
} from "./services/taxonomy-approval.js";
import {
  TaxonomyValidationHandler,
  implementation as bindTaxonomyValidationHandler,
} from "./services/taxonomy-validation.js";
import { ArticleQueryHandler, implementation as bindArticleQueryHandler } from "./transport/article-query.js";
import { ArticleWorkflowHandler, implementation as bindArticleWorkflowHandler } from "./transport/article-workflow.js";
import {
  ContentBlockQueryHandler,
  implementation as bindContentBlockQueryHandler,
} from "./transport/content-block-query.js";
import {
  ContentRevisionApprovalHandler,
  implementation as bindContentRevisionApprovalHandler,
} from "./transport/content-revision-approval.js";
import {
  ContentRevisionWorkflowHandler,
  implementation as bindContentRevisionWorkflowHandler,
} from "./transport/content-revision-workflow.js";
import {
  TaxonomyLifecycleHandler,
  implementation as bindTaxonomyLifecycleHandler,
} from "./transport/taxonomy-lifecycle.js";
import { type Server } from "@grpc/grpc-js";
import { type DependencyContainer } from "tsyringe";

export function register(server: Server, scope: DependencyContainer): void {
  server.addService(contentArticleApprovalServiceApi.ArticleApprovalServiceService, bindArticleApprovalHandler(scope.resolve(ArticleApprovalHandler)));
  server.addService(contentArticleQueryServiceApi.ArticleQueryServiceService, bindArticleQueryHandler(scope.resolve(ArticleQueryHandler)));
  server.addService(contentArticleServiceApi.ArticleServiceService, bindArticleHandler(scope.resolve(ArticleHandler)));
  server.addService(contentArticleValidationServiceApi.ArticleValidationServiceService, bindArticleValidationHandler(scope.resolve(ArticleValidationHandler)));
  server.addService(contentArticleWorkflowServiceApi.ArticleWorkflowServiceService, bindArticleWorkflowHandler(scope.resolve(ArticleWorkflowHandler)));
  server.addService(contentContentBlockApprovalServiceApi.ContentBlockApprovalServiceService, bindContentBlockApprovalHandler(scope.resolve(ContentBlockApprovalHandler)));
  server.addService(contentContentBlockCalculationServiceApi.ContentBlockCalculationServiceService, bindContentBlockCalculationHandler(scope.resolve(ContentBlockCalculationHandler)));
  server.addService(contentContentBlockQueryServiceApi.ContentBlockQueryServiceService, bindContentBlockQueryHandler(scope.resolve(ContentBlockQueryHandler)));
  server.addService(contentContentBlockValidationServiceApi.ContentBlockValidationServiceService, bindContentBlockValidationHandler(scope.resolve(ContentBlockValidationHandler)));
  server.addService(contentContentBlockWorkflowServiceApi.ContentBlockWorkflowServiceService, bindContentBlockWorkflowHandler(scope.resolve(ContentBlockWorkflowHandler)));
  server.addService(contentContentRevisionApprovalServiceApi.ContentRevisionApprovalServiceService, bindContentRevisionApprovalHandler(scope.resolve(ContentRevisionApprovalHandler)));
  server.addService(contentContentRevisionCalculationServiceApi.ContentRevisionCalculationServiceService, bindContentRevisionCalculationHandler(scope.resolve(ContentRevisionCalculationHandler)));
  server.addService(contentContentRevisionValidationServiceApi.ContentRevisionValidationServiceService, bindContentRevisionValidationHandler(scope.resolve(ContentRevisionValidationHandler)));
  server.addService(contentContentRevisionWorkflowServiceApi.ContentRevisionWorkflowServiceService, bindContentRevisionWorkflowHandler(scope.resolve(ContentRevisionWorkflowHandler)));
  server.addService(contentTaxonomyApprovalServiceApi.TaxonomyApprovalServiceService, bindTaxonomyApprovalHandler(scope.resolve(TaxonomyApprovalHandler)));
  server.addService(contentTaxonomyCalculationServiceApi.TaxonomyCalculationServiceService, bindTaxonomyCalculationHandler(scope.resolve(TaxonomyCalculationHandler)));
  server.addService(contentTaxonomyLifecycleServiceApi.TaxonomyLifecycleServiceService, bindTaxonomyLifecycleHandler(scope.resolve(TaxonomyLifecycleHandler)));
  server.addService(contentTaxonomyValidationServiceApi.TaxonomyValidationServiceService, bindTaxonomyValidationHandler(scope.resolve(TaxonomyValidationHandler)));
}

export function startWorkers(scope: DependencyContainer): void {
  const queue = scope.resolve<WorkQueue>("workQueue");
  const clients = scope.resolve<ClientRegistry>("clients");
  const client0 = clients.get<notificationsSubscriptionHistoryServiceApi.SubscriptionHistoryServiceClient>("acme.notifications.v1.SubscriptionHistoryService");
  queue.consume<notificationsSubscriptionHistoryServiceApi.AnnotateSubscriptionVersionRequest, notificationsSubscriptionHistoryServiceApi.AnnotateSubscriptionVersionResponse>("acme.content.v1.ArticleApprovalService/ListPendingArticles:1", async (request) =>
    call<notificationsSubscriptionHistoryServiceApi.AnnotateSubscriptionVersionRequest, notificationsSubscriptionHistoryServiceApi.AnnotateSubscriptionVersionResponse>((input, done) => client0.annotateSubscriptionVersion(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client1 = clients.get<webhooksWebhookSecretCalculationServiceApi.WebhookSecretCalculationServiceClient>("acme.webhooks.v1.WebhookSecretCalculationService");
  queue.consume<webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretResponse>("acme.content.v1.ArticleService/BatchGetArticles:1", async (request) =>
    call<webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretResponse>((input, done) => client1.calculateWebhookSecret(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client2 = clients.get<concessionsConcessionStandQueryServiceApi.ConcessionStandQueryServiceClient>("acme.concessions.v1.ConcessionStandQueryService");
  queue.consume<concessionsConcessionStandQueryServiceApi.BrowseConcessionStandsRequest, concessionsConcessionStandQueryServiceApi.BrowseConcessionStandsResponse>("acme.content.v1.ArticleValidationService/ScoreArticle:1", async (request) =>
    call<concessionsConcessionStandQueryServiceApi.BrowseConcessionStandsRequest, concessionsConcessionStandQueryServiceApi.BrowseConcessionStandsResponse>((input, done) => client2.browseConcessionStands(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client3 = clients.get<metricsMetricSeriesServiceApi.MetricSeriesServiceClient>("acme.metrics.v1.MetricSeriesService");
  queue.consume<metricsMetricSeriesServiceApi.CloneMetricSeriesRequest, metricsMetricSeriesServiceApi.CloneMetricSeriesResponse>("acme.content.v1.ContentBlockApprovalService/ApproveContentBlock:0", async (request) =>
    call<metricsMetricSeriesServiceApi.CloneMetricSeriesRequest, metricsMetricSeriesServiceApi.CloneMetricSeriesResponse>((input, done) => client3.cloneMetricSeries(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client4 = clients.get<contentArticleApprovalServiceApi.ArticleApprovalServiceClient>("acme.content.v1.ArticleApprovalService");
  queue.consume<contentArticleApprovalServiceApi.ApproveArticleRequest, contentArticleApprovalServiceApi.ApproveArticleResponse>("acme.content.v1.ContentBlockApprovalService/RecallContentBlock:1", async (request) =>
    call<contentArticleApprovalServiceApi.ApproveArticleRequest, contentArticleApprovalServiceApi.ApproveArticleResponse>((input, done) => client4.approveArticle(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client5 = clients.get<localizationLocaleValidationServiceApi.LocaleValidationServiceClient>("acme.localization.v1.LocaleValidationService");
  queue.consume<localizationLocaleValidationServiceApi.ValidateLocaleRequest, localizationLocaleValidationServiceApi.ValidateLocaleResponse>("acme.content.v1.ContentBlockCalculationService/SimulateContentBlock:1", async (request) =>
    call<localizationLocaleValidationServiceApi.ValidateLocaleRequest, localizationLocaleValidationServiceApi.ValidateLocaleResponse>((input, done) => client5.validateLocale(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client6 = clients.get<notificationsDeliveryAttemptNotificationServiceApi.DeliveryAttemptNotificationServiceClient>("acme.notifications.v1.DeliveryAttemptNotificationService");
  queue.consume<notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesRequest, notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesResponse>("acme.content.v1.ContentBlockValidationService/ScoreContentBlock:0", async (request) =>
    call<notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesRequest, notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesResponse>((input, done) => client6.unsubscribeDeliveryAttemptUpdates(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client7 = clients.get<mediaMediaAssetSyncServiceApi.MediaAssetSyncServiceClient>("acme.media.v1.MediaAssetSyncService");
  queue.consume<mediaMediaAssetSyncServiceApi.PushMediaAssetRequest, mediaMediaAssetSyncServiceApi.PushMediaAssetResponse>("acme.content.v1.ContentRevisionApprovalService/ListPendingContentRevisions:0", async (request) =>
    call<mediaMediaAssetSyncServiceApi.PushMediaAssetRequest, mediaMediaAssetSyncServiceApi.PushMediaAssetResponse>((input, done) => client7.pushMediaAsset(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client8 = clients.get<authorizationAccessPolicyServiceApi.AccessPolicyServiceClient>("acme.authorization.v1.AccessPolicyService");
  queue.consume<authorizationAccessPolicyServiceApi.BatchGetAccessPoliciesRequest, authorizationAccessPolicyServiceApi.BatchGetAccessPoliciesResponse>("acme.content.v1.ContentRevisionCalculationService/EstimateContentRevision:1", async (request) =>
    call<authorizationAccessPolicyServiceApi.BatchGetAccessPoliciesRequest, authorizationAccessPolicyServiceApi.BatchGetAccessPoliciesResponse>((input, done) => client8.batchGetAccessPolicies(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client9 = clients.get<customersCustomerCalculationServiceApi.CustomerCalculationServiceClient>("acme.customers.v1.CustomerCalculationService");
  queue.consume<customersCustomerCalculationServiceApi.RecalculateCustomersRequest, customersCustomerCalculationServiceApi.RecalculateCustomersResponse>("acme.content.v1.ContentRevisionWorkflowService/CancelContentRevisionWorkflow:0", async (request) =>
    call<customersCustomerCalculationServiceApi.RecalculateCustomersRequest, customersCustomerCalculationServiceApi.RecalculateCustomersResponse>((input, done) => client9.recalculateCustomers(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client10 = clients.get<contentContentBlockCalculationServiceApi.ContentBlockCalculationServiceClient>("acme.content.v1.ContentBlockCalculationService");
  queue.consume<contentContentBlockCalculationServiceApi.CompareContentBlockOptionsRequest, contentContentBlockCalculationServiceApi.CompareContentBlockOptionsResponse>("acme.content.v1.TaxonomyApprovalService/EscalateTaxonomy:0", async (request) =>
    call<contentContentBlockCalculationServiceApi.CompareContentBlockOptionsRequest, contentContentBlockCalculationServiceApi.CompareContentBlockOptionsResponse>((input, done) => client10.compareContentBlockOptions(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client11 = clients.get<contentContentBlockValidationServiceApi.ContentBlockValidationServiceClient>("acme.content.v1.ContentBlockValidationService");
  queue.consume<contentContentBlockValidationServiceApi.ExplainContentBlockDecisionRequest, contentContentBlockValidationServiceApi.ExplainContentBlockDecisionResponse>("acme.content.v1.TaxonomyCalculationService/CompareTaxonomyOptions:3", async (request) =>
    call<contentContentBlockValidationServiceApi.ExplainContentBlockDecisionRequest, contentContentBlockValidationServiceApi.ExplainContentBlockDecisionResponse>((input, done) => client11.explainContentBlockDecision(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client12 = clients.get<contentContentRevisionCalculationServiceApi.ContentRevisionCalculationServiceClient>("acme.content.v1.ContentRevisionCalculationService");
  queue.consume<contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsRequest, contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsResponse>("acme.content.v1.TaxonomyLifecycleService/RenewTaxonomy:1", async (request) =>
    call<contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsRequest, contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsResponse>((input, done) => client12.compareContentRevisionOptions(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client13 = clients.get<authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient>("acme.authorization.v1.AccessPolicyQueryService");
  queue.consume<authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesResponse>("acme.content.v1.TaxonomyValidationService/ValidateTaxonomy:1", async (request) =>
    call<authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesResponse>((input, done) => client13.summarizeAccessPolicies(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
}
