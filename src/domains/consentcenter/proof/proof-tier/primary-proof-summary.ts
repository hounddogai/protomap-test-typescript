import * as text from "../../../../kit/text.js";

/** Where a primary proof summary is in its life cycle. */
export type PrimaryProofSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** One primary proof summary, with what the planners need to act on it. */
export class PrimaryProofSummary {
  code: string;
  name: string;
  cost: number;
  threshold: number;
  currency: string;
  utmSource: string;
  maximum: number;
  variant: string;
  status: PrimaryProofSummaryStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    threshold: number,
    currency: string,
    utmSource: string,
    maximum: number,
    variant: string,
    status: PrimaryProofSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.threshold = threshold;
    this.currency = currency;
    this.utmSource = utmSource;
    this.maximum = maximum;
    this.variant = variant;
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

  canMoveTo(next: PrimaryProofSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "running";
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryProofSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary proof summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"primary proof summary"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.maximum - this.cost) * 100) / 100;
  }

  copy(): PrimaryProofSummary {
    return new PrimaryProofSummary(
      this.code,
      this.name,
      this.cost,
      this.threshold,
      this.currency,
      this.utmSource,
      this.maximum,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a primary proof summary in status new. */
export function newPrimaryProofSummary(code: string, name: string): PrimaryProofSummary {
  return new PrimaryProofSummary(code, name, 0, 0, "", "", 0, "", "new");
}
