import { MacroSnapshot } from "./macro-snapshot.js";

/** How screens and exports show a macro snapshot. */
export class MacroSnapshotView {
  code: string;
  title: string;
  batchSize: string;
  maximum: string;
  attemptsText: string;
  ownerId: string;
  utmSource: string;
  country: string;
  version: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    batchSize: string,
    maximum: string,
    attemptsText: string,
    ownerId: string,
    utmSource: string,
    country: string,
    version: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.maximum = maximum;
    this.attemptsText = attemptsText;
    this.ownerId = ownerId;
    this.utmSource = utmSource;
    this.country = country;
    this.version = version;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toMacroSnapshotView(item: MacroSnapshot): MacroSnapshotView {
  return new MacroSnapshotView(
    item.code,
    item.title,
    String(item.batchSize),
    item.maximum.toFixed(2),
    String(item.attempts),
    item.ownerId,
    item.utmSource,
    item.country,
    String(item.version),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toMacroSnapshotViews(items: MacroSnapshot[]): MacroSnapshotView[] {
  const views: MacroSnapshotView[] = [];
  for (const item of items) {
    views.push(toMacroSnapshotView(item));
  }
  return views;
}

export function sumMacroSnapshotView(view: MacroSnapshotView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  return parsedBatchSize + parsedMaximum + parsedAttempts;
}
