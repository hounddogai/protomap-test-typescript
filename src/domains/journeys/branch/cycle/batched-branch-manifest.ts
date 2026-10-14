import * as text from "../../../../kit/text.js";

/** Where a batched branch manifest is in its life cycle. */
export type BatchedBranchManifestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A batched branch manifest. Its code is unique within a tenant. */
export class BatchedBranchManifest {
  code: string;
  name: string;
  startsAt: number;
  discount: number;
  sequence: number;
  audienceId: string;
  unit: string;
  openRate: number;
  minimum: number;
  checksum: string;
  status: BatchedBranchManifestStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    discount: number,
    sequence: number,
    audienceId: string,
    unit: string,
    openRate: number,
    minimum: number,
    checksum: string,
    status: BatchedBranchManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.discount = discount;
    this.sequence = sequence;
    this.audienceId = audienceId;
    this.unit = unit;
    this.openRate = openRate;
    this.minimum = minimum;
    this.checksum = checksum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedBranchManifestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BatchedBranchManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched branch manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netExposure(): number {
    return Math.round((this.sequence + this.discount) * 100) / 100;
  }

  copy(): BatchedBranchManifest {
    return new BatchedBranchManifest(
      this.code,
      this.name,
      this.startsAt,
      this.discount,
      this.sequence,
      this.audienceId,
      this.unit,
      this.openRate,
      this.minimum,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a batched branch manifest in status open. */
export function newBatchedBranchManifest(code: string, name: string): BatchedBranchManifest {
  return new BatchedBranchManifest(code, name, 0, 0, 0, "", "", 0, 0, "", "open");
}
