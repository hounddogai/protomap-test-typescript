import * as text from "../../../../kit/text.js";
import { AdaptiveProofDraft } from "./adaptive-proof-draft.js";

/** How screens and exports show a adaptive proof draft. */
export class AdaptiveProofDraftView {
  codeText: string;
  name: string;
  ratioText: string;
  labelText: string;
  archivedText: string;
  batchSizeText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    ratioText: string,
    labelText: string,
    archivedText: string,
    batchSizeText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.ratioText = ratioText;
    this.labelText = labelText;
    this.archivedText = archivedText;
    this.batchSizeText = batchSizeText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveProofDraftView(item: AdaptiveProofDraft): AdaptiveProofDraftView {
  return new AdaptiveProofDraftView(
    item.code,
    text.truncate(item.name, 80),
    item.ratio.toFixed(2),
    text.truncate(item.label, 64),
    `${item.archived}`,
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveProofDraftViews(items: AdaptiveProofDraft[]): AdaptiveProofDraftView[] {
  const views: AdaptiveProofDraftView[] = [];
  for (const item of items) {
    views.push(toAdaptiveProofDraftView(item));
  }
  return views;
}

export function sumAdaptiveProofDraftView(view: AdaptiveProofDraftView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  return parsedRatio + parsedBatchSize;
}
