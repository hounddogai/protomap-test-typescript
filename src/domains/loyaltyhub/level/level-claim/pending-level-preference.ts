import * as text from "../../../../kit/text.js";

/** Where a pending level preference is in its life cycle. */
export type PendingLevelPreferenceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A pending level preference as the level team keeps it. */
export class PendingLevelPreference {
  code: string;
  name: string;
  channel: string;
  endsAt: number;
  journeyId: string;
  discount: number;
  batchSize: number;
  limit: number;
  bid: number;
  status: PendingLevelPreferenceStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    endsAt: number,
    journeyId: string,
    discount: number,
    batchSize: number,
    limit: number,
    bid: number,
    status: PendingLevelPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.endsAt = endsAt;
    this.journeyId = journeyId;
    this.discount = discount;
    this.batchSize = batchSize;
    this.limit = limit;
    this.bid = bid;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingLevelPreferenceStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingLevelPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending level preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveValue(): number {
    return Math.round((this.batchSize + this.discount) * 100) / 100;
  }

  copy(): PendingLevelPreference {
    return new PendingLevelPreference(
      this.code,
      this.name,
      this.channel,
      this.endsAt,
      this.journeyId,
      this.discount,
      this.batchSize,
      this.limit,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a pending level preference in status idle. */
export function newPendingLevelPreference(code: string, name: string): PendingLevelPreference {
  return new PendingLevelPreference(code, name, "", 0, "", 0, 0, 0, 0, "idle");
}
