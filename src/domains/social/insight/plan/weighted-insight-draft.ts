import * as text from "../../../../kit/text.js";

/** Where a weighted insight draft is in its life cycle. */
export type WeightedInsightDraftStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a weighted insight draft and its current status. */
export class WeightedInsightDraft {
  code: string;
  label: string;
  score: number;
  reviewer: string;
  active: boolean;
  locale: string;
  contactEmail: string;
  status: WeightedInsightDraftStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    reviewer: string,
    active: boolean,
    locale: string,
    contactEmail: string,
    status: WeightedInsightDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.reviewer = reviewer;
    this.active = active;
    this.locale = locale;
    this.contactEmail = contactEmail;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedInsightDraftStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: WeightedInsightDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted insight draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"weighted insight draft"} ${this.code}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): WeightedInsightDraft {
    return new WeightedInsightDraft(
      this.code,
      this.label,
      this.score,
      this.reviewer,
      this.active,
      this.locale,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted insight draft in status draft. */
export function newWeightedInsightDraft(code: string, label: string): WeightedInsightDraft {
  return new WeightedInsightDraft(code, label, 0, "", false, "", "", "draft");
}
