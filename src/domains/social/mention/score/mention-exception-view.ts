import { MentionException } from "./mention-exception.js";

/** How screens and exports show a mention exception. */
export class MentionExceptionView {
  codeText: string;
  titleText: string;
  budget: string;
  impressionsText: string;
  statusLabel: string;

  constructor(codeText: string, titleText: string, budget: string, impressionsText: string, statusLabel: string) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.budget = budget;
    this.impressionsText = impressionsText;
    this.statusLabel = statusLabel;
  }
}

export function toMentionExceptionView(item: MentionException): MentionExceptionView {
  return new MentionExceptionView(
    item.code,
    item.title,
    item.budget.toFixed(2),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionExceptionViews(items: MentionException[]): MentionExceptionView[] {
  const views: MentionExceptionView[] = [];
  for (const item of items) {
    views.push(toMentionExceptionView(item));
  }
  return views;
}

export function sumMentionExceptionView(view: MentionExceptionView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedBudget + parsedImpressions;
}
