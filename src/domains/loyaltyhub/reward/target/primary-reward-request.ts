import * as text from "../../../../kit/text.js";

/** Where a primary reward request is in its life cycle. */
export type PrimaryRewardRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A primary reward request as the reward team keeps it. */
export class PrimaryRewardRequest {
  code: string;
  name: string;
  batchSize: number;
  variant: string;
  graceDays: number;
  status: PrimaryRewardRequestStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    variant: string,
    graceDays: number,
    status: PrimaryRewardRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.variant = variant;
    this.graceDays = graceDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryRewardRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PrimaryRewardRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary reward request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round((this.batchSize + this.graceDays) * 100) / 100;
  }

  copy(): PrimaryRewardRequest {
    return new PrimaryRewardRequest(this.code, this.name, this.batchSize, this.variant, this.graceDays, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary reward request in status draft. */
export function newPrimaryRewardRequest(code: string, name: string): PrimaryRewardRequest {
  return new PrimaryRewardRequest(code, name, 0, "", 0, "draft");
}
