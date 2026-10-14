/**
 * The insight snapshot records of social's insight work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a insight snapshot is in its life cycle. */
export type InsightSnapshotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A insight snapshot as the insight team keeps it. */
export class InsightSnapshot {
  code: string;
  name: string;
  audienceId: string;
  region: string;
  unit: string;
  quantity: number;
  status: InsightSnapshotStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    region: string,
    unit: string,
    quantity: number,
    status: InsightSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.region = region;
    this.unit = unit;
    this.quantity = quantity;
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

  canMoveTo(next: InsightSnapshotStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
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
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InsightSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): InsightSnapshot {
    return new InsightSnapshot(
      this.code,
      this.name,
      this.audienceId,
      this.region,
      this.unit,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a insight snapshot in status draft. */
export function newInsightSnapshot(code: string, name: string): InsightSnapshot {
  return new InsightSnapshot(code, name, "", "", "", 0, "draft");
}
