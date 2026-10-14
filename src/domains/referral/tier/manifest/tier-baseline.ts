import * as text from "../../../../kit/text.js";

/** Where a tier baseline is in its life cycle. */
export type TierBaselineStatus = "created" | "validated" | "published" | "retired";

/** The record of a tier baseline and its current status. */
export class TierBaseline {
  code: string;
  label: string;
  checksum: string;
  locale: string;
  campaignRef: string;
  notes: string;
  score: number;
  status: TierBaselineStatus;

  constructor(
    code: string,
    label: string,
    checksum: string,
    locale: string,
    campaignRef: string,
    notes: string,
    score: number,
    status: TierBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.checksum = checksum;
    this.locale = locale;
    this.campaignRef = campaignRef;
    this.notes = notes;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: TierBaselineStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TierBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): TierBaseline {
    return new TierBaseline(
      this.code,
      this.label,
      this.checksum,
      this.locale,
      this.campaignRef,
      this.notes,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tier baseline in status created. */
export function newTierBaseline(code: string, label: string): TierBaseline {
  return new TierBaseline(code, label, "", "", "", "", 0, "created");
}
