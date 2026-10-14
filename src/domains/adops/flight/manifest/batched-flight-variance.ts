import * as text from "../../../../kit/text.js";

/** Where a batched flight variance is in its life cycle. */
export type BatchedFlightVarianceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a batched flight variance and its current status. */
export class BatchedFlightVariance {
  code: string;
  name: string;
  ratio: number;
  rate: number;
  cohort: string;
  batchSize: number;
  version: number;
  status: BatchedFlightVarianceStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    rate: number,
    cohort: string,
    batchSize: number,
    version: number,
    status: BatchedFlightVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.rate = rate;
    this.cohort = cohort;
    this.batchSize = batchSize;
    this.version = version;
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

  canMoveTo(next: BatchedFlightVarianceStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedFlightVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched flight variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netValue(): number {
    return Math.round((this.rate + this.version) * 100) / 100;
  }

  copy(): BatchedFlightVariance {
    return new BatchedFlightVariance(
      this.code,
      this.name,
      this.ratio,
      this.rate,
      this.cohort,
      this.batchSize,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a batched flight variance in status idle. */
export function newBatchedFlightVariance(code: string, name: string): BatchedFlightVariance {
  return new BatchedFlightVariance(code, name, 0, 0, "", 0, 0, "idle");
}
