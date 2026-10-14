import * as text from "../../../../kit/text.js";
import { MentionAudit } from "./mention-audit.js";

/** How screens and exports show a mention audit. */
export class MentionAuditView {
  code: string;
  labelText: string;
  priority: string;
  audienceIdText: string;
  variant: string;
  visible: string;
  journeyId: string;
  summary: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    priority: string,
    audienceIdText: string,
    variant: string,
    visible: string,
    journeyId: string,
    summary: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.priority = priority;
    this.audienceIdText = audienceIdText;
    this.variant = variant;
    this.visible = visible;
    this.journeyId = journeyId;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toMentionAuditView(item: MentionAudit): MentionAuditView {
  return new MentionAuditView(
    item.code,
    item.label,
    String(item.priority),
    item.audienceId,
    item.variant,
    `${item.visible}`,
    text.truncate(item.journeyId, 64),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionAuditViews(items: MentionAudit[]): MentionAuditView[] {
  const views: MentionAuditView[] = [];
  for (const item of items) {
    views.push(toMentionAuditView(item));
  }
  return views;
}

export function sumMentionAuditView(view: MentionAuditView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedPriority;
}
