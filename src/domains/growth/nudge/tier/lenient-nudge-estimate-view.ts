import * as text from "../../../../kit/text.js";
import { LenientNudgeEstimate } from "./lenient-nudge-estimate.js";

/** How screens and exports show a lenient nudge estimate. */
export class LenientNudgeEstimateView {
  codeText: string;
  name: string;
  utmSource: string;
  revision: string;
  pinnedText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    utmSource: string,
    revision: string,
    pinnedText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.utmSource = utmSource;
    this.revision = revision;
    this.pinnedText = pinnedText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientNudgeEstimateView(item: LenientNudgeEstimate): LenientNudgeEstimateView {
  return new LenientNudgeEstimateView(
    text.truncate(item.code, 80),
    item.name,
    text.truncate(item.utmSource, 64),
    String(item.revision),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientNudgeEstimateViews(items: LenientNudgeEstimate[]): LenientNudgeEstimateView[] {
  const views: LenientNudgeEstimateView[] = [];
  for (const item of items) {
    views.push(toLenientNudgeEstimateView(item));
  }
  return views;
}

export function sumLenientNudgeEstimateView(view: LenientNudgeEstimateView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedRevision;
}
