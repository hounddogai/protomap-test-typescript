import * as text from "../../../../kit/text.js";

/** Where a weighted pacing threshold is in its life cycle. */
export type WeightedPacingThresholdStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A weighted pacing threshold as the pacing team keeps it. */
export class WeightedPacingThreshold {
  code: string;
  title: string;
  bid: number;
  weight: number;
  segment: string;
  frequencyCap: number;
  retries: number;
  currency: string;
  status: WeightedPacingThresholdStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    weight: number,
    segment: string,
    frequencyCap: number,
    retries: number,
    currency: string,
    status: WeightedPacingThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.weight = weight;
    this.segment = segment;
    this.frequencyCap = frequencyCap;
    this.retries = retries;
    this.currency = currency;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedPacingThresholdStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: WeightedPacingThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted pacing threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedVolume(): number {
    return Math.round((this.retries - this.frequencyCap) * 100) / 100;
  }

  copy(): WeightedPacingThreshold {
    return new WeightedPacingThreshold(
      this.code,
      this.title,
      this.bid,
      this.weight,
      this.segment,
      this.frequencyCap,
      this.retries,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a weighted pacing threshold in status idle. */
export function newWeightedPacingThreshold(code: string, title: string): WeightedPacingThreshold {
  return new WeightedPacingThreshold(code, title, 0, 0, "", 0, 0, "", "idle");
}
