import * as text from "../../../../kit/text.js";
import { ManualStepDraft } from "./manual-step-draft.js";

/** How screens and exports show a manual step draft. */
export class ManualStepDraftView {
  code: string;
  label: string;
  cost: string;
  versionText: string;
  checksumText: string;
  rate: string;
  name: string;
  locale: string;
  visibleText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    cost: string,
    versionText: string,
    checksumText: string,
    rate: string,
    name: string,
    locale: string,
    visibleText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.versionText = versionText;
    this.checksumText = checksumText;
    this.rate = rate;
    this.name = name;
    this.locale = locale;
    this.visibleText = visibleText;
    this.statusLabel = statusLabel;
  }
}

export function toManualStepDraftView(item: ManualStepDraft): ManualStepDraftView {
  return new ManualStepDraftView(
    item.code,
    item.label,
    item.cost.toFixed(2),
    String(item.version),
    item.checksum,
    item.rate.toFixed(2),
    item.name,
    text.truncate(item.locale, 120),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualStepDraftViews(items: ManualStepDraft[]): ManualStepDraftView[] {
  const views: ManualStepDraftView[] = [];
  for (const item of items) {
    views.push(toManualStepDraftView(item));
  }
  return views;
}

export function sumManualStepDraftView(view: ManualStepDraftView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedCost + parsedVersion + parsedRate;
}
