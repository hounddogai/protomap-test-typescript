import * as text from "../../../../kit/text.js";

/** Where a regional nudge snapshot is in its life cycle. */
export type RegionalNudgeSnapshotStatus = "requested" | "granted" | "revoked" | "expired";

/** A regional nudge snapshot as the nudge team keeps it. */
export class RegionalNudgeSnapshot {
  code: string;
  label: string;
  graceDays: number;
  reviewer: string;
  durationMinutes: number;
  externalRef: string;
  discount: number;
  variant: string;
  status: RegionalNudgeSnapshotStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    reviewer: string,
    durationMinutes: number,
    externalRef: string,
    discount: number,
    variant: string,
    status: RegionalNudgeSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.reviewer = reviewer;
    this.durationMinutes = durationMinutes;
    this.externalRef = externalRef;
    this.discount = discount;
    this.variant = variant;
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

  canMoveTo(next: RegionalNudgeSnapshotStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RegionalNudgeSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional nudge snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netLoad(): number {
    return Math.round((this.durationMinutes + this.discount) * 100) / 100;
  }

  copy(): RegionalNudgeSnapshot {
    return new RegionalNudgeSnapshot(
      this.code,
      this.label,
      this.graceDays,
      this.reviewer,
      this.durationMinutes,
      this.externalRef,
      this.discount,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional nudge snapshot in status requested. */
export function newRegionalNudgeSnapshot(code: string, label: string): RegionalNudgeSnapshot {
  return new RegionalNudgeSnapshot(code, label, 0, "", 0, "", 0, "", "requested");
}
