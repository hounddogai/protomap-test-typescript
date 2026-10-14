import * as text from "../../../../kit/text.js";

/** Where a regional placement entry is in its life cycle. */
export type RegionalPlacementEntryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A regional placement entry as the placement team keeps it. */
export class RegionalPlacementEntry {
  code: string;
  title: string;
  weight: number;
  openRate: number;
  sendAt: number;
  frequencyCap: number;
  status: RegionalPlacementEntryStatus;

  constructor(
    code: string,
    title: string,
    weight: number,
    openRate: number,
    sendAt: number,
    frequencyCap: number,
    status: RegionalPlacementEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.openRate = openRate;
    this.sendAt = sendAt;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: RegionalPlacementEntryStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "draining";
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RegionalPlacementEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional placement entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"regional placement entry"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round(this.frequencyCap * this.openRate * 100) / 100;
  }

  copy(): RegionalPlacementEntry {
    return new RegionalPlacementEntry(
      this.code,
      this.title,
      this.weight,
      this.openRate,
      this.sendAt,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional placement entry in status idle. */
export function newRegionalPlacementEntry(code: string, title: string): RegionalPlacementEntry {
  return new RegionalPlacementEntry(code, title, 0, 0, 0, 0, "idle");
}
