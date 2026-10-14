import * as text from "../../../../kit/text.js";

/** Where a primary touchpoint assignment is in its life cycle. */
export type PrimaryTouchpointAssignmentStatus = "created" | "validated" | "published" | "retired";

/** One primary touchpoint assignment, with what the planners need to act on it. */
export class PrimaryTouchpointAssignment {
  code: string;
  name: string;
  frequencyCap: number;
  endsAt: number;
  active: boolean;
  amount: number;
  status: PrimaryTouchpointAssignmentStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    endsAt: number,
    active: boolean,
    amount: number,
    status: PrimaryTouchpointAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.endsAt = endsAt;
    this.active = active;
    this.amount = amount;
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

  canMoveTo(next: PrimaryTouchpointAssignmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PrimaryTouchpointAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary touchpoint assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"primary touchpoint assignment"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.frequencyCap - this.amount) * 100) / 100;
  }

  copy(): PrimaryTouchpointAssignment {
    return new PrimaryTouchpointAssignment(
      this.code,
      this.name,
      this.frequencyCap,
      this.endsAt,
      this.active,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary touchpoint assignment in status created. */
export function newPrimaryTouchpointAssignment(code: string, name: string): PrimaryTouchpointAssignment {
  return new PrimaryTouchpointAssignment(code, name, 0, 0, false, 0, "created");
}
