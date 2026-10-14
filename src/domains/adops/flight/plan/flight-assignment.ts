import * as text from "../../../../kit/text.js";

/** Where a flight assignment is in its life cycle. */
export type FlightAssignmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a flight assignment and its current status. */
export class FlightAssignment {
  code: string;
  title: string;
  batchSize: number;
  budget: number;
  pinned: boolean;
  reviewer: string;
  cost: number;
  archived: boolean;
  visible: boolean;
  startsAt: number;
  checksum: string;
  status: FlightAssignmentStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    budget: number,
    pinned: boolean,
    reviewer: string,
    cost: number,
    archived: boolean,
    visible: boolean,
    startsAt: number,
    checksum: string,
    status: FlightAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.budget = budget;
    this.pinned = pinned;
    this.reviewer = reviewer;
    this.cost = cost;
    this.archived = archived;
    this.visible = visible;
    this.startsAt = startsAt;
    this.checksum = checksum;
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

  canMoveTo(next: FlightAssignmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FlightAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedValue(): number {
    return Math.round(this.budget * this.cost * 100) / 100;
  }

  copy(): FlightAssignment {
    return new FlightAssignment(
      this.code,
      this.title,
      this.batchSize,
      this.budget,
      this.pinned,
      this.reviewer,
      this.cost,
      this.archived,
      this.visible,
      this.startsAt,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a flight assignment in status proposed. */
export function newFlightAssignment(code: string, title: string): FlightAssignment {
  return new FlightAssignment(code, title, 0, 0, false, "", 0, false, false, 0, "", "proposed");
}
