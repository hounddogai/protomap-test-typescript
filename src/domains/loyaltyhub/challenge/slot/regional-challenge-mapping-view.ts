import { RegionalChallengeMapping } from "./regional-challenge-mapping.js";

/** How screens and exports show a regional challenge mapping. */
export class RegionalChallengeMappingView {
  code: string;
  label: string;
  cohortText: string;
  ownerId: string;
  batchSize: string;
  category: string;
  reviewer: string;
  conversionRate: string;
  audienceId: string;
  minimumText: string;
  contactEmailText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    cohortText: string,
    ownerId: string,
    batchSize: string,
    category: string,
    reviewer: string,
    conversionRate: string,
    audienceId: string,
    minimumText: string,
    contactEmailText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.cohortText = cohortText;
    this.ownerId = ownerId;
    this.batchSize = batchSize;
    this.category = category;
    this.reviewer = reviewer;
    this.conversionRate = conversionRate;
    this.audienceId = audienceId;
    this.minimumText = minimumText;
    this.contactEmailText = contactEmailText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalChallengeMappingView(item: RegionalChallengeMapping): RegionalChallengeMappingView {
  return new RegionalChallengeMappingView(
    item.code,
    item.label,
    item.cohort,
    item.ownerId,
    String(item.batchSize),
    item.category,
    item.reviewer,
    item.conversionRate.toFixed(2),
    item.audienceId,
    item.minimum.toFixed(2),
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalChallengeMappingViews(items: RegionalChallengeMapping[]): RegionalChallengeMappingView[] {
  const views: RegionalChallengeMappingView[] = [];
  for (const item of items) {
    views.push(toRegionalChallengeMappingView(item));
  }
  return views;
}

export function sumRegionalChallengeMappingView(view: RegionalChallengeMappingView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  return parsedBatchSize + parsedConversionRate + parsedMinimum;
}
