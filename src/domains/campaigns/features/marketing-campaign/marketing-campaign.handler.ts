/**
 * Manages marketing campaigns: creates, reads, changes, and lists them.
 */

import * as campaignsMarketingCampaignServiceApi from "../../../../../.cache/proto/acme/campaigns/v1/marketing_campaign_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { clientStream, serverStream, unary } from "../../../../platform/handlers.js";
import { MarketingCampaignWorkflow } from "./marketing-campaign.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for MarketingCampaignService; workflows own validation and database transactions.
 */
@injectable()
export class MarketingCampaignHandler {
  constructor(@inject(MarketingCampaignWorkflow) private readonly workflow: MarketingCampaignWorkflow) {}

  /**
   * Takes a stream of marketing campaigns and answers once at the end.
   */
  batchCreateMarketingCampaigns = clientStream<campaignsMarketingCampaignServiceApi.BatchCreateMarketingCampaignsRequest, campaignsMarketingCampaignServiceApi.BatchCreateMarketingCampaignsResponse>(
    (request) => this.workflow.batchCreateMarketingCampaigns(request), () => campaignsMarketingCampaignServiceApi.BatchCreateMarketingCampaignsResponse.fromPartial({}),
  );

  /**
   * Returns several marketing campaigns at once.
   */
  batchGetMarketingCampaigns = (call: ServerUnaryCall<campaignsMarketingCampaignServiceApi.BatchGetMarketingCampaignsRequest, campaignsMarketingCampaignServiceApi.BatchGetMarketingCampaignsResponse>, done: sendUnaryData<campaignsMarketingCampaignServiceApi.BatchGetMarketingCampaignsResponse>): void => {
    void this.workflow.batchGetMarketingCampaigns(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Creates a marketing campaign.
   */
  cloneMarketingCampaign = unary<campaignsMarketingCampaignServiceApi.CloneMarketingCampaignRequest, campaignsMarketingCampaignServiceApi.CloneMarketingCampaignResponse>(
    (request) => this.workflow.cloneMarketingCampaign(request),
  );

  /**
   * Creates a marketing campaign.
   */
  createMarketingCampaign = unary<campaignsMarketingCampaignServiceApi.CreateMarketingCampaignRequest, campaignsMarketingCampaignServiceApi.CreateMarketingCampaignResponse>(
    (request) => this.workflow.createMarketingCampaign(request),
  );

  /**
   * Deletes a marketing campaign.
   */
  deleteMarketingCampaign = (call: ServerUnaryCall<campaignsMarketingCampaignServiceApi.DeleteMarketingCampaignRequest, campaignsMarketingCampaignServiceApi.DeleteMarketingCampaignResponse>, done: sendUnaryData<campaignsMarketingCampaignServiceApi.DeleteMarketingCampaignResponse>): void => {
    void this.workflow.deleteMarketingCampaign(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a marketing campaign.
   */
  getMarketingCampaign = unary<campaignsMarketingCampaignServiceApi.GetMarketingCampaignRequest, campaignsMarketingCampaignServiceApi.GetMarketingCampaignResponse>(
    (request) => this.workflow.getMarketingCampaign(request),
  );

  /**
   * Lists marketing campaigns a page at a time.
   */
  listMarketingCampaigns = unary<campaignsMarketingCampaignServiceApi.ListMarketingCampaignsRequest, campaignsMarketingCampaignServiceApi.ListMarketingCampaignsResponse>(
    (request) => this.workflow.listMarketingCampaigns(request),
  );

  /**
   * Lists marketing campaigns a page at a time.
   */
  searchMarketingCampaigns = (call: ServerUnaryCall<campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsRequest, campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsResponse>, done: sendUnaryData<campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsResponse>): void => {
    void this.workflow.searchMarketingCampaigns(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Changes a marketing campaign.
   */
  updateMarketingCampaign = unary<campaignsMarketingCampaignServiceApi.UpdateMarketingCampaignRequest, campaignsMarketingCampaignServiceApi.UpdateMarketingCampaignResponse>(
    (request) => this.workflow.updateMarketingCampaign(request),
  );

  /**
   * Streams the changes of marketing campaigns as they happen.
   */
  watchMarketingCampaigns = serverStream<campaignsMarketingCampaignServiceApi.WatchMarketingCampaignsRequest, campaignsMarketingCampaignServiceApi.WatchMarketingCampaignsResponse>(
    (request) => this.workflow.watchMarketingCampaigns(request),
  );
}

export function implementation(handler: MarketingCampaignHandler): campaignsMarketingCampaignServiceApi.MarketingCampaignServiceServer {
  return {
    batchCreateMarketingCampaigns: handler.batchCreateMarketingCampaigns,
    batchGetMarketingCampaigns: handler.batchGetMarketingCampaigns,
    cloneMarketingCampaign: handler.cloneMarketingCampaign,
    createMarketingCampaign: handler.createMarketingCampaign,
    deleteMarketingCampaign: handler.deleteMarketingCampaign,
    getMarketingCampaign: handler.getMarketingCampaign,
    listMarketingCampaigns: handler.listMarketingCampaigns,
    searchMarketingCampaigns: handler.searchMarketingCampaigns,
    updateMarketingCampaign: handler.updateMarketingCampaign,
    watchMarketingCampaigns: handler.watchMarketingCampaigns,
  };
}
