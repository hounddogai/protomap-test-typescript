import * as text from "../../../../kit/text.js";

/** Where a branch digest is in its life cycle. */
export type BranchDigestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A branch digest as the branch team keeps it. */
export class BranchDigest {
  code: string;
  label: string;
  weight: number;
  unit: string;
  ratio: number;
  ceiling: number;
  channel: string;
  category: string;
  batchSize: number;
  status: BranchDigestStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    unit: string,
    ratio: number,
    ceiling: number,
    channel: string,
    category: string,
    batchSize: number,
    status: BranchDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.unit = unit;
    this.ratio = ratio;
    this.ceiling = ceiling;
    this.channel = channel;
    this.category = category;
    this.batchSize = batchSize;
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

  canMoveTo(next: BranchDigestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BranchDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedVolume(): number {
    return Math.round((this.weight + this.ratio) * 100) / 100;
  }

  copy(): BranchDigest {
    return new BranchDigest(
      this.code,
      this.label,
      this.weight,
      this.unit,
      this.ratio,
      this.ceiling,
      this.channel,
      this.category,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a branch digest in status draft. */
export function newBranchDigest(code: string, label: string): BranchDigest {
  return new BranchDigest(code, label, 0, "", 0, 0, "", "", 0, "draft");
}
