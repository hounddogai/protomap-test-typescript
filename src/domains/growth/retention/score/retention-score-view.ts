import { RetentionScore } from "./retention-score.js";

/** How screens and exports show a retention score. */
export class RetentionScoreView {
  codeText: string;
  label: string;
  endsAtText: string;
  source: string;
  attempts: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    endsAtText: string,
    source: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.endsAtText = endsAtText;
    this.source = source;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionScoreView(item: RetentionScore): RetentionScoreView {
  return new RetentionScoreView(
    item.code,
    item.label,
    String(item.endsAt),
    item.source,
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionScoreViews(items: RetentionScore[]): RetentionScoreView[] {
  const views: RetentionScoreView[] = [];
  for (const item of items) {
    views.push(toRetentionScoreView(item));
  }
  return views;
}

export function sumRetentionScoreView(view: RetentionScoreView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedEndsAt + parsedAttempts;
}
