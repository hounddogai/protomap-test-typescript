import * as text from "../../../../kit/text.js";
import { CreativeScore } from "./creative-score.js";

/** How screens and exports show a creative score. */
export class CreativeScoreView {
  codeText: string;
  name: string;
  regionText: string;
  currency: string;
  revision: string;
  frequencyCap: string;
  timezone: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    regionText: string,
    currency: string,
    revision: string,
    frequencyCap: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.regionText = regionText;
    this.currency = currency;
    this.revision = revision;
    this.frequencyCap = frequencyCap;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toCreativeScoreView(item: CreativeScore): CreativeScoreView {
  return new CreativeScoreView(
    item.code,
    item.name,
    text.truncate(item.region, 120),
    item.currency,
    String(item.revision),
    String(item.frequencyCap),
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toCreativeScoreViews(items: CreativeScore[]): CreativeScoreView[] {
  const views: CreativeScoreView[] = [];
  for (const item of items) {
    views.push(toCreativeScoreView(item));
  }
  return views;
}

export function sumCreativeScoreView(view: CreativeScoreView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedRevision + parsedFrequencyCap;
}
