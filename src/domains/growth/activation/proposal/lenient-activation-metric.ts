import * as text from "../../../../kit/text.js";

/** Where a lenient activation metric is in its life cycle. */
export type LenientActivationMetricStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a lenient activation metric and its current status. */
export class LenientActivationMetric {
  code: string;
  name: string;
  source: string;
  attempts: number;
  rate: number;
  status: LenientActivationMetricStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    attempts: number,
    rate: number,
    status: LenientActivationMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.attempts = attempts;
    this.rate = rate;
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

  canMoveTo(next: LenientActivationMetricStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
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

  moveTo(next: LenientActivationMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient activation metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedTotal(): number {
    return Math.round((this.rate - this.attempts) * 100) / 100;
  }

  copy(): LenientActivationMetric {
    return new LenientActivationMetric(this.code, this.name, this.source, this.attempts, this.rate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a lenient activation metric in status new. */
export function newLenientActivationMetric(code: string, name: string): LenientActivationMetric {
  return new LenientActivationMetric(code, name, "", 0, 0, "new");
}
