import * as text from "../../../../kit/text.js";

/** Where a creative snapshot is in its life cycle. */
export type CreativeSnapshotStatus = "requested" | "granted" | "revoked" | "expired";

/** A creative snapshot. Its code is unique within a tenant. */
export class CreativeSnapshot {
  code: string;
  label: string;
  segment: string;
  bid: number;
  campaignRef: string;
  amount: number;
  conversionRate: number;
  source: string;
  status: CreativeSnapshotStatus;

  constructor(
    code: string,
    label: string,
    segment: string,
    bid: number,
    campaignRef: string,
    amount: number,
    conversionRate: number,
    source: string,
    status: CreativeSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.bid = bid;
    this.campaignRef = campaignRef;
    this.amount = amount;
    this.conversionRate = conversionRate;
    this.source = source;
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

  canMoveTo(next: CreativeSnapshotStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreativeSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveVolume(): number {
    return Math.round((this.bid + this.amount) * 100) / 100;
  }

  copy(): CreativeSnapshot {
    return new CreativeSnapshot(
      this.code,
      this.label,
      this.segment,
      this.bid,
      this.campaignRef,
      this.amount,
      this.conversionRate,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a creative snapshot in status requested. */
export function newCreativeSnapshot(code: string, label: string): CreativeSnapshot {
  return new CreativeSnapshot(code, label, "", 0, "", 0, 0, "", "requested");
}
