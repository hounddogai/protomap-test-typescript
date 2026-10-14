import * as text from "../../../../kit/text.js";

/** Where a capped flight cycle is in its life cycle. */
export type CappedFlightCycleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One capped flight cycle, with what the planners need to act on it. */
export class CappedFlightCycle {
  code: string;
  label: string;
  active: boolean;
  margin: number;
  category: string;
  variant: string;
  durationMinutes: number;
  attempts: number;
  segment: string;
  frequencyCap: number;
  sendAt: number;
  status: CappedFlightCycleStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    margin: number,
    category: string,
    variant: string,
    durationMinutes: number,
    attempts: number,
    segment: string,
    frequencyCap: number,
    sendAt: number,
    status: CappedFlightCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.margin = margin;
    this.category = category;
    this.variant = variant;
    this.durationMinutes = durationMinutes;
    this.attempts = attempts;
    this.segment = segment;
    this.frequencyCap = frequencyCap;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedFlightCycleStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: CappedFlightCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped flight cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netExposure(): number {
    return Math.round((this.frequencyCap - this.attempts) * 100) / 100;
  }

  copy(): CappedFlightCycle {
    return new CappedFlightCycle(
      this.code,
      this.label,
      this.active,
      this.margin,
      this.category,
      this.variant,
      this.durationMinutes,
      this.attempts,
      this.segment,
      this.frequencyCap,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a capped flight cycle in status draft. */
export function newCappedFlightCycle(code: string, label: string): CappedFlightCycle {
  return new CappedFlightCycle(code, label, false, 0, "", "", 0, 0, "", 0, 0, "draft");
}
