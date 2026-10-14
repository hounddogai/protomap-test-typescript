import * as text from "../../../../kit/text.js";

/** Where a tiered placement ledger is in its life cycle. */
export type TieredPlacementLedgerStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a tiered placement ledger and its current status. */
export class TieredPlacementLedger {
  code: string;
  label: string;
  channel: string;
  impressions: number;
  priority: number;
  externalRef: string;
  status: TieredPlacementLedgerStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    impressions: number,
    priority: number,
    externalRef: string,
    status: TieredPlacementLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.impressions = impressions;
    this.priority = priority;
    this.externalRef = externalRef;
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

  canMoveTo(next: TieredPlacementLedgerStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
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

  moveTo(next: TieredPlacementLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered placement ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"tiered placement ledger"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.priority * this.impressions * 100) / 100;
  }

  copy(): TieredPlacementLedger {
    return new TieredPlacementLedger(
      this.code,
      this.label,
      this.channel,
      this.impressions,
      this.priority,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered placement ledger in status idle. */
export function newTieredPlacementLedger(code: string, label: string): TieredPlacementLedger {
  return new TieredPlacementLedger(code, label, "", 0, 0, "", "idle");
}
