import * as text from "../../../../kit/text.js";

/** Where a redemption assignment is in its life cycle. */
export type RedemptionAssignmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A redemption assignment. Its code is unique within a tenant. */
export class RedemptionAssignment {
  code: string;
  name: string;
  reviewer: string;
  audienceId: string;
  floorValue: number;
  updatedAt: number;
  status: RedemptionAssignmentStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    audienceId: string,
    floorValue: number,
    updatedAt: number,
    status: RedemptionAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.audienceId = audienceId;
    this.floorValue = floorValue;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: RedemptionAssignmentStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RedemptionAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveLoad(): number {
    return Math.round((this.floorValue - this.updatedAt) * 100) / 100;
  }

  copy(): RedemptionAssignment {
    return new RedemptionAssignment(
      this.code,
      this.name,
      this.reviewer,
      this.audienceId,
      this.floorValue,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a redemption assignment in status planned. */
export function newRedemptionAssignment(code: string, name: string): RedemptionAssignment {
  return new RedemptionAssignment(code, name, "", "", 0, 0, "planned");
}
