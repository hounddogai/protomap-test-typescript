/**
 * Register the webhooks team's public gRPC boundary and workers.
 */

import * as authorizationAccessPolicyQueryServiceApi from "../../../.cache/proto/acme/authorization/v1/access_policy_query_service.js";
import * as configurationConfigSetCalculationServiceApi from "../../../.cache/proto/acme/configuration/v1/config_set_calculation_service.js";
import * as experimentsExposureReportingServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_reporting_service.js";
import * as metricsMetricSeriesQueryServiceApi from "../../../.cache/proto/acme/metrics/v1/metric_series_query_service.js";
import * as notificationsDeliveryAttemptAdminServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_admin_service.js";
import * as personalizationAffinityValidationServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_validation_service.js";
import * as venuesVenueQueryServiceApi from "../../../.cache/proto/acme/venues/v1/venue_query_service.js";
import * as webhooksWebhookDeliveryApprovalServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_delivery_approval_service.js";
import * as webhooksWebhookDeliveryQueryServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_delivery_query_service.js";
import * as webhooksWebhookDeliveryValidationServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_delivery_validation_service.js";
import * as webhooksWebhookDeliveryWorkflowServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_delivery_workflow_service.js";
import * as webhooksWebhookEndpointApprovalServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_approval_service.js";
import * as webhooksWebhookEndpointQueryServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_query_service.js";
import * as webhooksWebhookEndpointServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_service.js";
import * as webhooksWebhookEndpointValidationServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_validation_service.js";
import * as webhooksWebhookEndpointWorkflowServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_workflow_service.js";
import * as webhooksWebhookSecretApprovalServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_secret_approval_service.js";
import * as webhooksWebhookSecretCalculationServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_secret_calculation_service.js";
import * as webhooksWebhookSecretValidationServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_secret_validation_service.js";
import * as webhooksWebhookSecretWorkflowServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_secret_workflow_service.js";
import { ClientRegistry } from "../../platform/registry.js";
import { call, metadataFor } from "../../platform/rpc.js";
import { WorkQueue } from "../../platform/work-queue.js";
import {
  WebhookDeliveryQueryHandler,
  implementation as bindWebhookDeliveryQueryHandler,
} from "./features/webhook-delivery/webhook-delivery-query.handler.js";
import {
  WebhookEndpointApprovalHandler,
  implementation as bindWebhookEndpointApprovalHandler,
} from "./features/webhook-endpoint/webhook-endpoint-approval.handler.js";
import {
  WebhookEndpointValidationHandler,
  implementation as bindWebhookEndpointValidationHandler,
} from "./features/webhook-endpoint/webhook-endpoint-validation.handler.js";
import {
  WebhookSecretCalculationHandler,
  implementation as bindWebhookSecretCalculationHandler,
} from "./features/webhook-secret/webhook-secret-calculation.handler.js";
import {
  WebhookDeliveryApprovalHandler,
  implementation as bindWebhookDeliveryApprovalHandler,
} from "./services/webhook-delivery-approval.js";
import {
  WebhookDeliveryWorkflowHandler,
  implementation as bindWebhookDeliveryWorkflowHandler,
} from "./services/webhook-delivery-workflow.js";
import { WebhookEndpointHandler, implementation as bindWebhookEndpointHandler } from "./services/webhook-endpoint.js";
import {
  WebhookSecretApprovalHandler,
  implementation as bindWebhookSecretApprovalHandler,
} from "./services/webhook-secret-approval.js";
import {
  WebhookSecretWorkflowHandler,
  implementation as bindWebhookSecretWorkflowHandler,
} from "./services/webhook-secret-workflow.js";
import {
  WebhookDeliveryValidationHandler,
  implementation as bindWebhookDeliveryValidationHandler,
} from "./transport/webhook-delivery-validation.js";
import {
  WebhookEndpointQueryHandler,
  implementation as bindWebhookEndpointQueryHandler,
} from "./transport/webhook-endpoint-query.js";
import {
  WebhookEndpointWorkflowHandler,
  implementation as bindWebhookEndpointWorkflowHandler,
} from "./transport/webhook-endpoint-workflow.js";
import {
  WebhookSecretValidationHandler,
  implementation as bindWebhookSecretValidationHandler,
} from "./transport/webhook-secret-validation.js";
import { type Server } from "@grpc/grpc-js";
import { type DependencyContainer } from "tsyringe";

