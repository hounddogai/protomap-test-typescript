import * as text from "../../../../kit/text.js";
import { RegionalComplaintMapping } from "./regional-complaint-mapping.js";

/** How screens and exports show a regional complaint mapping. */
export class RegionalComplaintMappingView {
  code: string;
  nameText: string;
  discount: string;
  notesText: string;
  channelText: string;
  description: string;
  summary: string;
  archivedText: string;
  sequence: string;
  journeyIdText: string;
  threshold: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    discount: string,
    notesText: string,
    channelText: string,
    description: string,
    summary: string,
    archivedText: string,
    sequence: string,
    journeyIdText: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.discount = discount;
    this.notesText = notesText;
    this.channelText = channelText;
    this.description = description;
    this.summary = summary;
    this.archivedText = archivedText;
    this.sequence = sequence;
    this.journeyIdText = journeyIdText;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalComplaintMappingView(item: RegionalComplaintMapping): RegionalComplaintMappingView {
  return new RegionalComplaintMappingView(
    text.truncate(item.code, 40),
    item.name,
    item.discount.toFixed(2),
    item.notes,
    item.channel,
    item.description,
    text.truncate(item.summary, 80),
    `${item.archived}`,
    String(item.sequence),
    item.journeyId,
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalComplaintMappingViews(items: RegionalComplaintMapping[]): RegionalComplaintMappingView[] {
  const views: RegionalComplaintMappingView[] = [];
  for (const item of items) {
    views.push(toRegionalComplaintMappingView(item));
  }
  return views;
}

export function sumRegionalComplaintMappingView(view: RegionalComplaintMappingView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedDiscount + parsedSequence + parsedThreshold;
}
