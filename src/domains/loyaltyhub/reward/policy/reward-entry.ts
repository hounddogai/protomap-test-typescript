import * as text from "../../../../kit/text.js";

/** Where a reward entry is in its life cycle. */
export type RewardEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A reward entry. Its code is unique within a tenant. */
export class RewardEntry {
  code: string;
  name: string;
  campaignRef: string;
  budget: number;
  discount: number;
  ownerId: string;
  version: number;
  attempts: number;
  status: RewardEntryStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    budget: number,
    discount: number,
    ownerId: string,
    version: number,
    attempts: number,
    status: RewardEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.budget = budget;
    this.discount = discount;
    this.ownerId = ownerId;
    this.version = version;
    this.attempts = attempts;
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

  canMoveTo(next: RewardEntryStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RewardEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netLoad(): number {
    return Math.round((this.attempts - this.budget) * 100) / 100;
  }

  copy(): RewardEntry {
    return new RewardEntry(
      this.code,
      this.name,
      this.campaignRef,
      this.budget,
      this.discount,
      this.ownerId,
      this.version,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reward entry in status open. */
export function newRewardEntry(code: string, name: string): RewardEntry {
  return new RewardEntry(code, name, "", 0, 0, "", 0, 0, "open");
}
