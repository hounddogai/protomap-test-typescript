import * as text from "../../../../kit/text.js";

/** Where a rolling sender request is in its life cycle. */
export type RollingSenderRequestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A rolling sender request. Its code is unique within a tenant. */
export class RollingSenderRequest {
  code: string;
  name: string;
  impressions: number;
  channel: string;
  country: string;
  pinned: boolean;
  conversionRate: number;
  sendAt: number;
  budget: number;
  createdAt: number;
  status: RollingSenderRequestStatus;

  constructor(
    code: string,
    name: string,
    impressions: number,
    channel: string,
    country: string,
    pinned: boolean,
    conversionRate: number,
    sendAt: number,
    budget: number,
    createdAt: number,
    status: RollingSenderRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.impressions = impressions;
    this.channel = channel;
    this.country = country;
    this.pinned = pinned;
    this.conversionRate = conversionRate;
    this.sendAt = sendAt;
    this.budget = budget;
    this.createdAt = createdAt;
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

  canMoveTo(next: RollingSenderRequestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingSenderRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling sender request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedTotal(): number {
    return Math.round((this.conversionRate + this.sendAt) * 100) / 100;
  }

  copy(): RollingSenderRequest {
    return new RollingSenderRequest(
      this.code,
      this.name,
      this.impressions,
      this.channel,
      this.country,
      this.pinned,
      this.conversionRate,
      this.sendAt,
      this.budget,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a rolling sender request in status planned. */
export function newRollingSenderRequest(code: string, name: string): RollingSenderRequest {
  return new RollingSenderRequest(code, name, 0, "", "", false, 0, 0, 0, 0, "planned");
}
