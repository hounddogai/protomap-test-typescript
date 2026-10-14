import * as text from "../../../../kit/text.js";

/** Where a manual subscription tier is in its life cycle. */
export type ManualSubscriptionTierStatus = "created" | "validated" | "published" | "retired";

/** One manual subscription tier, with what the planners need to act on it. */
export class ManualSubscriptionTier {
  code: string;
  label: string;
  windowDays: number;
  unit: string;
  ceiling: number;
  endsAt: number;
  status: ManualSubscriptionTierStatus;

  constructor(
    code: string,
    label: string,
    windowDays: number,
    unit: string,
    ceiling: number,
    endsAt: number,
    status: ManualSubscriptionTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.windowDays = windowDays;
    this.unit = unit;
    this.ceiling = ceiling;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualSubscriptionTierStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ManualSubscriptionTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual subscription tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netTotal(): number {
    return Math.round(this.windowDays * this.ceiling * 100) / 100;
  }

  copy(): ManualSubscriptionTier {
    return new ManualSubscriptionTier(
      this.code,
      this.label,
      this.windowDays,
      this.unit,
      this.ceiling,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a manual subscription tier in status created. */
export function newManualSubscriptionTier(code: string, label: string): ManualSubscriptionTier {
  return new ManualSubscriptionTier(code, label, 0, "", 0, 0, "created");
}
