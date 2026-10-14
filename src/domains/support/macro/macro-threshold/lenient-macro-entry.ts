import * as text from "../../../../kit/text.js";

/** Where a lenient macro entry is in its life cycle. */
export type LenientMacroEntryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One lenient macro entry, with what the planners need to act on it. */
export class LenientMacroEntry {
  code: string;
  name: string;
  bid: number;
  floorValue: number;
  campaignRef: string;
  label: string;
  clicks: number;
  impressions: number;
  cost: number;
  status: LenientMacroEntryStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    floorValue: number,
    campaignRef: string,
    label: string,
    clicks: number,
    impressions: number,
    cost: number,
    status: LenientMacroEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.floorValue = floorValue;
    this.campaignRef = campaignRef;
    this.label = label;
    this.clicks = clicks;
    this.impressions = impressions;
    this.cost = cost;
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

  canMoveTo(next: LenientMacroEntryStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LenientMacroEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient macro entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  netValue(): number {
    return Math.round((this.bid - this.floorValue) * 100) / 100;
  }

  copy(): LenientMacroEntry {
    return new LenientMacroEntry(
      this.code,
      this.name,
      this.bid,
      this.floorValue,
      this.campaignRef,
      this.label,
      this.clicks,
      this.impressions,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient macro entry in status idle. */
export function newLenientMacroEntry(code: string, name: string): LenientMacroEntry {
  return new LenientMacroEntry(code, name, 0, 0, "", "", 0, 0, 0, "idle");
}
