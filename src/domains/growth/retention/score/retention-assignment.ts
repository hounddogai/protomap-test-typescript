import * as text from "../../../../kit/text.js";

/** Where a retention assignment is in its life cycle. */
export type RetentionAssignmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a retention assignment and its current status. */
export class RetentionAssignment {
  code: string;
  label: string;
  ownerId: string;
  floorValue: number;
  minimum: number;
  status: RetentionAssignmentStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    floorValue: number,
    minimum: number,
    status: RetentionAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.floorValue = floorValue;
    this.minimum = minimum;
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

  canMoveTo(next: RetentionAssignmentStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RetentionAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netTotal(): number {
    return Math.round((this.minimum - this.floorValue) * 100) / 100;
  }

  copy(): RetentionAssignment {
    return new RetentionAssignment(this.code, this.label, this.ownerId, this.floorValue, this.minimum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a retention assignment in status planned. */
export function newRetentionAssignment(code: string, label: string): RetentionAssignment {
  return new RetentionAssignment(code, label, "", 0, 0, "planned");
}
