import * as text from "../../../../kit/text.js";

/** Where a legacy invite adjustment is in its life cycle. */
export type LegacyInviteAdjustmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One legacy invite adjustment, with what the planners need to act on it. */
export class LegacyInviteAdjustment {
  code: string;
  name: string;
  minimum: number;
  cohort: string;
  contactEmail: string;
  status: LegacyInviteAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    cohort: string,
    contactEmail: string,
    status: LegacyInviteAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.cohort = cohort;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: LegacyInviteAdjustmentStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LegacyInviteAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy invite adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"legacy invite adjustment"} ${this.code}`;
  }

  measuredValue(): number {
    return this.minimum;
  }

  copy(): LegacyInviteAdjustment {
    return new LegacyInviteAdjustment(this.code, this.name, this.minimum, this.cohort, this.contactEmail, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a legacy invite adjustment in status idle. */
export function newLegacyInviteAdjustment(code: string, name: string): LegacyInviteAdjustment {
  return new LegacyInviteAdjustment(code, name, 0, "", "", "idle");
}
