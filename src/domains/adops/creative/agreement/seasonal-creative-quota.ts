import * as text from "../../../../kit/text.js";

/** Where a seasonal creative quota is in its life cycle. */
export type SeasonalCreativeQuotaStatus = "new" | "queued" | "running" | "done" | "failed";

/** One seasonal creative quota, with what the planners need to act on it. */
export class SeasonalCreativeQuota {
  code: string;
  label: string;
  startsAt: number;
  windowDays: number;
  expiresAt: number;
  contactEmail: string;
  bid: number;
  status: SeasonalCreativeQuotaStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    windowDays: number,
    expiresAt: number,
    contactEmail: string,
    bid: number,
    status: SeasonalCreativeQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.windowDays = windowDays;
    this.expiresAt = expiresAt;
    this.contactEmail = contactEmail;
    this.bid = bid;
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

  canMoveTo(next: SeasonalCreativeQuotaStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: SeasonalCreativeQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal creative quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedVolume(): number {
    return Math.round((this.bid + this.expiresAt) * 100) / 100;
  }

  copy(): SeasonalCreativeQuota {
    return new SeasonalCreativeQuota(
      this.code,
      this.label,
      this.startsAt,
      this.windowDays,
      this.expiresAt,
      this.contactEmail,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a seasonal creative quota in status new. */
export function newSeasonalCreativeQuota(code: string, label: string): SeasonalCreativeQuota {
  return new SeasonalCreativeQuota(code, label, 0, 0, 0, "", 0, "new");
}
