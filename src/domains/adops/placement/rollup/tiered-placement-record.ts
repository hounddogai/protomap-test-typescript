import * as text from "../../../../kit/text.js";

/** Where a tiered placement record is in its life cycle. */
export type TieredPlacementRecordStatus = "created" | "validated" | "published" | "retired";

/** One tiered placement record, with what the planners need to act on it. */
export class TieredPlacementRecord {
  code: string;
  name: string;
  updatedAt: number;
  floorValue: number;
  checksum: string;
  impressions: number;
  amount: number;
  windowDays: number;
  phone: string;
  status: TieredPlacementRecordStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    floorValue: number,
    checksum: string,
    impressions: number,
    amount: number,
    windowDays: number,
    phone: string,
    status: TieredPlacementRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.floorValue = floorValue;
    this.checksum = checksum;
    this.impressions = impressions;
    this.amount = amount;
    this.windowDays = windowDays;
    this.phone = phone;
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

  canMoveTo(next: TieredPlacementRecordStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TieredPlacementRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered placement record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedValue(): number {
    return Math.round((this.updatedAt + this.impressions) * 100) / 100;
  }

  copy(): TieredPlacementRecord {
    return new TieredPlacementRecord(
      this.code,
      this.name,
      this.updatedAt,
      this.floorValue,
      this.checksum,
      this.impressions,
      this.amount,
      this.windowDays,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered placement record in status created. */
export function newTieredPlacementRecord(code: string, name: string): TieredPlacementRecord {
  return new TieredPlacementRecord(code, name, 0, 0, "", 0, 0, 0, "", "created");
}
