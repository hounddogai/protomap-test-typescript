import * as text from "../../../../kit/text.js";

/** Where a tiered pacing request is in its life cycle. */
export type TieredPacingRequestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A tiered pacing request. Its code is unique within a tenant. */
export class TieredPacingRequest {
  code: string;
  name: string;
  budget: number;
  timezone: string;
  durationMinutes: number;
  amount: number;
  impressions: number;
  discount: number;
  sendAt: number;
  cohort: string;
  windowDays: number;
  status: TieredPacingRequestStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    timezone: string,
    durationMinutes: number,
    amount: number,
    impressions: number,
    discount: number,
    sendAt: number,
    cohort: string,
    windowDays: number,
    status: TieredPacingRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.timezone = timezone;
    this.durationMinutes = durationMinutes;
    this.amount = amount;
    this.impressions = impressions;
    this.discount = discount;
    this.sendAt = sendAt;
    this.cohort = cohort;
    this.windowDays = windowDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredPacingRequestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredPacingRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered pacing request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round(this.windowDays * this.budget * 100) / 100;
  }

  copy(): TieredPacingRequest {
    return new TieredPacingRequest(
      this.code,
      this.name,
      this.budget,
      this.timezone,
      this.durationMinutes,
      this.amount,
      this.impressions,
      this.discount,
      this.sendAt,
      this.cohort,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered pacing request in status new. */
export function newTieredPacingRequest(code: string, name: string): TieredPacingRequest {
  return new TieredPacingRequest(code, name, 0, "", 0, 0, 0, 0, 0, "", 0, "new");
}
