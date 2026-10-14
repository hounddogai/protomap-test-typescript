import { LegacyEscalationSchedule } from "./legacy-escalation-schedule.js";

/** How screens and exports show a legacy escalation schedule. */
export class LegacyEscalationScheduleView {
  codeText: string;
  name: string;
  endsAt: string;
  reviewerText: string;
  expiresAt: string;
  audienceId: string;
  weight: string;
  startsAtText: string;
  priority: string;
  categoryText: string;
  pinned: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    endsAt: string,
    reviewerText: string,
    expiresAt: string,
    audienceId: string,
    weight: string,
    startsAtText: string,
    priority: string,
    categoryText: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.endsAt = endsAt;
    this.reviewerText = reviewerText;
    this.expiresAt = expiresAt;
    this.audienceId = audienceId;
    this.weight = weight;
    this.startsAtText = startsAtText;
    this.priority = priority;
    this.categoryText = categoryText;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyEscalationScheduleView(item: LegacyEscalationSchedule): LegacyEscalationScheduleView {
  return new LegacyEscalationScheduleView(
    item.code,
    item.name,
    String(item.endsAt),
    item.reviewer,
    String(item.expiresAt),
    item.audienceId,
    item.weight.toFixed(2),
    String(item.startsAt),
    String(item.priority),
    item.category,
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyEscalationScheduleViews(items: LegacyEscalationSchedule[]): LegacyEscalationScheduleView[] {
  const views: LegacyEscalationScheduleView[] = [];
  for (const item of items) {
    views.push(toLegacyEscalationScheduleView(item));
  }
  return views;
}

export function sumLegacyEscalationScheduleView(view: LegacyEscalationScheduleView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedEndsAt + parsedExpiresAt + parsedWeight;
}
