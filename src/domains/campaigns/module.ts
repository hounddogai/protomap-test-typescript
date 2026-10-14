/**
 * Register the campaigns team's public gRPC boundary and workers.
 */

import * as campaignsCampaignAssetApprovalServiceApi from "../../../.cache/proto/acme/campaigns/v1/campaign_asset_approval_service.js";
import * as campaignsCampaignAssetQueryServiceApi from "../../../.cache/proto/acme/campaigns/v1/campaign_asset_query_service.js";
import * as campaignsCampaignAssetWorkflowServiceApi from "../../../.cache/proto/acme/campaigns/v1/campaign_asset_workflow_service.js";
import * as campaignsCampaignBudgetApprovalServiceApi from "../../../.cache/proto/acme/campaigns/v1/campaign_budget_approval_service.js";
import * as campaignsCampaignBudgetValidationServiceApi from "../../../.cache/proto/acme/campaigns/v1/campaign_budget_validation_service.js";
import * as campaignsCampaignBudgetWorkflowServiceApi from "../../../.cache/proto/acme/campaigns/v1/campaign_budget_workflow_service.js";
import * as campaignsMarketingCampaignApprovalServiceApi from "../../../.cache/proto/acme/campaigns/v1/marketing_campaign_approval_service.js";
import * as campaignsMarketingCampaignQueryServiceApi from "../../../.cache/proto/acme/campaigns/v1/marketing_campaign_query_service.js";
import * as campaignsMarketingCampaignServiceApi from "../../../.cache/proto/acme/campaigns/v1/marketing_campaign_service.js";
import * as campaignsMarketingCampaignWorkflowServiceApi from "../../../.cache/proto/acme/campaigns/v1/marketing_campaign_workflow_service.js";
import * as communityPostValidationServiceApi from "../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as customersConsentRecordCalculationServiceApi from "../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as venuesVenueValidationServiceApi from "../../../.cache/proto/acme/venues/v1/venue_validation_service.js";
import { ClientRegistry } from "../../platform/registry.js";
import { call, metadataFor } from "../../platform/rpc.js";
import { WorkQueue } from "../../platform/work-queue.js";
import {
  CampaignAssetWorkflowHandler,
  implementation as bindCampaignAssetWorkflowHandler,
} from "./features/campaign-asset/campaign-asset-workflow.handler.js";
import {
  CampaignBudgetWorkflowHandler,
  implementation as bindCampaignBudgetWorkflowHandler,
} from "./features/campaign-budget/campaign-budget-workflow.handler.js";
import {
  MarketingCampaignHandler,
  implementation as bindMarketingCampaignHandler,
} from "./features/marketing-campaign/marketing-campaign.handler.js";
import {
  CampaignAssetQueryHandler,
  implementation as bindCampaignAssetQueryHandler,
} from "./services/campaign-asset-query.js";
import {
  CampaignBudgetValidationHandler,
  implementation as bindCampaignBudgetValidationHandler,
} from "./services/campaign-budget-validation.js";
import {
  MarketingCampaignQueryHandler,
  implementation as bindMarketingCampaignQueryHandler,
} from "./services/marketing-campaign-query.js";
import {
  CampaignAssetApprovalHandler,
  implementation as bindCampaignAssetApprovalHandler,
} from "./transport/campaign-asset-approval.js";
import {
  CampaignBudgetApprovalHandler,
  implementation as bindCampaignBudgetApprovalHandler,
} from "./transport/campaign-budget-approval.js";
import {
  MarketingCampaignApprovalHandler,
  implementation as bindMarketingCampaignApprovalHandler,
} from "./transport/marketing-campaign-approval.js";
import {
  MarketingCampaignWorkflowHandler,
  implementation as bindMarketingCampaignWorkflowHandler,
} from "./transport/marketing-campaign-workflow.js";
import { type Server } from "@grpc/grpc-js";
import { type DependencyContainer } from "tsyringe";

export function register(server: Server, scope: DependencyContainer): void {
  server.addService(campaignsCampaignAssetApprovalServiceApi.CampaignAssetApprovalServiceService, bindCampaignAssetApprovalHandler(scope.resolve(CampaignAssetApprovalHandler)));
  server.addService(campaignsCampaignAssetQueryServiceApi.CampaignAssetQueryServiceService, bindCampaignAssetQueryHandler(scope.resolve(CampaignAssetQueryHandler)));
  server.addService(campaignsCampaignAssetWorkflowServiceApi.CampaignAssetWorkflowServiceService, bindCampaignAssetWorkflowHandler(scope.resolve(CampaignAssetWorkflowHandler)));
  server.addService(campaignsCampaignBudgetApprovalServiceApi.CampaignBudgetApprovalServiceService, bindCampaignBudgetApprovalHandler(scope.resolve(CampaignBudgetApprovalHandler)));
  server.addService(campaignsCampaignBudgetValidationServiceApi.CampaignBudgetValidationServiceService, bindCampaignBudgetValidationHandler(scope.resolve(CampaignBudgetValidationHandler)));
  server.addService(campaignsCampaignBudgetWorkflowServiceApi.CampaignBudgetWorkflowServiceService, bindCampaignBudgetWorkflowHandler(scope.resolve(CampaignBudgetWorkflowHandler)));
  server.addService(campaignsMarketingCampaignApprovalServiceApi.MarketingCampaignApprovalServiceService, bindMarketingCampaignApprovalHandler(scope.resolve(MarketingCampaignApprovalHandler)));
  server.addService(campaignsMarketingCampaignQueryServiceApi.MarketingCampaignQueryServiceService, bindMarketingCampaignQueryHandler(scope.resolve(MarketingCampaignQueryHandler)));
  server.addService(campaignsMarketingCampaignServiceApi.MarketingCampaignServiceService, bindMarketingCampaignHandler(scope.resolve(MarketingCampaignHandler)));
  server.addService(campaignsMarketingCampaignWorkflowServiceApi.MarketingCampaignWorkflowServiceService, bindMarketingCampaignWorkflowHandler(scope.resolve(MarketingCampaignWorkflowHandler)));
}

