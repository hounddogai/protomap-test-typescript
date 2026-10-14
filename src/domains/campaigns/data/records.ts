/**
 * Persistence mappings owned by the campaigns team.
 */

import * as campaignsCampaignsApi from "../../../../.cache/proto/acme/campaigns/v1/campaigns.js";

export interface StoredRecord {
  tenantId: string;
  recordId: string;
  kind: string;
  document: unknown;
}

/**
 * Map campaign asset API values to the database document boundary.
 */
export function toCampaignAssetRecord(tenantId: string, value: campaignsCampaignsApi.CampaignAsset): StoredRecord {
  return { tenantId, recordId: value.campaignAssetId, kind: "campaign_asset",
    document: campaignsCampaignsApi.CampaignAsset.toJSON(value) };
}

export function fromCampaignAssetRecord(record: StoredRecord): campaignsCampaignsApi.CampaignAsset {
  return campaignsCampaignsApi.CampaignAsset.fromJSON(record.document);
}

/**
 * Map campaign budget API values to the database document boundary.
 */
export function toCampaignBudgetRecord(tenantId: string, value: campaignsCampaignsApi.CampaignBudget): StoredRecord {
  return { tenantId, recordId: value.campaignBudgetId, kind: "campaign_budget",
    document: campaignsCampaignsApi.CampaignBudget.toJSON(value) };
}

export function fromCampaignBudgetRecord(record: StoredRecord): campaignsCampaignsApi.CampaignBudget {
  return campaignsCampaignsApi.CampaignBudget.fromJSON(record.document);
}

/**
 * Map marketing campaign API values to the database document boundary.
 */
export function toMarketingCampaignRecord(tenantId: string, value: campaignsCampaignsApi.MarketingCampaign): StoredRecord {
  return { tenantId, recordId: value.marketingCampaignId, kind: "marketing_campaign",
    document: campaignsCampaignsApi.MarketingCampaign.toJSON(value) };
}

export function fromMarketingCampaignRecord(record: StoredRecord): campaignsCampaignsApi.MarketingCampaign {
  return campaignsCampaignsApi.MarketingCampaign.fromJSON(record.document);
}
