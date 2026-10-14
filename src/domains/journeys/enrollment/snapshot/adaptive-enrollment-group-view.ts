import { AdaptiveEnrollmentGroup } from "./adaptive-enrollment-group.js";

/** How screens and exports show a adaptive enrollment group. */
export class AdaptiveEnrollmentGroupView {
  code: string;
  labelText: string;
  audienceId: string;
  name: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    audienceId: string,
    name: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.audienceId = audienceId;
    this.name = name;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveEnrollmentGroupView(item: AdaptiveEnrollmentGroup): AdaptiveEnrollmentGroupView {
  return new AdaptiveEnrollmentGroupView(
    item.code,
    item.label,
    item.audienceId,
    item.name,
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveEnrollmentGroupViews(items: AdaptiveEnrollmentGroup[]): AdaptiveEnrollmentGroupView[] {
  const views: AdaptiveEnrollmentGroupView[] = [];
  for (const item of items) {
    views.push(toAdaptiveEnrollmentGroupView(item));
  }
  return views;
}

export function sumAdaptiveEnrollmentGroupView(view: AdaptiveEnrollmentGroupView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedAttempts;
}
