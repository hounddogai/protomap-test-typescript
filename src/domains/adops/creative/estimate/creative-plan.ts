import * as text from "../../../../kit/text.js";

/** Where a creative plan is in its life cycle. */
export type CreativePlanStatus = "requested" | "granted" | "revoked" | "expired";

/** A creative plan as the creative team keeps it. */
export class CreativePlan {
  code: string;
  title: string;
  campaignRef: string;
  version: number;
  bid: number;
  rate: number;
  windowDays: number;
  expiresAt: number;
  startsAt: number;
  notes: string;
  minimum: number;
  status: CreativePlanStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    version: number,
    bid: number,
    rate: number,
    windowDays: number,
    expiresAt: number,
    startsAt: number,
    notes: string,
    minimum: number,
    status: CreativePlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.version = version;
    this.bid = bid;
    this.rate = rate;
    this.windowDays = windowDays;
    this.expiresAt = expiresAt;
    this.startsAt = startsAt;
    this.notes = notes;
    this.minimum = minimum;
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

  canMoveTo(next: CreativePlanStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreativePlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedVolume(): number {
    return Math.round((this.bid - this.expiresAt) * 100) / 100;
  }

  copy(): CreativePlan {
    return new CreativePlan(
      this.code,
      this.title,
      this.campaignRef,
      this.version,
      this.bid,
      this.rate,
      this.windowDays,
      this.expiresAt,
      this.startsAt,
      this.notes,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a creative plan in status requested. */
export function newCreativePlan(code: string, title: string): CreativePlan {
  return new CreativePlan(code, title, "", 0, 0, 0, 0, 0, 0, "", 0, "requested");
}
