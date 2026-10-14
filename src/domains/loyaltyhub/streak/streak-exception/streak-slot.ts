import * as text from "../../../../kit/text.js";

/** Where a streak slot is in its life cycle. */
export type StreakSlotStatus = "requested" | "granted" | "revoked" | "expired";

/** A streak slot. Its code is unique within a tenant. */
export class StreakSlot {
  code: string;
  title: string;
  region: string;
  label: string;
  floorValue: number;
  sendAt: number;
  revision: number;
  capacity: number;
  status: StreakSlotStatus;

  constructor(
    code: string,
    title: string,
    region: string,
    label: string,
    floorValue: number,
    sendAt: number,
    revision: number,
    capacity: number,
    status: StreakSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.label = label;
    this.floorValue = floorValue;
    this.sendAt = sendAt;
    this.revision = revision;
    this.capacity = capacity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: StreakSlotStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: StreakSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedLoad(): number {
    return Math.round((this.capacity + this.floorValue) * 100) / 100;
  }

  copy(): StreakSlot {
    return new StreakSlot(
      this.code,
      this.title,
      this.region,
      this.label,
      this.floorValue,
      this.sendAt,
      this.revision,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a streak slot in status requested. */
export function newStreakSlot(code: string, title: string): StreakSlot {
  return new StreakSlot(code, title, "", "", 0, 0, 0, 0, "requested");
}
