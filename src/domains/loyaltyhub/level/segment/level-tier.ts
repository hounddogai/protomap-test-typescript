import * as text from "../../../../kit/text.js";

/** Where a level tier is in its life cycle. */
export type LevelTierStatus = "requested" | "granted" | "revoked" | "expired";

/** One level tier, with what the planners need to act on it. */
export class LevelTier {
  code: string;
  name: string;
  unit: string;
  revision: number;
  budget: number;
  cohort: string;
  currency: string;
  status: LevelTierStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    revision: number,
    budget: number,
    cohort: string,
    currency: string,
    status: LevelTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.revision = revision;
    this.budget = budget;
    this.cohort = cohort;
    this.currency = currency;
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

  canMoveTo(next: LevelTierStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: LevelTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round(this.budget * this.revision * 100) / 100;
  }

  copy(): LevelTier {
    return new LevelTier(
      this.code,
      this.name,
      this.unit,
      this.revision,
      this.budget,
      this.cohort,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a level tier in status requested. */
export function newLevelTier(code: string, name: string): LevelTier {
  return new LevelTier(code, name, "", 0, 0, "", "", "requested");
}
