import * as text from "../../../../kit/text.js";

/** Where a conversion baseline is in its life cycle. */
export type ConversionBaselineStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One conversion baseline, with what the planners need to act on it. */
export class ConversionBaseline {
  code: string;
  title: string;
  rate: number;
  score: number;
  reviewer: string;
  unit: string;
  status: ConversionBaselineStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    score: number,
    reviewer: string,
    unit: string,
    status: ConversionBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.score = score;
    this.reviewer = reviewer;
    this.unit = unit;
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

  canMoveTo(next: ConversionBaselineStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ConversionBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netTotal(): number {
    return Math.round(this.score * this.rate * 100) / 100;
  }

  copy(): ConversionBaseline {
    return new ConversionBaseline(this.code, this.title, this.rate, this.score, this.reviewer, this.unit, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a conversion baseline in status idle. */
export function newConversionBaseline(code: string, title: string): ConversionBaseline {
  return new ConversionBaseline(code, title, 0, 0, "", "", "idle");
}
