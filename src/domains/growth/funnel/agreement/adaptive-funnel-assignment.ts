import * as text from "../../../../kit/text.js";

/** Where a adaptive funnel assignment is in its life cycle. */
export type AdaptiveFunnelAssignmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One adaptive funnel assignment, with what the planners need to act on it. */
export class AdaptiveFunnelAssignment {
  code: string;
  label: string;
  unit: string;
  reviewer: string;
  utmSource: string;
  score: number;
  status: AdaptiveFunnelAssignmentStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    reviewer: string,
    utmSource: string,
    score: number,
    status: AdaptiveFunnelAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.reviewer = reviewer;
    this.utmSource = utmSource;
    this.score = score;
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

  canMoveTo(next: AdaptiveFunnelAssignmentStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "completed";
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

  moveTo(next: AdaptiveFunnelAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive funnel assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"adaptive funnel assignment"} ${this.code}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): AdaptiveFunnelAssignment {
    return new AdaptiveFunnelAssignment(
      this.code,
      this.label,
      this.unit,
      this.reviewer,
      this.utmSource,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a adaptive funnel assignment in status planned. */
export function newAdaptiveFunnelAssignment(code: string, label: string): AdaptiveFunnelAssignment {
  return new AdaptiveFunnelAssignment(code, label, "", "", "", 0, "planned");
}
