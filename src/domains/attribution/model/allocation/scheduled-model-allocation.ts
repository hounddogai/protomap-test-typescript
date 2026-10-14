import * as text from "../../../../kit/text.js";

/** Where a scheduled model allocation is in its life cycle. */
export type ScheduledModelAllocationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a scheduled model allocation and its current status. */
export class ScheduledModelAllocation {
  code: string;
  name: string;
  phone: string;
  approved: boolean;
  summary: string;
  score: number;
  status: ScheduledModelAllocationStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    approved: boolean,
    summary: string,
    score: number,
    status: ScheduledModelAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.approved = approved;
    this.summary = summary;
    this.score = score;
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

  canMoveTo(next: ScheduledModelAllocationStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ScheduledModelAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled model allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"scheduled model allocation"} ${this.code}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): ScheduledModelAllocation {
    return new ScheduledModelAllocation(
      this.code,
      this.name,
      this.phone,
      this.approved,
      this.summary,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled model allocation in status proposed. */
export function newScheduledModelAllocation(code: string, name: string): ScheduledModelAllocation {
  return new ScheduledModelAllocation(code, name, "", false, "", 0, "proposed");
}
