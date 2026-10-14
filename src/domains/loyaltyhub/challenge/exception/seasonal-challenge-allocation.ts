import * as text from "../../../../kit/text.js";

/** Where a seasonal challenge allocation is in its life cycle. */
export type SeasonalChallengeAllocationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A seasonal challenge allocation as the challenge team keeps it. */
export class SeasonalChallengeAllocation {
  code: string;
  name: string;
  frequencyCap: number;
  revision: number;
  active: boolean;
  version: number;
  region: string;
  amount: number;
  status: SeasonalChallengeAllocationStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    revision: number,
    active: boolean,
    version: number,
    region: string,
    amount: number,
    status: SeasonalChallengeAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.revision = revision;
    this.active = active;
    this.version = version;
    this.region = region;
    this.amount = amount;
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

  canMoveTo(next: SeasonalChallengeAllocationStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: SeasonalChallengeAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal challenge allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"seasonal challenge allocation"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.revision + this.version) * 100) / 100;
  }

  copy(): SeasonalChallengeAllocation {
    return new SeasonalChallengeAllocation(
      this.code,
      this.name,
      this.frequencyCap,
      this.revision,
      this.active,
      this.version,
      this.region,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a seasonal challenge allocation in status open. */
export function newSeasonalChallengeAllocation(code: string, name: string): SeasonalChallengeAllocation {
  return new SeasonalChallengeAllocation(code, name, 0, 0, false, 0, "", 0, "open");
}
