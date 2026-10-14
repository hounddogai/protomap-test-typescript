import * as text from "../../../../kit/text.js";

/** Where a lenient double opt in bundle is in its life cycle. */
export type LenientDoubleOptInBundleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A lenient double opt in bundle as the double opt in team keeps it. */
export class LenientDoubleOptInBundle {
  code: string;
  label: string;
  graceDays: number;
  reviewer: string;
  impressions: number;
  status: LenientDoubleOptInBundleStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    reviewer: string,
    impressions: number,
    status: LenientDoubleOptInBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.reviewer = reviewer;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientDoubleOptInBundleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientDoubleOptInBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient double opt in bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"lenient double opt in bundle"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.graceDays + this.impressions) * 100) / 100;
  }

  copy(): LenientDoubleOptInBundle {
    return new LenientDoubleOptInBundle(
      this.code,
      this.label,
      this.graceDays,
      this.reviewer,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a lenient double opt in bundle in status new. */
export function newLenientDoubleOptInBundle(code: string, label: string): LenientDoubleOptInBundle {
  return new LenientDoubleOptInBundle(code, label, 0, "", 0, "new");
}
