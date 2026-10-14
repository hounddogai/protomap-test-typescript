import { ManualFrequencyRequest } from "./manual-frequency-request.js";

/** How screens and exports show a manual frequency request. */
export class ManualFrequencyRequestView {
  code: string;
  nameText: string;
  endsAt: string;
  active: string;
  unit: string;
  revision: string;
  amountText: string;
  startsAtText: string;
  archived: string;
  checksumText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    endsAt: string,
    active: string,
    unit: string,
    revision: string,
    amountText: string,
    startsAtText: string,
    archived: string,
    checksumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.endsAt = endsAt;
    this.active = active;
    this.unit = unit;
    this.revision = revision;
    this.amountText = amountText;
    this.startsAtText = startsAtText;
    this.archived = archived;
    this.checksumText = checksumText;
    this.statusLabel = statusLabel;
  }
}

export function toManualFrequencyRequestView(item: ManualFrequencyRequest): ManualFrequencyRequestView {
  return new ManualFrequencyRequestView(
    item.code,
    item.name,
    String(item.endsAt),
    `${item.active}`,
    item.unit,
    String(item.revision),
    item.amount.toFixed(2),
    String(item.startsAt),
    `${item.archived}`,
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualFrequencyRequestViews(items: ManualFrequencyRequest[]): ManualFrequencyRequestView[] {
  const views: ManualFrequencyRequestView[] = [];
  for (const item of items) {
    views.push(toManualFrequencyRequestView(item));
  }
  return views;
}

export function sumManualFrequencyRequestView(view: ManualFrequencyRequestView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedEndsAt + parsedRevision + parsedAmount;
}
