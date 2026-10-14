import * as text from "../../../../kit/text.js";
import { FunnelClaim } from "./funnel-claim.js";

/** How screens and exports show a funnel claim. */
export class FunnelClaimView {
  code: string;
  name: string;
  archivedText: string;
  frequencyCapText: string;
  rateText: string;
  revision: string;
  ratioText: string;
  journeyIdText: string;
  discount: string;
  active: string;
  notes: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    archivedText: string,
    frequencyCapText: string,
    rateText: string,
    revision: string,
    ratioText: string,
    journeyIdText: string,
    discount: string,
    active: string,
    notes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.archivedText = archivedText;
    this.frequencyCapText = frequencyCapText;
    this.rateText = rateText;
    this.revision = revision;
    this.ratioText = ratioText;
    this.journeyIdText = journeyIdText;
    this.discount = discount;
    this.active = active;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toFunnelClaimView(item: FunnelClaim): FunnelClaimView {
  return new FunnelClaimView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 64),
    `${item.archived}`,
    String(item.frequencyCap),
    item.rate.toFixed(2),
    String(item.revision),
    item.ratio.toFixed(2),
    item.journeyId,
    item.discount.toFixed(2),
    `${item.active}`,
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toFunnelClaimViews(items: FunnelClaim[]): FunnelClaimView[] {
  const views: FunnelClaimView[] = [];
  for (const item of items) {
    views.push(toFunnelClaimView(item));
  }
  return views;
}

export function sumFunnelClaimView(view: FunnelClaimView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedFrequencyCap + parsedRate + parsedRevision;
}
