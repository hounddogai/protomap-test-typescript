import * as text from "../../../../kit/text.js";

/** Where a global pacing allocation is in its life cycle. */
export type GlobalPacingAllocationStatus = "requested" | "granted" | "revoked" | "expired";

/** A global pacing allocation as the pacing team keeps it. */
export class GlobalPacingAllocation {
  code: string;
  name: string;
  budget: number;
  minimum: number;
  startsAt: number;
  updatedAt: number;
  status: GlobalPacingAllocationStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    minimum: number,
    startsAt: number,
    updatedAt: number,
    status: GlobalPacingAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.minimum = minimum;
    this.startsAt = startsAt;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: GlobalPacingAllocationStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: GlobalPacingAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global pacing allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round((this.budget - this.startsAt) * 100) / 100;
  }

  copy(): GlobalPacingAllocation {
    return new GlobalPacingAllocation(
      this.code,
      this.name,
      this.budget,
      this.minimum,
      this.startsAt,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global pacing allocation in status requested. */
export function newGlobalPacingAllocation(code: string, name: string): GlobalPacingAllocation {
  return new GlobalPacingAllocation(code, name, 0, 0, 0, 0, "requested");
}
