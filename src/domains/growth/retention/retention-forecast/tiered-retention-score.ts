import * as text from "../../../../kit/text.js";

/** Where a tiered retention score is in its life cycle. */
export type TieredRetentionScoreStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tiered retention score. Its code is unique within a tenant. */
export class TieredRetentionScore {
  code: string;
  label: string;
  title: string;
  expiresAt: number;
  endsAt: number;
  locale: string;
  budget: number;
  status: TieredRetentionScoreStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    expiresAt: number,
    endsAt: number,
    locale: string,
    budget: number,
    status: TieredRetentionScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.expiresAt = expiresAt;
    this.endsAt = endsAt;
    this.locale = locale;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredRetentionScoreStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: TieredRetentionScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered retention score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"tiered retention score"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.expiresAt + this.endsAt) * 100) / 100;
  }

  copy(): TieredRetentionScore {
    return new TieredRetentionScore(
      this.code,
      this.label,
      this.title,
      this.expiresAt,
      this.endsAt,
      this.locale,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tiered retention score in status planned. */
export function newTieredRetentionScore(code: string, label: string): TieredRetentionScore {
  return new TieredRetentionScore(code, label, "", 0, 0, "", 0, "planned");
}
