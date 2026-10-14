import * as text from "../../../../kit/text.js";

/** Where a regional reputation entry is in its life cycle. */
export type RegionalReputationEntryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One regional reputation entry, with what the planners need to act on it. */
export class RegionalReputationEntry {
  code: string;
  label: string;
  archived: boolean;
  category: string;
  impressions: number;
  bid: number;
  ownerId: string;
  status: RegionalReputationEntryStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    category: string,
    impressions: number,
    bid: number,
    ownerId: string,
    status: RegionalReputationEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.category = category;
    this.impressions = impressions;
    this.bid = bid;
    this.ownerId = ownerId;
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

  canMoveTo(next: RegionalReputationEntryStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "draining":
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

  moveTo(next: RegionalReputationEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional reputation entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveValue(): number {
    return Math.round((this.impressions + this.bid) * 100) / 100;
  }

  copy(): RegionalReputationEntry {
    return new RegionalReputationEntry(
      this.code,
      this.label,
      this.archived,
      this.category,
      this.impressions,
      this.bid,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a regional reputation entry in status idle. */
export function newRegionalReputationEntry(code: string, label: string): RegionalReputationEntry {
  return new RegionalReputationEntry(code, label, false, "", 0, 0, "", "idle");
}
