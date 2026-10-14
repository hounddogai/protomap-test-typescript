import { TieredPacingBatch } from "./tiered-pacing-batch.js";

/** How screens and exports show a tiered pacing batch. */
export class TieredPacingBatchView {
  code: string;
  title: string;
  graceDays: string;
  score: string;
  phone: string;
  locale: string;
  checksumText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    graceDays: string,
    score: string,
    phone: string,
    locale: string,
    checksumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.score = score;
    this.phone = phone;
    this.locale = locale;
    this.checksumText = checksumText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredPacingBatchView(item: TieredPacingBatch): TieredPacingBatchView {
  return new TieredPacingBatchView(
    item.code,
    item.title,
    String(item.graceDays),
    item.score.toFixed(2),
    item.phone,
    item.locale,
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredPacingBatchViews(items: TieredPacingBatch[]): TieredPacingBatchView[] {
  const views: TieredPacingBatchView[] = [];
  for (const item of items) {
    views.push(toTieredPacingBatchView(item));
  }
  return views;
}

export function sumTieredPacingBatchView(view: TieredPacingBatchView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedGraceDays + parsedScore;
}
