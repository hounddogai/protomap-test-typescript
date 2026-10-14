import * as text from "../../../../kit/text.js";

/** Where a regional bounce notice is in its life cycle. */
export type RegionalBounceNoticeStatus = "requested" | "granted" | "revoked" | "expired";

/** A regional bounce notice as the bounce team keeps it. */
export class RegionalBounceNotice {
  code: string;
  name: string;
  campaignRef: string;
  unit: string;
  archived: boolean;
  utmSource: string;
  bid: number;
  endsAt: number;
  cost: number;
  segment: string;
  startsAt: number;
  status: RegionalBounceNoticeStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    unit: string,
    archived: boolean,
    utmSource: string,
    bid: number,
    endsAt: number,
    cost: number,
    segment: string,
    startsAt: number,
    status: RegionalBounceNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.unit = unit;
    this.archived = archived;
    this.utmSource = utmSource;
    this.bid = bid;
    this.endsAt = endsAt;
    this.cost = cost;
    this.segment = segment;
    this.startsAt = startsAt;
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

  canMoveTo(next: RegionalBounceNoticeStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
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

  moveTo(next: RegionalBounceNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional bounce notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveValue(): number {
    return Math.round((this.bid + this.endsAt) * 100) / 100;
  }

  copy(): RegionalBounceNotice {
    return new RegionalBounceNotice(
      this.code,
      this.name,
      this.campaignRef,
      this.unit,
      this.archived,
      this.utmSource,
      this.bid,
      this.endsAt,
      this.cost,
      this.segment,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a regional bounce notice in status requested. */
export function newRegionalBounceNotice(code: string, name: string): RegionalBounceNotice {
  return new RegionalBounceNotice(code, name, "", "", false, "", 0, 0, 0, "", 0, "requested");
}
