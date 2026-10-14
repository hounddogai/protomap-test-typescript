import * as text from "../../../../kit/text.js";

/** Where a level threshold is in its life cycle. */
export type LevelThresholdStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a level threshold and its current status. */
export class LevelThreshold {
  code: string;
  label: string;
  score: number;
  version: number;
  campaignRef: string;
  quantity: number;
  region: string;
  sequence: number;
  externalRef: string;
  status: LevelThresholdStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    version: number,
    campaignRef: string,
    quantity: number,
    region: string,
    sequence: number,
    externalRef: string,
    status: LevelThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.version = version;
    this.campaignRef = campaignRef;
    this.quantity = quantity;
    this.region = region;
    this.sequence = sequence;
    this.externalRef = externalRef;
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

  canMoveTo(next: LevelThresholdStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LevelThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedVolume(): number {
    return Math.round((this.sequence - this.version) * 100) / 100;
  }

  copy(): LevelThreshold {
    return new LevelThreshold(
      this.code,
      this.label,
      this.score,
      this.version,
      this.campaignRef,
      this.quantity,
      this.region,
      this.sequence,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a level threshold in status open. */
export function newLevelThreshold(code: string, label: string): LevelThreshold {
  return new LevelThreshold(code, label, 0, 0, "", 0, "", 0, "", "open");
}
