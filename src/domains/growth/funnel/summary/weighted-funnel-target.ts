import * as text from "../../../../kit/text.js";

/** Where a weighted funnel target is in its life cycle. */
export type WeightedFunnelTargetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A weighted funnel target. Its code is unique within a tenant. */
export class WeightedFunnelTarget {
  code: string;
  name: string;
  approved: boolean;
  checksum: string;
  batchSize: number;
  conversionRate: number;
  status: WeightedFunnelTargetStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    checksum: string,
    batchSize: number,
    conversionRate: number,
    status: WeightedFunnelTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.checksum = checksum;
    this.batchSize = batchSize;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: WeightedFunnelTargetStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: WeightedFunnelTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted funnel target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round((this.conversionRate - this.batchSize) * 100) / 100;
  }

  copy(): WeightedFunnelTarget {
    return new WeightedFunnelTarget(
      this.code,
      this.name,
      this.approved,
      this.checksum,
      this.batchSize,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a weighted funnel target in status draft. */
export function newWeightedFunnelTarget(code: string, name: string): WeightedFunnelTarget {
  return new WeightedFunnelTarget(code, name, false, "", 0, 0, "draft");
}
