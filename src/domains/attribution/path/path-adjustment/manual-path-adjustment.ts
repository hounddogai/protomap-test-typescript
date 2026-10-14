/**
 * The manual path adjustment records of attribution's path work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual path adjustment is in its life cycle. */
export type ManualPathAdjustmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** One manual path adjustment, with what the planners need to act on it. */
export class ManualPathAdjustment {
  code: string;
  name: string;
  batchSize: number;
  checksum: string;
  title: string;
  source: string;
  margin: number;
  description: string;
  status: ManualPathAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    checksum: string,
    title: string,
    source: string,
    margin: number,
    description: string,
    status: ManualPathAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.checksum = checksum;
    this.title = title;
    this.source = source;
    this.margin = margin;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualPathAdjustmentStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        return next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualPathAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual path adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netValue(): number {
    return Math.round(this.batchSize * this.margin * 100) / 100;
  }

  copy(): ManualPathAdjustment {
    return new ManualPathAdjustment(
      this.code,
      this.name,
      this.batchSize,
      this.checksum,
      this.title,
      this.source,
      this.margin,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a manual path adjustment in status new. */
export function newManualPathAdjustment(code: string, name: string): ManualPathAdjustment {
  return new ManualPathAdjustment(code, name, 0, "", "", "", 0, "", "new");
}
