import * as text from "../../../../kit/text.js";

/** Where a seasonal paywall allocation is in its life cycle. */
export type SeasonalPaywallAllocationStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a seasonal paywall allocation and its current status. */
export class SeasonalPaywallAllocation {
  code: string;
  label: string;
  notes: string;
  category: string;
  channel: string;
  cost: number;
  status: SeasonalPaywallAllocationStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    category: string,
    channel: string,
    cost: number,
    status: SeasonalPaywallAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.category = category;
    this.channel = channel;
    this.cost = cost;
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

  canMoveTo(next: SeasonalPaywallAllocationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "running" || next === "failed";
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

  moveTo(next: SeasonalPaywallAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal paywall allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.cost;
  }

  copy(): SeasonalPaywallAllocation {
    return new SeasonalPaywallAllocation(
      this.code,
      this.label,
      this.notes,
      this.category,
      this.channel,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a seasonal paywall allocation in status new. */
export function newSeasonalPaywallAllocation(code: string, label: string): SeasonalPaywallAllocation {
  return new SeasonalPaywallAllocation(code, label, "", "", "", 0, "new");
}
