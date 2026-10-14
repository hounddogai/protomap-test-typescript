import * as text from "../../../../kit/text.js";

/** Where a funnel score is in its life cycle. */
export type FunnelScoreStatus = "new" | "queued" | "running" | "done" | "failed";

/** A funnel score. Its code is unique within a tenant. */
export class FunnelScore {
  code: string;
  label: string;
  retries: number;
  batchSize: number;
  discount: number;
  locale: string;
  status: FunnelScoreStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    batchSize: number,
    discount: number,
    locale: string,
    status: FunnelScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.batchSize = batchSize;
    this.discount = discount;
    this.locale = locale;
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

  canMoveTo(next: FunnelScoreStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: FunnelScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedValue(): number {
    return Math.round((this.batchSize - this.discount) * 100) / 100;
  }

  copy(): FunnelScore {
    return new FunnelScore(
      this.code,
      this.label,
      this.retries,
      this.batchSize,
      this.discount,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a funnel score in status new. */
export function newFunnelScore(code: string, label: string): FunnelScore {
  return new FunnelScore(code, label, 0, 0, 0, "", "new");
}
