import * as text from "../../../../kit/text.js";

/** Where a placement entry is in its life cycle. */
export type PlacementEntryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A placement entry as the placement team keeps it. */
export class PlacementEntry {
  code: string;
  title: string;
  pinned: boolean;
  graceDays: number;
  clicks: number;
  channel: string;
  approved: boolean;
  status: PlacementEntryStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    graceDays: number,
    clicks: number,
    channel: string,
    approved: boolean,
    status: PlacementEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.graceDays = graceDays;
    this.clicks = clicks;
    this.channel = channel;
    this.approved = approved;
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

  canMoveTo(next: PlacementEntryStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PlacementEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round((this.graceDays + this.clicks) * 100) / 100;
  }

  copy(): PlacementEntry {
    return new PlacementEntry(
      this.code,
      this.title,
      this.pinned,
      this.graceDays,
      this.clicks,
      this.channel,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a placement entry in status idle. */
export function newPlacementEntry(code: string, title: string): PlacementEntry {
  return new PlacementEntry(code, title, false, 0, 0, "", false, "idle");
}
