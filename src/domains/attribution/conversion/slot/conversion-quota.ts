import * as text from "../../../../kit/text.js";

/** Where a conversion quota is in its life cycle. */
export type ConversionQuotaStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A conversion quota. Its code is unique within a tenant. */
export class ConversionQuota {
  code: string;
  name: string;
  archived: boolean;
  batchSize: number;
  cohort: string;
  cost: number;
  graceDays: number;
  impressions: number;
  status: ConversionQuotaStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    batchSize: number,
    cohort: string,
    cost: number,
    graceDays: number,
    impressions: number,
    status: ConversionQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.batchSize = batchSize;
    this.cohort = cohort;
    this.cost = cost;
    this.graceDays = graceDays;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ConversionQuotaStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ConversionQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"conversion quota"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.graceDays - this.impressions) * 100) / 100;
  }

  copy(): ConversionQuota {
    return new ConversionQuota(
      this.code,
      this.name,
      this.archived,
      this.batchSize,
      this.cohort,
      this.cost,
      this.graceDays,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a conversion quota in status draft. */
export function newConversionQuota(code: string, name: string): ConversionQuota {
  return new ConversionQuota(code, name, false, 0, "", 0, 0, 0, "draft");
}
