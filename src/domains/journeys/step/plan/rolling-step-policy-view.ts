import * as text from "../../../../kit/text.js";
import { RollingStepPolicy } from "./rolling-step-policy.js";

/** How screens and exports show a rolling step policy. */
export class RollingStepPolicyView {
  code: string;
  label: string;
  graceDays: string;
  title: string;
  versionText: string;
  timezone: string;
  summaryText: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    graceDays: string,
    title: string,
    versionText: string,
    timezone: string,
    summaryText: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.title = title;
    this.versionText = versionText;
    this.timezone = timezone;
    this.summaryText = summaryText;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toRollingStepPolicyView(item: RollingStepPolicy): RollingStepPolicyView {
  return new RollingStepPolicyView(
    item.code,
    text.truncate(item.label, 64),
    String(item.graceDays),
    text.truncate(item.title, 40),
    String(item.version),
    item.timezone,
    item.summary,
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingStepPolicyViews(items: RollingStepPolicy[]): RollingStepPolicyView[] {
  const views: RollingStepPolicyView[] = [];
  for (const item of items) {
    views.push(toRollingStepPolicyView(item));
  }
  return views;
}

export function sumRollingStepPolicyView(view: RollingStepPolicyView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedGraceDays + parsedVersion;
}
