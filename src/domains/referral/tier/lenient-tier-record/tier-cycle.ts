import * as text from "../../../../kit/text.js";

/** Where a tier cycle is in its life cycle. */
export type TierCycleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A tier cycle as the tier team keeps it. */
export class TierCycle {
  code: string;
  title: string;
  impressions: number;
  contactEmail: string;
  version: number;
  utmSource: string;
  source: string;
  budget: number;
  status: TierCycleStatus;

  constructor(
    code: string,
    title: string,
    impressions: number,
    contactEmail: string,
    version: number,
    utmSource: string,
    source: string,
    budget: number,
    status: TierCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.contactEmail = contactEmail;
    this.version = version;
    this.utmSource = utmSource;
    this.source = source;
    this.budget = budget;
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

  canMoveTo(next: TierCycleStatus): boolean {
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
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: TierCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"tier cycle"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.impressions + this.budget) * 100) / 100;
  }

  copy(): TierCycle {
    return new TierCycle(
      this.code,
      this.title,
      this.impressions,
      this.contactEmail,
      this.version,
      this.utmSource,
      this.source,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a tier cycle in status draft. */
export function newTierCycle(code: string, title: string): TierCycle {
  return new TierCycle(code, title, 0, "", 0, "", "", 0, "draft");
}
