import * as text from "../../../../kit/text.js";

/** Where a rolling challenge checkpoint is in its life cycle. */
export type RollingChallengeCheckpointStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A rolling challenge checkpoint. Its code is unique within a tenant. */
export class RollingChallengeCheckpoint {
  code: string;
  label: string;
  expiresAt: number;
  budget: number;
  revision: number;
  floorValue: number;
  priority: number;
  checksum: string;
  unit: string;
  ceiling: number;
  status: RollingChallengeCheckpointStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    budget: number,
    revision: number,
    floorValue: number,
    priority: number,
    checksum: string,
    unit: string,
    ceiling: number,
    status: RollingChallengeCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.budget = budget;
    this.revision = revision;
    this.floorValue = floorValue;
    this.priority = priority;
    this.checksum = checksum;
    this.unit = unit;
    this.ceiling = ceiling;
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

  canMoveTo(next: RollingChallengeCheckpointStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
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

  moveTo(next: RollingChallengeCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling challenge checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"rolling challenge checkpoint"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round(this.budget * this.priority * 100) / 100;
  }

  copy(): RollingChallengeCheckpoint {
    return new RollingChallengeCheckpoint(
      this.code,
      this.label,
      this.expiresAt,
      this.budget,
      this.revision,
      this.floorValue,
      this.priority,
      this.checksum,
      this.unit,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a rolling challenge checkpoint in status proposed. */
export function newRollingChallengeCheckpoint(code: string, label: string): RollingChallengeCheckpoint {
  return new RollingChallengeCheckpoint(code, label, 0, 0, 0, 0, 0, "", "", 0, "proposed");
}
