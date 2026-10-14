import * as text from "../../../../kit/text.js";

/** Where a regional sender tier is in its life cycle. */
export type RegionalSenderTierStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One regional sender tier, with what the planners need to act on it. */
export class RegionalSenderTier {
  code: string;
  label: string;
  retries: number;
  windowDays: number;
  notes: string;
  status: RegionalSenderTierStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    windowDays: number,
    notes: string,
    status: RegionalSenderTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.windowDays = windowDays;
    this.notes = notes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalSenderTierStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalSenderTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional sender tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedValue(): number {
    return Math.round((this.windowDays + this.retries) * 100) / 100;
  }

  copy(): RegionalSenderTier {
    return new RegionalSenderTier(this.code, this.label, this.retries, this.windowDays, this.notes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional sender tier in status draft. */
export function newRegionalSenderTier(code: string, label: string): RegionalSenderTier {
  return new RegionalSenderTier(code, label, 0, 0, "", "draft");
}
