import * as text from "../../../../kit/text.js";

/** Where a lenient enrollment slot is in its life cycle. */
export type LenientEnrollmentSlotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A lenient enrollment slot. Its code is unique within a tenant. */
export class LenientEnrollmentSlot {
  code: string;
  name: string;
  margin: number;
  endsAt: number;
  impressions: number;
  status: LenientEnrollmentSlotStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    endsAt: number,
    impressions: number,
    status: LenientEnrollmentSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.endsAt = endsAt;
    this.impressions = impressions;
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

  canMoveTo(next: LenientEnrollmentSlotStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LenientEnrollmentSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient enrollment slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netLoad(): number {
    return Math.round((this.endsAt - this.impressions) * 100) / 100;
  }

  copy(): LenientEnrollmentSlot {
    return new LenientEnrollmentSlot(this.code, this.name, this.margin, this.endsAt, this.impressions, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient enrollment slot in status idle. */
export function newLenientEnrollmentSlot(code: string, name: string): LenientEnrollmentSlot {
  return new LenientEnrollmentSlot(code, name, 0, 0, 0, "idle");
}
