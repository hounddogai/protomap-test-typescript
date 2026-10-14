import * as text from "../../../../kit/text.js";

/** Where a legacy deflection rule is in its life cycle. */
export type LegacyDeflectionRuleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A legacy deflection rule as the deflection team keeps it. */
export class LegacyDeflectionRule {
  code: string;
  title: string;
  sequence: number;
  rate: number;
  cohort: string;
  country: string;
  capacity: number;
  status: LegacyDeflectionRuleStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    rate: number,
    cohort: string,
    country: string,
    capacity: number,
    status: LegacyDeflectionRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.rate = rate;
    this.cohort = cohort;
    this.country = country;
    this.capacity = capacity;
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

  canMoveTo(next: LegacyDeflectionRuleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LegacyDeflectionRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy deflection rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netExposure(): number {
    return Math.round(this.capacity * this.rate * 100) / 100;
  }

  copy(): LegacyDeflectionRule {
    return new LegacyDeflectionRule(
      this.code,
      this.title,
      this.sequence,
      this.rate,
      this.cohort,
      this.country,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a legacy deflection rule in status new. */
export function newLegacyDeflectionRule(code: string, title: string): LegacyDeflectionRule {
  return new LegacyDeflectionRule(code, title, 0, 0, "", "", 0, "new");
}
