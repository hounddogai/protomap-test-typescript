import * as text from "../../../../kit/text.js";

/** Where a legacy proof cycle is in its life cycle. */
export type LegacyProofCycleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One legacy proof cycle, with what the planners need to act on it. */
export class LegacyProofCycle {
  code: string;
  label: string;
  contactEmail: string;
  maximum: number;
  ceiling: number;
  status: LegacyProofCycleStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    maximum: number,
    ceiling: number,
    status: LegacyProofCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.maximum = maximum;
    this.ceiling = ceiling;
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

  canMoveTo(next: LegacyProofCycleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyProofCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy proof cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedValue(): number {
    return Math.round((this.maximum + this.ceiling) * 100) / 100;
  }

  copy(): LegacyProofCycle {
    return new LegacyProofCycle(this.code, this.label, this.contactEmail, this.maximum, this.ceiling, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy proof cycle in status idle. */
export function newLegacyProofCycle(code: string, label: string): LegacyProofCycle {
  return new LegacyProofCycle(code, label, "", 0, 0, "idle");
}
