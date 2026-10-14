import * as text from "../../../../kit/text.js";

/** Where a funnel quota is in its life cycle. */
export type FunnelQuotaStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A funnel quota as the funnel team keeps it. */
export class FunnelQuota {
  code: string;
  label: string;
  amount: number;
  rate: number;
  description: string;
  threshold: number;
  status: FunnelQuotaStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    rate: number,
    description: string,
    threshold: number,
    status: FunnelQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.rate = rate;
    this.description = description;
    this.threshold = threshold;
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

  canMoveTo(next: FunnelQuotaStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FunnelQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedLoad(): number {
    return Math.round((this.amount + this.rate) * 100) / 100;
  }

  copy(): FunnelQuota {
    return new FunnelQuota(
      this.code,
      this.label,
      this.amount,
      this.rate,
      this.description,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a funnel quota in status open. */
export function newFunnelQuota(code: string, label: string): FunnelQuota {
  return new FunnelQuota(code, label, 0, 0, "", 0, "open");
}
