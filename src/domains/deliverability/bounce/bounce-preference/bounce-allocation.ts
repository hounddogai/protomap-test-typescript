import * as text from "../../../../kit/text.js";

/** Where a bounce allocation is in its life cycle. */
export type BounceAllocationStatus = "created" | "validated" | "published" | "retired";

/** The record of a bounce allocation and its current status. */
export class BounceAllocation {
  code: string;
  label: string;
  ratio: number;
  journeyId: string;
  contactEmail: string;
  cohort: string;
  status: BounceAllocationStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    journeyId: string,
    contactEmail: string,
    cohort: string,
    status: BounceAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.journeyId = journeyId;
    this.contactEmail = contactEmail;
    this.cohort = cohort;
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

  canMoveTo(next: BounceAllocationStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BounceAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.ratio;
  }

  copy(): BounceAllocation {
    return new BounceAllocation(
      this.code,
      this.label,
      this.ratio,
      this.journeyId,
      this.contactEmail,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a bounce allocation in status created. */
export function newBounceAllocation(code: string, label: string): BounceAllocation {
  return new BounceAllocation(code, label, 0, "", "", "", "created");
}
