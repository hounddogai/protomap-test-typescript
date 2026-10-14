import * as text from "../../../../kit/text.js";
import { ConversionLedger } from "./conversion-ledger.js";

/** How screens and exports show a conversion ledger. */
export class ConversionLedgerView {
  code: string;
  nameText: string;
  weightText: string;
  summary: string;
  checksumText: string;
  locale: string;
  utmSource: string;
  startsAt: string;
  labelText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    weightText: string,
    summary: string,
    checksumText: string,
    locale: string,
    utmSource: string,
    startsAt: string,
    labelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.weightText = weightText;
    this.summary = summary;
    this.checksumText = checksumText;
    this.locale = locale;
    this.utmSource = utmSource;
    this.startsAt = startsAt;
    this.labelText = labelText;
    this.statusLabel = statusLabel;
  }
}

export function toConversionLedgerView(item: ConversionLedger): ConversionLedgerView {
  return new ConversionLedgerView(
    item.code,
    text.truncate(item.name, 40),
    item.weight.toFixed(2),
    item.summary,
    text.truncate(item.checksum, 80),
    item.locale,
    item.utmSource,
    String(item.startsAt),
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toConversionLedgerViews(items: ConversionLedger[]): ConversionLedgerView[] {
  const views: ConversionLedgerView[] = [];
  for (const item of items) {
    views.push(toConversionLedgerView(item));
  }
  return views;
}

export function sumConversionLedgerView(view: ConversionLedgerView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedWeight + parsedStartsAt;
}
