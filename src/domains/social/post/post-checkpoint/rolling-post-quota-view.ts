import { RollingPostQuota } from "./rolling-post-quota.js";

/** How screens and exports show a rolling post quota. */
export class RollingPostQuotaView {
  code: string;
  labelText: string;
  frequencyCap: string;
  archived: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    frequencyCap: string,
    archived: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.frequencyCap = frequencyCap;
    this.archived = archived;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toRollingPostQuotaView(item: RollingPostQuota): RollingPostQuotaView {
  return new RollingPostQuotaView(
    item.code,
    item.label,
    String(item.frequencyCap),
    `${item.archived}`,
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingPostQuotaViews(items: RollingPostQuota[]): RollingPostQuotaView[] {
  const views: RollingPostQuotaView[] = [];
  for (const item of items) {
    views.push(toRollingPostQuotaView(item));
  }
  return views;
}

export function sumRollingPostQuotaView(view: RollingPostQuotaView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedFrequencyCap + parsedRetries;
}