export function register(server: Server, scope: DependencyContainer): void {
  server.addService(webhooksWebhookDeliveryApprovalServiceApi.WebhookDeliveryApprovalServiceService, bindWebhookDeliveryApprovalHandler(scope.resolve(WebhookDeliveryApprovalHandler)));
  server.addService(webhooksWebhookDeliveryQueryServiceApi.WebhookDeliveryQueryServiceService, bindWebhookDeliveryQueryHandler(scope.resolve(WebhookDeliveryQueryHandler)));
  server.addService(webhooksWebhookDeliveryValidationServiceApi.WebhookDeliveryValidationServiceService, bindWebhookDeliveryValidationHandler(scope.resolve(WebhookDeliveryValidationHandler)));
  server.addService(webhooksWebhookDeliveryWorkflowServiceApi.WebhookDeliveryWorkflowServiceService, bindWebhookDeliveryWorkflowHandler(scope.resolve(WebhookDeliveryWorkflowHandler)));
  server.addService(webhooksWebhookEndpointApprovalServiceApi.WebhookEndpointApprovalServiceService, bindWebhookEndpointApprovalHandler(scope.resolve(WebhookEndpointApprovalHandler)));
  server.addService(webhooksWebhookEndpointQueryServiceApi.WebhookEndpointQueryServiceService, bindWebhookEndpointQueryHandler(scope.resolve(WebhookEndpointQueryHandler)));
  server.addService(webhooksWebhookEndpointServiceApi.WebhookEndpointServiceService, bindWebhookEndpointHandler(scope.resolve(WebhookEndpointHandler)));
  server.addService(webhooksWebhookEndpointValidationServiceApi.WebhookEndpointValidationServiceService, bindWebhookEndpointValidationHandler(scope.resolve(WebhookEndpointValidationHandler)));
  server.addService(webhooksWebhookEndpointWorkflowServiceApi.WebhookEndpointWorkflowServiceService, bindWebhookEndpointWorkflowHandler(scope.resolve(WebhookEndpointWorkflowHandler)));
  server.addService(webhooksWebhookSecretApprovalServiceApi.WebhookSecretApprovalServiceService, bindWebhookSecretApprovalHandler(scope.resolve(WebhookSecretApprovalHandler)));
  server.addService(webhooksWebhookSecretCalculationServiceApi.WebhookSecretCalculationServiceService, bindWebhookSecretCalculationHandler(scope.resolve(WebhookSecretCalculationHandler)));
  server.addService(webhooksWebhookSecretValidationServiceApi.WebhookSecretValidationServiceService, bindWebhookSecretValidationHandler(scope.resolve(WebhookSecretValidationHandler)));
  server.addService(webhooksWebhookSecretWorkflowServiceApi.WebhookSecretWorkflowServiceService, bindWebhookSecretWorkflowHandler(scope.resolve(WebhookSecretWorkflowHandler)));
}

