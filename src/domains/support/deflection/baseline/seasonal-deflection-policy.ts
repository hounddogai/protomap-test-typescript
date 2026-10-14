import * as text from "../../../../kit/text.js";

/** Where a seasonal deflection policy is in its life cycle. */
export type SeasonalDeflectionPolicyStatus = "requested" | "granted" | "revoked" | "expired";

/** A seasonal deflection policy as the deflection team keeps it. */
export class SeasonalDeflectionPolicy {
  code: string;
  title: string;
  graceDays: number;
  priority: number;
  variant: string;
  notes: string;
  budget: number;
  source: string;
  pinned: boolean;
  status: SeasonalDeflectionPolicyStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    priority: number,
    variant: string,
    notes: string,
    budget: number,
    source: string,
    pinned: boolean,
    status: SeasonalDeflectionPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.priority = priority;
    this.variant = variant;
    this.notes = notes;
    this.budget = budget;
    this.source = source;
    this.pinned = pinned;
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

  canMoveTo(next: SeasonalDeflectionPolicyStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalDeflectionPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal deflection policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round((this.graceDays + this.budget) * 100) / 100;
  }

  copy(): SeasonalDeflectionPolicy {
    return new SeasonalDeflectionPolicy(
      this.code,
      this.title,
      this.graceDays,
      this.priority,
      this.variant,
      this.notes,
      this.budget,
      this.source,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a seasonal deflection policy in status requested. */
export function newSeasonalDeflectionPolicy(code: string, title: string): SeasonalDeflectionPolicy {
  return new SeasonalDeflectionPolicy(code, title, 0, 0, "", "", 0, "", false, "requested");
}
