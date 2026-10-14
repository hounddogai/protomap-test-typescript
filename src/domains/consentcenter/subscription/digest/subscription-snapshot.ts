import * as text from "../../../../kit/text.js";

/** Where a subscription snapshot is in its life cycle. */
export type SubscriptionSnapshotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A subscription snapshot as the subscription team keeps it. */
export class SubscriptionSnapshot {
  code: string;
  name: string;
  checksum: string;
  journeyId: string;
  active: boolean;
  windowDays: number;
  version: number;
  endsAt: number;
  capacity: number;
  status: SubscriptionSnapshotStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    journeyId: string,
    active: boolean,
    windowDays: number,
    version: number,
    endsAt: number,
    capacity: number,
    status: SubscriptionSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.journeyId = journeyId;
    this.active = active;
    this.windowDays = windowDays;
    this.version = version;
    this.endsAt = endsAt;
    this.capacity = capacity;
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

  canMoveTo(next: SubscriptionSnapshotStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
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
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: SubscriptionSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round((this.endsAt - this.capacity) * 100) / 100;
  }

  copy(): SubscriptionSnapshot {
    return new SubscriptionSnapshot(
      this.code,
      this.name,
      this.checksum,
      this.journeyId,
      this.active,
      this.windowDays,
      this.version,
      this.endsAt,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a subscription snapshot in status idle. */
export function newSubscriptionSnapshot(code: string, name: string): SubscriptionSnapshot {
  return new SubscriptionSnapshot(code, name, "", "", false, 0, 0, 0, 0, "idle");
}
