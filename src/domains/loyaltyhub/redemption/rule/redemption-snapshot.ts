import * as text from "../../../../kit/text.js";

/** Where a redemption snapshot is in its life cycle. */
export type RedemptionSnapshotStatus = "created" | "validated" | "published" | "retired";

/** One redemption snapshot, with what the planners need to act on it. */
export class RedemptionSnapshot {
  code: string;
  label: string;
  tags: string[];
  conversionRate: number;
  discount: number;
  status: RedemptionSnapshotStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    conversionRate: number,
    discount: number,
    status: RedemptionSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.conversionRate = conversionRate;
    this.discount = discount;
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

  canMoveTo(next: RedemptionSnapshotStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RedemptionSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveExposure(): number {
    return Math.round((this.discount + this.conversionRate) * 100) / 100;
  }

  copy(): RedemptionSnapshot {
    return new RedemptionSnapshot(this.code, this.label, this.tags, this.conversionRate, this.discount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a redemption snapshot in status created. */
export function newRedemptionSnapshot(code: string, label: string): RedemptionSnapshot {
  return new RedemptionSnapshot(code, label, [], 0, 0, "created");
}
