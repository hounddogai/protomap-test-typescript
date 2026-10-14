import { PrimarySlaTarget } from "./primary-sla-target.js";

/** How screens and exports show a primary sla target. */
export class PrimarySlaTargetView {
  code: string;
  titleText: string;
  revision: string;
  audienceId: string;
  ratioText: string;
  name: string;
  externalRefText: string;
  frequencyCap: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    revision: string,
    audienceId: string,
    ratioText: string,
    name: string,
    externalRefText: string,
    frequencyCap: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.revision = revision;
    this.audienceId = audienceId;
    this.ratioText = ratioText;
    this.name = name;
    this.externalRefText = externalRefText;
    this.frequencyCap = frequencyCap;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toPrimarySlaTargetView(item: PrimarySlaTarget): PrimarySlaTargetView {
  return new PrimarySlaTargetView(
    item.code,
    item.title,
    String(item.revision),
    item.audienceId,
    item.ratio.toFixed(2),
    item.name,
    item.externalRef,
    String(item.frequencyCap),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimarySlaTargetViews(items: PrimarySlaTarget[]): PrimarySlaTargetView[] {
  const views: PrimarySlaTargetView[] = [];
  for (const item of items) {
    views.push(toPrimarySlaTargetView(item));
  }
  return views;
}

export function sumPrimarySlaTargetView(view: PrimarySlaTargetView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedRevision + parsedRatio + parsedFrequencyCap;
}
