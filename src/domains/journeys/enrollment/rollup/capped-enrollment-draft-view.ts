import { CappedEnrollmentDraft } from "./capped-enrollment-draft.js";

/** How screens and exports show a capped enrollment draft. */
export class CappedEnrollmentDraftView {
  codeText: string;
  labelText: string;
  country: string;
  openRate: string;
  weight: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    country: string,
    openRate: string,
    weight: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.country = country;
    this.openRate = openRate;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toCappedEnrollmentDraftView(item: CappedEnrollmentDraft): CappedEnrollmentDraftView {
  return new CappedEnrollmentDraftView(
    item.code,
    item.label,
    item.country,
    item.openRate.toFixed(2),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedEnrollmentDraftViews(items: CappedEnrollmentDraft[]): CappedEnrollmentDraftView[] {
  const views: CappedEnrollmentDraftView[] = [];
  for (const item of items) {
    views.push(toCappedEnrollmentDraftView(item));
  }
  return views;
}

export function sumCappedEnrollmentDraftView(view: CappedEnrollmentDraftView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedOpenRate + parsedWeight;
}
