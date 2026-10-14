import * as text from "../../../../kit/text.js";

/** Where a manual nudge override is in its life cycle. */
export type ManualNudgeOverrideStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a manual nudge override and its current status. */
export class ManualNudgeOverride {
  code: string;
  label: string;
  cohort: string;
  score: number;
  impressions: number;
  locale: string;
  status: ManualNudgeOverrideStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    score: number,
    impressions: number,
    locale: string,
    status: ManualNudgeOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.score = score;
    this.impressions = impressions;
    this.locale = locale;
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

  canMoveTo(next: ManualNudgeOverrideStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ManualNudgeOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual nudge override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round(this.impressions * this.score * 100) / 100;
  }

  copy(): ManualNudgeOverride {
    return new ManualNudgeOverride(
      this.code,
      this.label,
      this.cohort,
      this.score,
      this.impressions,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual nudge override in status draft. */
export function newManualNudgeOverride(code: string, label: string): ManualNudgeOverride {
  return new ManualNudgeOverride(code, label, "", 0, 0, "", "draft");
}
