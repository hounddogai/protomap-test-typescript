import * as text from "../../../../kit/text.js";

/** Where a tiered macro snapshot is in its life cycle. */
export type TieredMacroSnapshotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a tiered macro snapshot and its current status. */
export class TieredMacroSnapshot {
  code: string;
  name: string;
  title: string;
  threshold: number;
  impressions: number;
  score: number;
  batchSize: number;
  version: number;
  status: TieredMacroSnapshotStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    threshold: number,
    impressions: number,
    score: number,
    batchSize: number,
    version: number,
    status: TieredMacroSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.threshold = threshold;
    this.impressions = impressions;
    this.score = score;
    this.batchSize = batchSize;
    this.version = version;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredMacroSnapshotStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredMacroSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered macro snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netValue(): number {
    return Math.round((this.score + this.impressions) * 100) / 100;
  }

  copy(): TieredMacroSnapshot {
    return new TieredMacroSnapshot(
      this.code,
      this.name,
      this.title,
      this.threshold,
      this.impressions,
      this.score,
      this.batchSize,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered macro snapshot in status proposed. */
export function newTieredMacroSnapshot(code: string, name: string): TieredMacroSnapshot {
  return new TieredMacroSnapshot(code, name, "", 0, 0, 0, 0, 0, "proposed");
}
