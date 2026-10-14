/**
 * The branch request records of journeys's branch work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a branch request is in its life cycle. */
export type BranchRequestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A branch request. Its code is unique within a tenant. */
export class BranchRequest {
  code: string;
  title: string;
  approved: boolean;
  weight: number;
  notes: string;
  country: string;
  status: BranchRequestStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    weight: number,
    notes: string,
    country: string,
    status: BranchRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.weight = weight;
    this.notes = notes;
    this.country = country;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: BranchRequestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BranchRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.weight;
  }

  copy(): BranchRequest {
    return new BranchRequest(this.code, this.title, this.approved, this.weight, this.notes, this.country, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a branch request in status planned. */
export function newBranchRequest(code: string, title: string): BranchRequest {
  return new BranchRequest(code, title, false, 0, "", "", "planned");
}
