import * as text from "../../../../kit/text.js";

/** Where a adaptive challenge batch is in its life cycle. */
export type AdaptiveChallengeBatchStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a adaptive challenge batch and its current status. */
export class AdaptiveChallengeBatch {
  code: string;
  label: string;
  summary: string;
  cost: number;
  conversionRate: number;
  graceDays: number;
  status: AdaptiveChallengeBatchStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    cost: number,
    conversionRate: number,
    graceDays: number,
    status: AdaptiveChallengeBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.cost = cost;
    this.conversionRate = conversionRate;
    this.graceDays = graceDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveChallengeBatchStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveChallengeBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive challenge batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveLoad(): number {
    return Math.round(this.conversionRate * this.graceDays * 100) / 100;
  }

  copy(): AdaptiveChallengeBatch {
    return new AdaptiveChallengeBatch(
      this.code,
      this.label,
      this.summary,
      this.cost,
      this.conversionRate,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive challenge batch in status requested. */
export function newAdaptiveChallengeBatch(code: string, label: string): AdaptiveChallengeBatch {
  return new AdaptiveChallengeBatch(code, label, "", 0, 0, 0, "requested");
}
