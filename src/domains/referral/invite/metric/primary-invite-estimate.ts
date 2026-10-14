import * as text from "../../../../kit/text.js";

/** Where a primary invite estimate is in its life cycle. */
export type PrimaryInviteEstimateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A primary invite estimate. Its code is unique within a tenant. */
export class PrimaryInviteEstimate {
  code: string;
  name: string;
  ownerId: string;
  budget: number;
  conversionRate: number;
  priority: number;
  windowDays: number;
  floorValue: number;
  status: PrimaryInviteEstimateStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    budget: number,
    conversionRate: number,
    priority: number,
    windowDays: number,
    floorValue: number,
    status: PrimaryInviteEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.budget = budget;
    this.conversionRate = conversionRate;
    this.priority = priority;
    this.windowDays = windowDays;
    this.floorValue = floorValue;
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

  canMoveTo(next: PrimaryInviteEstimateStatus): boolean {
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
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryInviteEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary invite estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedVolume(): number {
    return Math.round((this.budget + this.priority) * 100) / 100;
  }

  copy(): PrimaryInviteEstimate {
    return new PrimaryInviteEstimate(
      this.code,
      this.name,
      this.ownerId,
      this.budget,
      this.conversionRate,
      this.priority,
      this.windowDays,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary invite estimate in status proposed. */
export function newPrimaryInviteEstimate(code: string, name: string): PrimaryInviteEstimate {
  return new PrimaryInviteEstimate(code, name, "", 0, 0, 0, 0, 0, "proposed");
}
