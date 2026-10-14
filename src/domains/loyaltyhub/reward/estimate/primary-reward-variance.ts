import * as text from "../../../../kit/text.js";

/** Where a primary reward variance is in its life cycle. */
export type PrimaryRewardVarianceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a primary reward variance and its current status. */
export class PrimaryRewardVariance {
  code: string;
  label: string;
  clicks: number;
  floorValue: number;
  pinned: boolean;
  threshold: number;
  retries: number;
  name: string;
  status: PrimaryRewardVarianceStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    floorValue: number,
    pinned: boolean,
    threshold: number,
    retries: number,
    name: string,
    status: PrimaryRewardVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.floorValue = floorValue;
    this.pinned = pinned;
    this.threshold = threshold;
    this.retries = retries;
    this.name = name;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryRewardVarianceStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryRewardVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary reward variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"primary reward variance"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.floorValue - this.retries) * 100) / 100;
  }

  copy(): PrimaryRewardVariance {
    return new PrimaryRewardVariance(
      this.code,
      this.label,
      this.clicks,
      this.floorValue,
      this.pinned,
      this.threshold,
      this.retries,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a primary reward variance in status proposed. */
export function newPrimaryRewardVariance(code: string, label: string): PrimaryRewardVariance {
  return new PrimaryRewardVariance(code, label, 0, 0, false, 0, 0, "", "proposed");
}
