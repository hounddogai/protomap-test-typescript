import * as text from "../../../../kit/text.js";

/** Where a tiered fraud check snapshot is in its life cycle. */
export type TieredFraudCheckSnapshotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a tiered fraud check snapshot and its current status. */
export class TieredFraudCheckSnapshot {
  code: string;
  label: string;
  revision: number;
  frequencyCap: number;
  clicks: number;
  status: TieredFraudCheckSnapshotStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    frequencyCap: number,
    clicks: number,
    status: TieredFraudCheckSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.frequencyCap = frequencyCap;
    this.clicks = clicks;
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

  canMoveTo(next: TieredFraudCheckSnapshotStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredFraudCheckSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered fraud check snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round(this.clicks * this.frequencyCap * 100) / 100;
  }

  copy(): TieredFraudCheckSnapshot {
    return new TieredFraudCheckSnapshot(
      this.code,
      this.label,
      this.revision,
      this.frequencyCap,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered fraud check snapshot in status proposed. */
export function newTieredFraudCheckSnapshot(code: string, label: string): TieredFraudCheckSnapshot {
  return new TieredFraudCheckSnapshot(code, label, 0, 0, 0, "proposed");
}
