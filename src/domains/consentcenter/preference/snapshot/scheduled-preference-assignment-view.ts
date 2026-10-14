import * as text from "../../../../kit/text.js";
import { ScheduledPreferenceAssignment } from "./scheduled-preference-assignment.js";

/** How screens and exports show a scheduled preference assignment. */
export class ScheduledPreferenceAssignmentView {
  codeText: string;
  title: string;
  timezone: string;
  sequenceText: string;
  expiresAtText: string;
  frequencyCapText: string;
  sendAt: string;
  limitText: string;
  priority: string;
  category: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    timezone: string,
    sequenceText: string,
    expiresAtText: string,
    frequencyCapText: string,
    sendAt: string,
    limitText: string,
    priority: string,
    category: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.timezone = timezone;
    this.sequenceText = sequenceText;
    this.expiresAtText = expiresAtText;
    this.frequencyCapText = frequencyCapText;
    this.sendAt = sendAt;
    this.limitText = limitText;
    this.priority = priority;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledPreferenceAssignmentView(item: ScheduledPreferenceAssignment): ScheduledPreferenceAssignmentView {
  return new ScheduledPreferenceAssignmentView(
    item.code,
    text.truncate(item.title, 40),
    item.timezone,
    String(item.sequence),
    String(item.expiresAt),
    String(item.frequencyCap),
    String(item.sendAt),
    String(item.limit),
    String(item.priority),
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledPreferenceAssignmentViews(items: ScheduledPreferenceAssignment[]): ScheduledPreferenceAssignmentView[] {
  const views: ScheduledPreferenceAssignmentView[] = [];
  for (const item of items) {
    views.push(toScheduledPreferenceAssignmentView(item));
  }
  return views;
}

export function sumScheduledPreferenceAssignmentView(view: ScheduledPreferenceAssignmentView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedSequence + parsedExpiresAt + parsedFrequencyCap;
}
