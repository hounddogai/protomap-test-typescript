import * as text from "../../../../kit/text.js";

/** Where a lenient reward score is in its life cycle. */
export type LenientRewardScoreStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A lenient reward score. Its code is unique within a tenant. */
export class LenientRewardScore {
  code: string;
  title: string;
  openRate: number;
  createdAt: number;
  variant: string;
  sequence: number;
  pinned: boolean;
  status: LenientRewardScoreStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    createdAt: number,
    variant: string,
    sequence: number,
    pinned: boolean,
    status: LenientRewardScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.createdAt = createdAt;
    this.variant = variant;
    this.sequence = sequence;
    this.pinned = pinned;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientRewardScoreStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LenientRewardScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient reward score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round(this.createdAt * this.sequence * 100) / 100;
  }

  copy(): LenientRewardScore {
    return new LenientRewardScore(
      this.code,
      this.title,
      this.openRate,
      this.createdAt,
      this.variant,
      this.sequence,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient reward score in status open. */
export function newLenientRewardScore(code: string, title: string): LenientRewardScore {
  return new LenientRewardScore(code, title, 0, 0, "", 0, false, "open");
}
