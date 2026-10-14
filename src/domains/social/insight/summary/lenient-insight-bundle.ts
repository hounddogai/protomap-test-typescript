import * as text from "../../../../kit/text.js";

/** Where a lenient insight bundle is in its life cycle. */
export type LenientInsightBundleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A lenient insight bundle as the insight team keeps it. */
export class LenientInsightBundle {
  code: string;
  name: string;
  version: number;
  budget: number;
  updatedAt: number;
  amount: number;
  status: LenientInsightBundleStatus;

  constructor(
    code: string,
    name: string,
    version: number,
    budget: number,
    updatedAt: number,
    amount: number,
    status: LenientInsightBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.budget = budget;
    this.updatedAt = updatedAt;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientInsightBundleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientInsightBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient insight bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"lenient insight bundle"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.updatedAt - this.amount) * 100) / 100;
  }

  copy(): LenientInsightBundle {
    return new LenientInsightBundle(
      this.code,
      this.name,
      this.version,
      this.budget,
      this.updatedAt,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient insight bundle in status planned. */
export function newLenientInsightBundle(code: string, name: string): LenientInsightBundle {
  return new LenientInsightBundle(code, name, 0, 0, 0, 0, "planned");
}
