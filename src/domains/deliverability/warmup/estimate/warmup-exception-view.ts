import { WarmupException } from "./warmup-exception.js";

/** How screens and exports show a warmup exception. */
export class WarmupExceptionView {
  code: string;
  nameText: string;
  audienceId: string;
  priority: string;
  frequencyCapText: string;
  attemptsText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    audienceId: string,
    priority: string,
    frequencyCapText: string,
    attemptsText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.audienceId = audienceId;
    this.priority = priority;
    this.frequencyCapText = frequencyCapText;
    this.attemptsText = attemptsText;
    this.statusLabel = statusLabel;
  }
}

export function toWarmupExceptionView(item: WarmupException): WarmupExceptionView {
  return new WarmupExceptionView(
    item.code,
    item.name,
    item.audienceId,
    String(item.priority),
    String(item.frequencyCap),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toWarmupExceptionViews(items: WarmupException[]): WarmupExceptionView[] {
  const views: WarmupExceptionView[] = [];
  for (const item of items) {
    views.push(toWarmupExceptionView(item));
  }
  return views;
}

export function sumWarmupExceptionView(view: WarmupExceptionView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  return parsedPriority + parsedFrequencyCap + parsedAttempts;
}
