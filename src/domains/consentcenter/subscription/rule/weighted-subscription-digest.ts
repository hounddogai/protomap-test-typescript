import * as text from "../../../../kit/text.js";

/** Where a weighted subscription digest is in its life cycle. */
export type WeightedSubscriptionDigestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A weighted subscription digest. Its code is unique within a tenant. */
export class WeightedSubscriptionDigest {
  code: string;
  name: string;
  checksum: string;
  reviewer: string;
  version: number;
  notes: string;
  approved: boolean;
  quantity: number;
  category: string;
  ratio: number;
  status: WeightedSubscriptionDigestStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    reviewer: string,
    version: number,
    notes: string,
    approved: boolean,
    quantity: number,
    category: string,
    ratio: number,
    status: WeightedSubscriptionDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.reviewer = reviewer;
    this.version = version;
    this.notes = notes;
    this.approved = approved;
    this.quantity = quantity;
    this.category = category;
    this.ratio = ratio;
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

  canMoveTo(next: WeightedSubscriptionDigestStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
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

  moveTo(next: WeightedSubscriptionDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted subscription digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedValue(): number {
    return Math.round(this.version * this.ratio * 100) / 100;
  }

  copy(): WeightedSubscriptionDigest {
    return new WeightedSubscriptionDigest(
      this.code,
      this.name,
      this.checksum,
      this.reviewer,
      this.version,
      this.notes,
      this.approved,
      this.quantity,
      this.category,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a weighted subscription digest in status idle. */
export function newWeightedSubscriptionDigest(code: string, name: string): WeightedSubscriptionDigest {
  return new WeightedSubscriptionDigest(code, name, "", "", 0, "", false, 0, "", 0, "idle");
}
