import * as text from "../../../../kit/text.js";

/** Where a rolling level assignment is in its life cycle. */
export type RollingLevelAssignmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A rolling level assignment as the level team keeps it. */
export class RollingLevelAssignment {
  code: string;
  name: string;
  externalRef: string;
  margin: number;
  summary: string;
  label: string;
  maximum: number;
  segment: string;
  limit: number;
  status: RollingLevelAssignmentStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    margin: number,
    summary: string,
    label: string,
    maximum: number,
    segment: string,
    limit: number,
    status: RollingLevelAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.margin = margin;
    this.summary = summary;
    this.label = label;
    this.maximum = maximum;
    this.segment = segment;
    this.limit = limit;
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

  canMoveTo(next: RollingLevelAssignmentStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingLevelAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling level assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"rolling level assignment"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.margin - this.maximum) * 100) / 100;
  }

  copy(): RollingLevelAssignment {
    return new RollingLevelAssignment(
      this.code,
      this.name,
      this.externalRef,
      this.margin,
      this.summary,
      this.label,
      this.maximum,
      this.segment,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a rolling level assignment in status planned. */
export function newRollingLevelAssignment(code: string, name: string): RollingLevelAssignment {
  return new RollingLevelAssignment(code, name, "", 0, "", "", 0, "", 0, "planned");
}
