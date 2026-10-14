import * as text from "../../../../kit/text.js";

/** Where a frequency variance is in its life cycle. */
export type FrequencyVarianceStatus = "new" | "queued" | "running" | "done" | "failed";

/** A frequency variance as the frequency team keeps it. */
export class FrequencyVariance {
  code: string;
  name: string;
  windowDays: number;
  sendAt: number;
  limit: number;
  approved: boolean;
  updatedAt: number;
  source: string;
  budget: number;
  batchSize: number;
  status: FrequencyVarianceStatus;

  constructor(
    code: string,
    name: string,
    windowDays: number,
    sendAt: number,
    limit: number,
    approved: boolean,
    updatedAt: number,
    source: string,
    budget: number,
    batchSize: number,
    status: FrequencyVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.sendAt = sendAt;
    this.limit = limit;
    this.approved = approved;
    this.updatedAt = updatedAt;
    this.source = source;
    this.budget = budget;
    this.batchSize = batchSize;
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

  canMoveTo(next: FrequencyVarianceStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FrequencyVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedValue(): number {
    return Math.round((this.batchSize - this.sendAt) * 100) / 100;
  }

  copy(): FrequencyVariance {
    return new FrequencyVariance(
      this.code,
      this.name,
      this.windowDays,
      this.sendAt,
      this.limit,
      this.approved,
      this.updatedAt,
      this.source,
      this.budget,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a frequency variance in status new. */
export function newFrequencyVariance(code: string, name: string): FrequencyVariance {
  return new FrequencyVariance(code, name, 0, 0, 0, false, 0, "", 0, 0, "new");
}
