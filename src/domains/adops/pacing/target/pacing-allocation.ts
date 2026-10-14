import * as text from "../../../../kit/text.js";

/** Where a pacing allocation is in its life cycle. */
export type PacingAllocationStatus = "created" | "validated" | "published" | "retired";

/** A pacing allocation. Its code is unique within a tenant. */
export class PacingAllocation {
  code: string;
  name: string;
  campaignRef: string;
  notes: string;
  approved: boolean;
  createdAt: number;
  status: PacingAllocationStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    notes: string,
    approved: boolean,
    createdAt: number,
    status: PacingAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.notes = notes;
    this.approved = approved;
    this.createdAt = createdAt;
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

  canMoveTo(next: PacingAllocationStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PacingAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): PacingAllocation {
    return new PacingAllocation(
      this.code,
      this.name,
      this.campaignRef,
      this.notes,
      this.approved,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pacing allocation in status created. */
export function newPacingAllocation(code: string, name: string): PacingAllocation {
  return new PacingAllocation(code, name, "", "", false, 0, "created");
}
