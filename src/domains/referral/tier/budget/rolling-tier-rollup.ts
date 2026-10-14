import * as text from "../../../../kit/text.js";

/** Where a rolling tier rollup is in its life cycle. */
export type RollingTierRollupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One rolling tier rollup, with what the planners need to act on it. */
export class RollingTierRollup {
  code: string;
  label: string;
  minimum: number;
  amount: number;
  clicks: number;
  quantity: number;
  expiresAt: number;
  budget: number;
  summary: string;
  locale: string;
  category: string;
  status: RollingTierRollupStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    amount: number,
    clicks: number,
    quantity: number,
    expiresAt: number,
    budget: number,
    summary: string,
    locale: string,
    category: string,
    status: RollingTierRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.amount = amount;
    this.clicks = clicks;
    this.quantity = quantity;
    this.expiresAt = expiresAt;
    this.budget = budget;
    this.summary = summary;
    this.locale = locale;
    this.category = category;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingTierRollupStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingTierRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling tier rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"rolling tier rollup"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.clicks + this.budget) * 100) / 100;
  }

  copy(): RollingTierRollup {
    return new RollingTierRollup(
      this.code,
      this.label,
      this.minimum,
      this.amount,
      this.clicks,
      this.quantity,
      this.expiresAt,
      this.budget,
      this.summary,
      this.locale,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling tier rollup in status proposed. */
export function newRollingTierRollup(code: string, label: string): RollingTierRollup {
  return new RollingTierRollup(code, label, 0, 0, 0, 0, 0, 0, "", "", "", "proposed");
}
