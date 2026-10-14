import * as text from "../../../../kit/text.js";

/** Where a placement ledger is in its life cycle. */
export type PlacementLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A placement ledger. Its code is unique within a tenant. */
export class PlacementLedger {
  code: string;
  name: string;
  audienceId: string;
  batchSize: number;
  variant: string;
  createdAt: number;
  label: string;
  clicks: number;
  status: PlacementLedgerStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    batchSize: number,
    variant: string,
    createdAt: number,
    label: string,
    clicks: number,
    status: PlacementLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.batchSize = batchSize;
    this.variant = variant;
    this.createdAt = createdAt;
    this.label = label;
    this.clicks = clicks;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PlacementLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PlacementLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"placement ledger"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.batchSize + this.clicks) * 100) / 100;
  }

  copy(): PlacementLedger {
    return new PlacementLedger(
      this.code,
      this.name,
      this.audienceId,
      this.batchSize,
      this.variant,
      this.createdAt,
      this.label,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a placement ledger in status proposed. */
export function newPlacementLedger(code: string, name: string): PlacementLedger {
  return new PlacementLedger(code, name, "", 0, "", 0, "", 0, "proposed");
}
