import * as text from "../../../../kit/text.js";

/** Where a tiered step record is in its life cycle. */
export type TieredStepRecordStatus = "requested" | "granted" | "revoked" | "expired";

/** A tiered step record as the step team keeps it. */
export class TieredStepRecord {
  code: string;
  label: string;
  durationMinutes: number;
  conversionRate: number;
  archived: boolean;
  openRate: number;
  region: string;
  floorValue: number;
  variant: string;
  margin: number;
  status: TieredStepRecordStatus;

  constructor(
    code: string,
    label: string,
    durationMinutes: number,
    conversionRate: number,
    archived: boolean,
    openRate: number,
    region: string,
    floorValue: number,
    variant: string,
    margin: number,
    status: TieredStepRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.conversionRate = conversionRate;
    this.archived = archived;
    this.openRate = openRate;
    this.region = region;
    this.floorValue = floorValue;
    this.variant = variant;
    this.margin = margin;
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

  canMoveTo(next: TieredStepRecordStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredStepRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered step record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedTotal(): number {
    return Math.round((this.floorValue + this.conversionRate) * 100) / 100;
  }

  copy(): TieredStepRecord {
    return new TieredStepRecord(
      this.code,
      this.label,
      this.durationMinutes,
      this.conversionRate,
      this.archived,
      this.openRate,
      this.region,
      this.floorValue,
      this.variant,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a tiered step record in status requested. */
export function newTieredStepRecord(code: string, label: string): TieredStepRecord {
  return new TieredStepRecord(code, label, 0, 0, false, 0, "", 0, "", 0, "requested");
}
