import * as text from "../../../../kit/text.js";

/** Where a regional reputation claim is in its life cycle. */
export type RegionalReputationClaimStatus = "new" | "queued" | "running" | "done" | "failed";

/** A regional reputation claim. Its code is unique within a tenant. */
export class RegionalReputationClaim {
  code: string;
  name: string;
  title: string;
  windowDays: number;
  createdAt: number;
  conversionRate: number;
  status: RegionalReputationClaimStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    windowDays: number,
    createdAt: number,
    conversionRate: number,
    status: RegionalReputationClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.windowDays = windowDays;
    this.createdAt = createdAt;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: RegionalReputationClaimStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RegionalReputationClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional reputation claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round(this.windowDays * this.conversionRate * 100) / 100;
  }

  copy(): RegionalReputationClaim {
    return new RegionalReputationClaim(
      this.code,
      this.name,
      this.title,
      this.windowDays,
      this.createdAt,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a regional reputation claim in status new. */
export function newRegionalReputationClaim(code: string, name: string): RegionalReputationClaim {
  return new RegionalReputationClaim(code, name, "", 0, 0, 0, "new");
}
