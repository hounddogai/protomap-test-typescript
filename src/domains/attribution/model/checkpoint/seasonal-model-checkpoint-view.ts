import * as text from "../../../../kit/text.js";
import { SeasonalModelCheckpoint } from "./seasonal-model-checkpoint.js";

/** How screens and exports show a seasonal model checkpoint. */
export class SeasonalModelCheckpointView {
  code: string;
  name: string;
  currency: string;
  timezone: string;
  sequenceText: string;
  journeyId: string;
  ceilingText: string;
  impressions: string;
  version: string;
  channelText: string;
  batchSizeText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    currency: string,
    timezone: string,
    sequenceText: string,
    journeyId: string,
    ceilingText: string,
    impressions: string,
    version: string,
    channelText: string,
    batchSizeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.timezone = timezone;
    this.sequenceText = sequenceText;
    this.journeyId = journeyId;
    this.ceilingText = ceilingText;
    this.impressions = impressions;
    this.version = version;
    this.channelText = channelText;
    this.batchSizeText = batchSizeText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalModelCheckpointView(item: SeasonalModelCheckpoint): SeasonalModelCheckpointView {
  return new SeasonalModelCheckpointView(
    text.truncate(item.code, 64),
    item.name,
    item.currency,
    item.timezone,
    String(item.sequence),
    text.truncate(item.journeyId, 40),
    item.ceiling.toFixed(2),
    String(item.impressions),
    String(item.version),
    item.channel,
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalModelCheckpointViews(items: SeasonalModelCheckpoint[]): SeasonalModelCheckpointView[] {
  const views: SeasonalModelCheckpointView[] = [];
  for (const item of items) {
    views.push(toSeasonalModelCheckpointView(item));
  }
  return views;
}

export function sumSeasonalModelCheckpointView(view: SeasonalModelCheckpointView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedSequence + parsedCeiling + parsedImpressions;
}
