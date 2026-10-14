import * as text from "../../../../kit/text.js";

/** Where a placement cycle is in its life cycle. */
export type PlacementCycleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A placement cycle. Its code is unique within a tenant. */
export class PlacementCycle {
  code: string;
  name: string;
  floorValue: number;
  campaignRef: string;
  utmSource: string;
  endsAt: number;
  bid: number;
  revision: number;
  rate: number;
  clicks: number;
  status: PlacementCycleStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    campaignRef: string,
    utmSource: string,
    endsAt: number,
    bid: number,
    revision: number,
    rate: number,
    clicks: number,
    status: PlacementCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.campaignRef = campaignRef;
    this.utmSource = utmSource;
    this.endsAt = endsAt;
    this.bid = bid;
    this.revision = revision;
    this.rate = rate;
    this.clicks = clicks;
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

  canMoveTo(next: PlacementCycleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PlacementCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedTotal(): number {
    return Math.round((this.endsAt - this.floorValue) * 100) / 100;
  }

  copy(): PlacementCycle {
    return new PlacementCycle(
      this.code,
      this.name,
      this.floorValue,
      this.campaignRef,
      this.utmSource,
      this.endsAt,
      this.bid,
      this.revision,
      this.rate,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a placement cycle in status idle. */
export function newPlacementCycle(code: string, name: string): PlacementCycle {
  return new PlacementCycle(code, name, 0, "", "", 0, 0, 0, 0, 0, "idle");
}
