import * as text from "../../../../kit/text.js";

/** Where a capped payout schedule is in its life cycle. */
export type CappedPayoutScheduleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A capped payout schedule as the payout team keeps it. */
export class CappedPayoutSchedule {
  code: string;
  name: string;
  score: number;
  weight: number;
  startsAt: number;
  durationMinutes: number;
  notes: string;
  externalRef: string;
  region: string;
  threshold: number;
  status: CappedPayoutScheduleStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    weight: number,
    startsAt: number,
    durationMinutes: number,
    notes: string,
    externalRef: string,
    region: string,
    threshold: number,
    status: CappedPayoutScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.weight = weight;
    this.startsAt = startsAt;
    this.durationMinutes = durationMinutes;
    this.notes = notes;
    this.externalRef = externalRef;
    this.region = region;
    this.threshold = threshold;
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

  canMoveTo(next: CappedPayoutScheduleStatus): boolean {
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
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: CappedPayoutScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped payout schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"capped payout schedule"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round(this.score * this.threshold * 100) / 100;
  }

  copy(): CappedPayoutSchedule {
    return new CappedPayoutSchedule(
      this.code,
      this.name,
      this.score,
      this.weight,
      this.startsAt,
      this.durationMinutes,
      this.notes,
      this.externalRef,
      this.region,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a capped payout schedule in status idle. */
export function newCappedPayoutSchedule(code: string, name: string): CappedPayoutSchedule {
  return new CappedPayoutSchedule(code, name, 0, 0, 0, 0, "", "", "", 0, "idle");
}
