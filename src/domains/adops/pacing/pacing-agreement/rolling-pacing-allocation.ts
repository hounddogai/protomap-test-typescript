import * as text from "../../../../kit/text.js";

/** Where a rolling pacing allocation is in its life cycle. */
export type RollingPacingAllocationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a rolling pacing allocation and its current status. */
export class RollingPacingAllocation {
  code: string;
  label: string;
  ownerId: string;
  utmSource: string;
  checksum: string;
  maximum: number;
  status: RollingPacingAllocationStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    utmSource: string,
    checksum: string,
    maximum: number,
    status: RollingPacingAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.utmSource = utmSource;
    this.checksum = checksum;
    this.maximum = maximum;
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

  canMoveTo(next: RollingPacingAllocationStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
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

  moveTo(next: RollingPacingAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling pacing allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.maximum;
  }

  copy(): RollingPacingAllocation {
    return new RollingPacingAllocation(
      this.code,
      this.label,
      this.ownerId,
      this.utmSource,
      this.checksum,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a rolling pacing allocation in status open. */
export function newRollingPacingAllocation(code: string, label: string): RollingPacingAllocation {
  return new RollingPacingAllocation(code, label, "", "", "", 0, "open");
}
