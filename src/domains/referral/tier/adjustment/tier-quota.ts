import * as text from "../../../../kit/text.js";

/** Where a tier quota is in its life cycle. */
export type TierQuotaStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A tier quota. Its code is unique within a tenant. */
export class TierQuota {
  code: string;
  name: string;
  pinned: boolean;
  endsAt: number;
  region: string;
  frequencyCap: number;
  status: TierQuotaStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    endsAt: number,
    region: string,
    frequencyCap: number,
    status: TierQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.endsAt = endsAt;
    this.region = region;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: TierQuotaStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TierQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tier quota"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.endsAt * this.frequencyCap * 100) / 100;
  }

  copy(): TierQuota {
    return new TierQuota(this.code, this.name, this.pinned, this.endsAt, this.region, this.frequencyCap, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a tier quota in status draft. */
export function newTierQuota(code: string, name: string): TierQuota {
  return new TierQuota(code, name, false, 0, "", 0, "draft");
}
