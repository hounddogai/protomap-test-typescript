import { GlobalDeflectionCheckpoint } from "./global-deflection-checkpoint.js";

/** How screens and exports show a global deflection checkpoint. */
export class GlobalDeflectionCheckpointView {
  code: string;
  labelText: string;
  sendAt: string;
  ceilingText: string;
  title: string;
  retries: string;
  unit: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    sendAt: string,
    ceilingText: string,
    title: string,
    retries: string,
    unit: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.sendAt = sendAt;
    this.ceilingText = ceilingText;
    this.title = title;
    this.retries = retries;
    this.unit = unit;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalDeflectionCheckpointView(item: GlobalDeflectionCheckpoint): GlobalDeflectionCheckpointView {
  return new GlobalDeflectionCheckpointView(
    item.code,
    item.label,
    String(item.sendAt),
    item.ceiling.toFixed(2),
    item.title,
    String(item.retries),
    item.unit,
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalDeflectionCheckpointViews(items: GlobalDeflectionCheckpoint[]): GlobalDeflectionCheckpointView[] {
  const views: GlobalDeflectionCheckpointView[] = [];
  for (const item of items) {
    views.push(toGlobalDeflectionCheckpointView(item));
  }
  return views;
}

export function sumGlobalDeflectionCheckpointView(view: GlobalDeflectionCheckpointView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedSendAt + parsedCeiling + parsedRetries;
}
