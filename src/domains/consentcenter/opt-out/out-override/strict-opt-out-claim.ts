import * as text from "../../../../kit/text.js";

/** Where a strict opt out claim is in its life cycle. */
export type StrictOptOutClaimStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A strict opt out claim as the opt out team keeps it. */
export class StrictOptOutClaim {
  code: string;
  name: string;
  clicks: number;
  budget: number;
  source: string;
  title: string;
  rate: number;
  status: StrictOptOutClaimStatus;

  constructor(
    code: string,
    name: string,
    clicks: number,
    budget: number,
    source: string,
    title: string,
    rate: number,
    status: StrictOptOutClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.budget = budget;
    this.source = source;
    this.title = title;
    this.rate = rate;
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

  canMoveTo(next: StrictOptOutClaimStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: StrictOptOutClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict opt out claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveVolume(): number {
    return Math.round((this.budget + this.clicks) * 100) / 100;
  }

  copy(): StrictOptOutClaim {
    return new StrictOptOutClaim(
      this.code,
      this.name,
      this.clicks,
      this.budget,
      this.source,
      this.title,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a strict opt out claim in status open. */
export function newStrictOptOutClaim(code: string, name: string): StrictOptOutClaim {
  return new StrictOptOutClaim(code, name, 0, 0, "", "", 0, "open");
}
