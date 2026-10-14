import * as text from "../../../../kit/text.js";

/** Where a tiered redemption batch is in its life cycle. */
export type TieredRedemptionBatchStatus = "created" | "validated" | "published" | "retired";

/** The record of a tiered redemption batch and its current status. */
export class TieredRedemptionBatch {
  code: string;
  label: string;
  endsAt: number;
  checksum: string;
  floorValue: number;
  margin: number;
  amount: number;
  openRate: number;
  channel: string;
  segment: string;
  status: TieredRedemptionBatchStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    checksum: string,
    floorValue: number,
    margin: number,
    amount: number,
    openRate: number,
    channel: string,
    segment: string,
    status: TieredRedemptionBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.checksum = checksum;
    this.floorValue = floorValue;
    this.margin = margin;
    this.amount = amount;
    this.openRate = openRate;
    this.channel = channel;
    this.segment = segment;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredRedemptionBatchStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TieredRedemptionBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered redemption batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveVolume(): number {
    return Math.round(this.margin * this.floorValue * 100) / 100;
  }

  copy(): TieredRedemptionBatch {
    return new TieredRedemptionBatch(
      this.code,
      this.label,
      this.endsAt,
      this.checksum,
      this.floorValue,
      this.margin,
      this.amount,
      this.openRate,
      this.channel,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered redemption batch in status created. */
export function newTieredRedemptionBatch(code: string, label: string): TieredRedemptionBatch {
  return new TieredRedemptionBatch(code, label, 0, "", 0, 0, 0, 0, "", "", "created");
}