export function startWorkers(scope: DependencyContainer): void {
  const queue = scope.resolve<WorkQueue>("workQueue");
  const clients = scope.resolve<ClientRegistry>("clients");
  const client0 = clients.get<webhooksWebhookEndpointQueryServiceApi.WebhookEndpointQueryServiceClient>("acme.webhooks.v1.WebhookEndpointQueryService");
  queue.consume<webhooksWebhookEndpointQueryServiceApi.FindWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.FindWebhookEndpointsResponse>("acme.webhooks.v1.WebhookDeliveryApprovalService/SubmitWebhookDelivery:1", async (request) =>
    call<webhooksWebhookEndpointQueryServiceApi.FindWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.FindWebhookEndpointsResponse>((input, done) => client0.findWebhookEndpoints(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client1 = clients.get<webhooksWebhookSecretCalculationServiceApi.WebhookSecretCalculationServiceClient>("acme.webhooks.v1.WebhookSecretCalculationService");
  queue.consume<webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretResponse>("acme.webhooks.v1.WebhookDeliveryValidationService/LintWebhookDeliveries:0", async (request) =>
    call<webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretResponse>((input, done) => client1.calculateWebhookSecret(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client2 = clients.get<webhooksWebhookEndpointApprovalServiceApi.WebhookEndpointApprovalServiceClient>("acme.webhooks.v1.WebhookEndpointApprovalService");
  queue.consume<webhooksWebhookEndpointApprovalServiceApi.GetWebhookEndpointApprovalStatusRequest, webhooksWebhookEndpointApprovalServiceApi.GetWebhookEndpointApprovalStatusResponse>("acme.webhooks.v1.WebhookDeliveryWorkflowService/SignalWebhookDeliveryWorkflow:0", async (request) =>
    call<webhooksWebhookEndpointApprovalServiceApi.GetWebhookEndpointApprovalStatusRequest, webhooksWebhookEndpointApprovalServiceApi.GetWebhookEndpointApprovalStatusResponse>((input, done) => client2.getWebhookEndpointApprovalStatus(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client3 = clients.get<metricsMetricSeriesQueryServiceApi.MetricSeriesQueryServiceClient>("acme.metrics.v1.MetricSeriesQueryService");
  queue.consume<metricsMetricSeriesQueryServiceApi.SuggestMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.SuggestMetricSeriesesResponse>("acme.webhooks.v1.WebhookEndpointApprovalService/SubmitWebhookEndpoint:1", async (request) =>
    call<metricsMetricSeriesQueryServiceApi.SuggestMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.SuggestMetricSeriesesResponse>((input, done) => client3.suggestMetricSerieses(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client4 = clients.get<personalizationAffinityValidationServiceApi.AffinityValidationServiceClient>("acme.personalization.v1.AffinityValidationService");
  queue.consume<personalizationAffinityValidationServiceApi.CheckAffinityEligibilityRequest, personalizationAffinityValidationServiceApi.CheckAffinityEligibilityResponse>("acme.webhooks.v1.WebhookEndpointService/BatchCreateWebhookEndpoints:2", async (request) =>
    call<personalizationAffinityValidationServiceApi.CheckAffinityEligibilityRequest, personalizationAffinityValidationServiceApi.CheckAffinityEligibilityResponse>((input, done) => client4.checkAffinityEligibility(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client5 = clients.get<venuesVenueQueryServiceApi.VenueQueryServiceClient>("acme.venues.v1.VenueQueryService");
  queue.consume<venuesVenueQueryServiceApi.SummarizeVenuesRequest, venuesVenueQueryServiceApi.SummarizeVenuesResponse>("acme.webhooks.v1.WebhookEndpointValidationService/CheckWebhookEndpointEligibility:0", async (request) =>
    call<venuesVenueQueryServiceApi.SummarizeVenuesRequest, venuesVenueQueryServiceApi.SummarizeVenuesResponse>((input, done) => client5.summarizeVenues(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client6 = clients.get<experimentsExposureReportingServiceApi.ExposureReportingServiceClient>("acme.experiments.v1.ExposureReportingService");
  queue.consume<experimentsExposureReportingServiceApi.ShareExposureReportRequest, experimentsExposureReportingServiceApi.ShareExposureReportResponse>("acme.webhooks.v1.WebhookEndpointWorkflowService/AdvanceWebhookEndpointWorkflow:2", async (request) =>
    call<experimentsExposureReportingServiceApi.ShareExposureReportRequest, experimentsExposureReportingServiceApi.ShareExposureReportResponse>((input, done) => client6.shareExposureReport(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client7 = clients.get<notificationsDeliveryAttemptAdminServiceApi.DeliveryAttemptAdminServiceClient>("acme.notifications.v1.DeliveryAttemptAdminService");
  queue.consume<notificationsDeliveryAttemptAdminServiceApi.RepairDeliveryAttemptRequest, notificationsDeliveryAttemptAdminServiceApi.RepairDeliveryAttemptResponse>("acme.webhooks.v1.WebhookSecretApprovalService/ApproveWebhookSecret:1", async (request) =>
    call<notificationsDeliveryAttemptAdminServiceApi.RepairDeliveryAttemptRequest, notificationsDeliveryAttemptAdminServiceApi.RepairDeliveryAttemptResponse>((input, done) => client7.repairDeliveryAttempt(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client8 = clients.get<configurationConfigSetCalculationServiceApi.ConfigSetCalculationServiceClient>("acme.configuration.v1.ConfigSetCalculationService");
  queue.consume<configurationConfigSetCalculationServiceApi.ExplainConfigSetCalculationRequest, configurationConfigSetCalculationServiceApi.ExplainConfigSetCalculationResponse>("acme.webhooks.v1.WebhookSecretCalculationService/QuoteWebhookSecret:0", async (request) =>
    call<configurationConfigSetCalculationServiceApi.ExplainConfigSetCalculationRequest, configurationConfigSetCalculationServiceApi.ExplainConfigSetCalculationResponse>((input, done) => client8.explainConfigSetCalculation(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client9 = clients.get<authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient>("acme.authorization.v1.AccessPolicyQueryService");
  queue.consume<authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesResponse>("acme.webhooks.v1.WebhookSecretValidationService/ValidateWebhookSecret:2", async (request) =>
    call<authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesResponse>((input, done) => client9.countAccessPolicies(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client10 = clients.get<webhooksWebhookEndpointValidationServiceApi.WebhookEndpointValidationServiceClient>("acme.webhooks.v1.WebhookEndpointValidationService");
  queue.consume<webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesRequest, webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesResponse>("acme.webhooks.v1.WebhookSecretWorkflowService/StartWebhookSecretWorkflow:3", async (request) =>
    call<webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesRequest, webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesResponse>((input, done) => client10.getWebhookEndpointRules(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
}
