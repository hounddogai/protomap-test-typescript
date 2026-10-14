import * as text from "../../../../kit/text.js";

/** Where a regional csat claim is in its life cycle. */
export type RegionalCsatClaimStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a regional csat claim and its current status. */
export class RegionalCsatClaim {
  code: string;
  name: string;
  tags: string[];
  variant: string;
  capacity: number;
  audienceId: string;
  currency: string;
  revision: number;
  budget: number;
  status: RegionalCsatClaimStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    variant: string,
    capacity: number,
    audienceId: string,
    currency: string,
    revision: number,
    budget: number,
    status: RegionalCsatClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.variant = variant;
    this.capacity = capacity;
    this.audienceId = audienceId;
    this.currency = currency;
    this.revision = revision;
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

  canMoveTo(next: RegionalCsatClaimStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RegionalCsatClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional csat claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"regional csat claim"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedVolume(): number {
    return Math.round((this.capacity - this.budget) * 100) / 100;
  }

  copy(): RegionalCsatClaim {
    return new RegionalCsatClaim(
      this.code,
      this.name,
      this.tags,
      this.variant,
      this.capacity,
      this.audienceId,
      this.currency,
      this.revision,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a regional csat claim in status draft. */
export function newRegionalCsatClaim(code: string, name: string): RegionalCsatClaim {
  return new RegionalCsatClaim(code, name, [], "", 0, "", "", 0, 0, "draft");
}
