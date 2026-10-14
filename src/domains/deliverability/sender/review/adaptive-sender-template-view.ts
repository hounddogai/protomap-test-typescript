import { AdaptiveSenderTemplate } from "./adaptive-sender-template.js";

/** How screens and exports show a adaptive sender template. */
export class AdaptiveSenderTemplateView {
  code: string;
  label: string;
  budget: string;
  attempts: string;
  sendAt: string;
  statusLabel: string;

  constructor(code: string, label: string, budget: string, attempts: string, sendAt: string, statusLabel: string) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.attempts = attempts;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveSenderTemplateView(item: AdaptiveSenderTemplate): AdaptiveSenderTemplateView {
  return new AdaptiveSenderTemplateView(
    item.code,
    item.label,
    item.budget.toFixed(2),
    String(item.attempts),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveSenderTemplateViews(items: AdaptiveSenderTemplate[]): AdaptiveSenderTemplateView[] {
  const views: AdaptiveSenderTemplateView[] = [];
  for (const item of items) {
    views.push(toAdaptiveSenderTemplateView(item));
  }
  return views;
}

export function sumAdaptiveSenderTemplateView(view: AdaptiveSenderTemplateView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedBudget + parsedAttempts + parsedSendAt;
}
