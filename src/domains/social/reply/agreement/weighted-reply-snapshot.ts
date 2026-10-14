import * as text from "../../../../kit/text.js";

/** Where a weighted reply snapshot is in its life cycle. */
export type WeightedReplySnapshotStatus = "requested" | "granted" | "revoked" | "expired";

/** A weighted reply snapshot. Its code is unique within a tenant. */
export class WeightedReplySnapshot {
  code: string;
  name: string;
  floorValue: number;
  budget: number;
  createdAt: number;
  approved: boolean;
  segment: string;
  status: WeightedReplySnapshotStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    budget: number,
    createdAt: number,
    approved: boolean,
    segment: string,
    status: WeightedReplySnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.budget = budget;
    this.createdAt = createdAt;
    this.approved = approved;
    this.segment = segment;
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

  canMoveTo(next: WeightedReplySnapshotStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
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

  moveTo(next: WeightedReplySnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reply snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedExposure(): number {
    return Math.round((this.createdAt - this.budget) * 100) / 100;
  }

  copy(): WeightedReplySnapshot {
    return new WeightedReplySnapshot(
      this.code,
      this.name,
      this.floorValue,
      this.budget,
      this.createdAt,
      this.approved,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a weighted reply snapshot in status requested. */
export function newWeightedReplySnapshot(code: string, name: string): WeightedReplySnapshot {
  return new WeightedReplySnapshot(code, name, 0, 0, 0, false, "", "requested");
}