export function startWorkers(scope: DependencyContainer): void {
  const queue = scope.resolve<WorkQueue>("workQueue");
  const clients = scope.resolve<ClientRegistry>("clients");
  const client0 = clients.get<campaignsMarketingCampaignQueryServiceApi.MarketingCampaignQueryServiceClient>("acme.campaigns.v1.MarketingCampaignQueryService");
  queue.consume<campaignsMarketingCampaignQueryServiceApi.FindMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.FindMarketingCampaignsResponse>("acme.campaigns.v1.CampaignAssetApprovalService/SubmitCampaignAsset:0", async (request) =>
    call<campaignsMarketingCampaignQueryServiceApi.FindMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.FindMarketingCampaignsResponse>((input, done) => client0.findMarketingCampaigns(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client1 = clients.get<customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient>("acme.customers.v1.ConsentRecordCalculationService");
  queue.consume<customersConsentRecordCalculationServiceApi.EstimateConsentRecordRequest, customersConsentRecordCalculationServiceApi.EstimateConsentRecordResponse>("acme.campaigns.v1.CampaignAssetWorkflowService/ResumeCampaignAssetWorkflow:0", async (request) =>
    call<customersConsentRecordCalculationServiceApi.EstimateConsentRecordRequest, customersConsentRecordCalculationServiceApi.EstimateConsentRecordResponse>((input, done) => client1.estimateConsentRecord(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client2 = clients.get<campaignsMarketingCampaignApprovalServiceApi.MarketingCampaignApprovalServiceClient>("acme.campaigns.v1.MarketingCampaignApprovalService");
  queue.consume<campaignsMarketingCampaignApprovalServiceApi.SubmitMarketingCampaignRequest, campaignsMarketingCampaignApprovalServiceApi.SubmitMarketingCampaignResponse>("acme.campaigns.v1.CampaignBudgetApprovalService/ApproveCampaignBudget:3", async (request) =>
    call<campaignsMarketingCampaignApprovalServiceApi.SubmitMarketingCampaignRequest, campaignsMarketingCampaignApprovalServiceApi.SubmitMarketingCampaignResponse>((input, done) => client2.submitMarketingCampaign(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client3 = clients.get<communityPostValidationServiceApi.PostValidationServiceClient>("acme.community.v1.PostValidationService");
  queue.consume<communityPostValidationServiceApi.NormalizePostRequest, communityPostValidationServiceApi.NormalizePostResponse>("acme.campaigns.v1.CampaignBudgetValidationService/ScoreCampaignBudget:0", async (request) =>
    call<communityPostValidationServiceApi.NormalizePostRequest, communityPostValidationServiceApi.NormalizePostResponse>((input, done) => client3.normalizePost(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client4 = clients.get<campaignsCampaignBudgetValidationServiceApi.CampaignBudgetValidationServiceClient>("acme.campaigns.v1.CampaignBudgetValidationService");
  queue.consume<campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetResponse>("acme.campaigns.v1.MarketingCampaignApprovalService/DelegateMarketingCampaignApproval:0", async (request) =>
    call<campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetResponse>((input, done) => client4.previewCampaignBudget(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client5 = clients.get<campaignsCampaignBudgetValidationServiceApi.CampaignBudgetValidationServiceClient>("acme.campaigns.v1.CampaignBudgetValidationService");
  queue.consume<campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetResponse>("acme.campaigns.v1.MarketingCampaignQueryService/SummarizeMarketingCampaigns:1", async (request) =>
    call<campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetResponse>((input, done) => client5.validateCampaignBudget(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client6 = clients.get<venuesVenueValidationServiceApi.VenueValidationServiceClient>("acme.venues.v1.VenueValidationService");
  queue.consume<venuesVenueValidationServiceApi.CheckVenueEligibilityRequest, venuesVenueValidationServiceApi.CheckVenueEligibilityResponse>("acme.campaigns.v1.MarketingCampaignService/UpdateMarketingCampaign:0", async (request) =>
    call<venuesVenueValidationServiceApi.CheckVenueEligibilityRequest, venuesVenueValidationServiceApi.CheckVenueEligibilityResponse>((input, done) => client6.checkVenueEligibility(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client7 = clients.get<campaignsCampaignAssetApprovalServiceApi.CampaignAssetApprovalServiceClient>("acme.campaigns.v1.CampaignAssetApprovalService");
  queue.consume<campaignsCampaignAssetApprovalServiceApi.ApproveCampaignAssetRequest, campaignsCampaignAssetApprovalServiceApi.ApproveCampaignAssetResponse>("acme.campaigns.v1.MarketingCampaignWorkflowService/StartMarketingCampaignWorkflow:2", async (request) =>
    call<campaignsCampaignAssetApprovalServiceApi.ApproveCampaignAssetRequest, campaignsCampaignAssetApprovalServiceApi.ApproveCampaignAssetResponse>((input, done) => client7.approveCampaignAsset(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
}
