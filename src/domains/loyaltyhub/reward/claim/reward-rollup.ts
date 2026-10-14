import * as text from "../../../../kit/text.js";

/** Where a reward rollup is in its life cycle. */
export type RewardRollupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A reward rollup as the reward team keeps it. */
export class RewardRollup {
  code: string;
  name: string;
  retries: number;
  contactEmail: string;
  weight: number;
  capacity: number;
  journeyId: string;
  status: RewardRollupStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    contactEmail: string,
    weight: number,
    capacity: number,
    journeyId: string,
    status: RewardRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.contactEmail = contactEmail;
    this.weight = weight;
    this.capacity = capacity;
    this.journeyId = journeyId;
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

  canMoveTo(next: RewardRollupStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RewardRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round(this.retries * this.weight * 100) / 100;
  }

  copy(): RewardRollup {
    return new RewardRollup(
      this.code,
      this.name,
      this.retries,
      this.contactEmail,
      this.weight,
      this.capacity,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reward rollup in status proposed. */
export function newRewardRollup(code: string, name: string): RewardRollup {
  return new RewardRollup(code, name, 0, "", 0, 0, "", "proposed");
}
