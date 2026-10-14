import * as text from "../../../../kit/text.js";

/** Where a scheduled creative override is in its life cycle. */
export type ScheduledCreativeOverrideStatus = "requested" | "granted" | "revoked" | "expired";

/** A scheduled creative override as the creative team keeps it. */
export class ScheduledCreativeOverride {
  code: string;
  name: string;
  pinned: boolean;
  quantity: number;
  durationMinutes: number;
  status: ScheduledCreativeOverrideStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    quantity: number,
    durationMinutes: number,
    status: ScheduledCreativeOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.quantity = quantity;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: ScheduledCreativeOverrideStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledCreativeOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled creative override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round(this.durationMinutes * this.quantity * 100) / 100;
  }

  copy(): ScheduledCreativeOverride {
    return new ScheduledCreativeOverride(
      this.code,
      this.name,
      this.pinned,
      this.quantity,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled creative override in status requested. */
export function newScheduledCreativeOverride(code: string, name: string): ScheduledCreativeOverride {
  return new ScheduledCreativeOverride(code, name, false, 0, 0, "requested");
}
