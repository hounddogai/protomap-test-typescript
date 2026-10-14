import * as text from "../../../../kit/text.js";
import { DomainEstimate } from "./domain-estimate.js";

/** How screens and exports show a domain estimate. */
export class DomainEstimateView {
  code: string;
  labelText: string;
  revision: string;
  frequencyCap: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    revision: string,
    frequencyCap: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.revision = revision;
    this.frequencyCap = frequencyCap;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toDomainEstimateView(item: DomainEstimate): DomainEstimateView {
  return new DomainEstimateView(
    item.code,
    text.truncate(item.label, 64),
    String(item.revision),
    String(item.frequencyCap),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainEstimateViews(items: DomainEstimate[]): DomainEstimateView[] {
  const views: DomainEstimateView[] = [];
  for (const item of items) {
    views.push(toDomainEstimateView(item));
  }
  return views;
}

export function sumDomainEstimateView(view: DomainEstimateView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedRevision + parsedFrequencyCap;
}
