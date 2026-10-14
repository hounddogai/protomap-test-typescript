import * as text from "../../../../kit/text.js";

/** Where a rolling nudge checkpoint is in its life cycle. */
export type RollingNudgeCheckpointStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a rolling nudge checkpoint and its current status. */
export class RollingNudgeCheckpoint {
  code: string;
  name: string;
  checksum: string;
  openRate: number;
  bid: number;
  minimum: number;
  tags: string[];
  budget: number;
  maximum: number;
  expiresAt: number;
  status: RollingNudgeCheckpointStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    openRate: number,
    bid: number,
    minimum: number,
    tags: string[],
    budget: number,
    maximum: number,
    expiresAt: number,
    status: RollingNudgeCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.openRate = openRate;
    this.bid = bid;
    this.minimum = minimum;
    this.tags = tags;
    this.budget = budget;
    this.maximum = maximum;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: RollingNudgeCheckpointStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
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

  moveTo(next: RollingNudgeCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling nudge checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round(this.bid * this.budget * 100) / 100;
  }

  copy(): RollingNudgeCheckpoint {
    return new RollingNudgeCheckpoint(
      this.code,
      this.name,
      this.checksum,
      this.openRate,
      this.bid,
      this.minimum,
      this.tags,
      this.budget,
      this.maximum,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling nudge checkpoint in status proposed. */
export function newRollingNudgeCheckpoint(code: string, name: string): RollingNudgeCheckpoint {
  return new RollingNudgeCheckpoint(code, name, "", 0, 0, 0, [], 0, 0, 0, "proposed");
}
