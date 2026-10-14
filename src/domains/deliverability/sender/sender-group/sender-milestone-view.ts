import { SenderMilestone } from "./sender-milestone.js";

/** How screens and exports show a sender milestone. */
export class SenderMilestoneView {
  codeText: string;
  labelText: string;
  attempts: string;
  endsAt: string;
  archived: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    attempts: string,
    endsAt: string,
    archived: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.attempts = attempts;
    this.endsAt = endsAt;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toSenderMilestoneView(item: SenderMilestone): SenderMilestoneView {
  return new SenderMilestoneView(
    item.code,
    item.label,
    String(item.attempts),
    String(item.endsAt),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderMilestoneViews(items: SenderMilestone[]): SenderMilestoneView[] {
  const views: SenderMilestoneView[] = [];
  for (const item of items) {
    views.push(toSenderMilestoneView(item));
  }
  return views;
}

export function sumSenderMilestoneView(view: SenderMilestoneView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedAttempts + parsedEndsAt;
}
