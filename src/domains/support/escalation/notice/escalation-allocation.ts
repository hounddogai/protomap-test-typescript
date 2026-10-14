import * as text from "../../../../kit/text.js";

/** Where a escalation allocation is in its life cycle. */
export type EscalationAllocationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One escalation allocation, with what the planners need to act on it. */
export class EscalationAllocation {
  code: string;
  name: string;
  segment: string;
  approved: boolean;
  capacity: number;
  audienceId: string;
  cost: number;
  limit: number;
  floorValue: number;
  weight: number;
  status: EscalationAllocationStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    approved: boolean,
    capacity: number,
    audienceId: string,
    cost: number,
    limit: number,
    floorValue: number,
    weight: number,
    status: EscalationAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.approved = approved;
    this.capacity = capacity;
    this.audienceId = audienceId;
    this.cost = cost;
    this.limit = limit;
    this.floorValue = floorValue;
    this.weight = weight;
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

  canMoveTo(next: EscalationAllocationStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EscalationAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedVolume(): number {
    return Math.round(this.cost * this.floorValue * 100) / 100;
  }

  copy(): EscalationAllocation {
    return new EscalationAllocation(
      this.code,
      this.name,
      this.segment,
      this.approved,
      this.capacity,
      this.audienceId,
      this.cost,
      this.limit,
      this.floorValue,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a escalation allocation in status open. */
export function newEscalationAllocation(code: string, name: string): EscalationAllocation {
  return new EscalationAllocation(code, name, "", false, 0, "", 0, 0, 0, 0, "open");
}
