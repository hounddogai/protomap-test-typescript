import * as text from "../../../../kit/text.js";

/** Where a capped mention record is in its life cycle. */
export type CappedMentionRecordStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One capped mention record, with what the planners need to act on it. */
export class CappedMentionRecord {
  code: string;
  label: string;
  campaignRef: string;
  budget: number;
  windowDays: number;
  impressions: number;
  retries: number;
  score: number;
  approved: boolean;
  status: CappedMentionRecordStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    budget: number,
    windowDays: number,
    impressions: number,
    retries: number,
    score: number,
    approved: boolean,
    status: CappedMentionRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.budget = budget;
    this.windowDays = windowDays;
    this.impressions = impressions;
    this.retries = retries;
    this.score = score;
    this.approved = approved;
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

  canMoveTo(next: CappedMentionRecordStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedMentionRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped mention record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.impressions + this.budget) * 100) / 100;
  }

  copy(): CappedMentionRecord {
    return new CappedMentionRecord(
      this.code,
      this.label,
      this.campaignRef,
      this.budget,
      this.windowDays,
      this.impressions,
      this.retries,
      this.score,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a capped mention record in status planned. */
export function newCappedMentionRecord(code: string, label: string): CappedMentionRecord {
  return new CappedMentionRecord(code, label, "", 0, 0, 0, 0, 0, false, "planned");
}
