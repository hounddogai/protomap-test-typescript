import * as text from "../../../../kit/text.js";

/** Where a tiered exit rule digest is in its life cycle. */
export type TieredExitRuleDigestStatus = "created" | "validated" | "published" | "retired";

/** A tiered exit rule digest as the exit rule team keeps it. */
export class TieredExitRuleDigest {
  code: string;
  name: string;
  country: string;
  impressions: number;
  archived: boolean;
  budget: number;
  status: TieredExitRuleDigestStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    impressions: number,
    archived: boolean,
    budget: number,
    status: TieredExitRuleDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.impressions = impressions;
    this.archived = archived;
    this.budget = budget;
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

  canMoveTo(next: TieredExitRuleDigestStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredExitRuleDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered exit rule digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedTotal(): number {
    return Math.round((this.impressions + this.budget) * 100) / 100;
  }

  copy(): TieredExitRuleDigest {
    return new TieredExitRuleDigest(
      this.code,
      this.name,
      this.country,
      this.impressions,
      this.archived,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a tiered exit rule digest in status created. */
export function newTieredExitRuleDigest(code: string, name: string): TieredExitRuleDigest {
  return new TieredExitRuleDigest(code, name, "", 0, false, 0, "created");
}
