import * as text from "../../../../kit/text.js";

/** Where a reputation allocation is in its life cycle. */
export type ReputationAllocationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One reputation allocation, with what the planners need to act on it. */
export class ReputationAllocation {
  code: string;
  name: string;
  notes: string;
  active: boolean;
  impressions: number;
  summary: string;
  contactEmail: string;
  graceDays: number;
  segment: string;
  status: ReputationAllocationStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    active: boolean,
    impressions: number,
    summary: string,
    contactEmail: string,
    graceDays: number,
    segment: string,
    status: ReputationAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.active = active;
    this.impressions = impressions;
    this.summary = summary;
    this.contactEmail = contactEmail;
    this.graceDays = graceDays;
    this.segment = segment;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReputationAllocationStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ReputationAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveValue(): number {
    return Math.round((this.graceDays - this.impressions) * 100) / 100;
  }

  copy(): ReputationAllocation {
    return new ReputationAllocation(
      this.code,
      this.name,
      this.notes,
      this.active,
      this.impressions,
      this.summary,
      this.contactEmail,
      this.graceDays,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a reputation allocation in status proposed. */
export function newReputationAllocation(code: string, name: string): ReputationAllocation {
  return new ReputationAllocation(code, name, "", false, 0, "", "", 0, "", "proposed");
}
