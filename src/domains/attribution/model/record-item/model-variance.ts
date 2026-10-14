import * as text from "../../../../kit/text.js";

/** Where a model variance is in its life cycle. */
export type ModelVarianceStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a model variance and its current status. */
export class ModelVariance {
  code: string;
  title: string;
  endsAt: number;
  amount: number;
  clicks: number;
  expiresAt: number;
  threshold: number;
  cost: number;
  source: string;
  cohort: string;
  status: ModelVarianceStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    amount: number,
    clicks: number,
    expiresAt: number,
    threshold: number,
    cost: number,
    source: string,
    cohort: string,
    status: ModelVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.amount = amount;
    this.clicks = clicks;
    this.expiresAt = expiresAt;
    this.threshold = threshold;
    this.cost = cost;
    this.source = source;
    this.cohort = cohort;
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

  canMoveTo(next: ModelVarianceStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
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

  moveTo(next: ModelVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveVolume(): number {
    return Math.round(this.endsAt * this.expiresAt * 100) / 100;
  }

  copy(): ModelVariance {
    return new ModelVariance(
      this.code,
      this.title,
      this.endsAt,
      this.amount,
      this.clicks,
      this.expiresAt,
      this.threshold,
      this.cost,
      this.source,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a model variance in status new. */
export function newModelVariance(code: string, title: string): ModelVariance {
  return new ModelVariance(code, title, 0, 0, 0, 0, 0, 0, "", "", "new");
}
