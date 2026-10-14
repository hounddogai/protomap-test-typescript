import * as text from "../../../../kit/text.js";

/** Where a rolling suppression ledger is in its life cycle. */
export type RollingSuppressionLedgerStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A rolling suppression ledger as the suppression team keeps it. */
export class RollingSuppressionLedger {
  code: string;
  label: string;
  weight: number;
  cohort: string;
  minimum: number;
  channel: string;
  floorValue: number;
  durationMinutes: number;
  version: number;
  clicks: number;
  status: RollingSuppressionLedgerStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    cohort: string,
    minimum: number,
    channel: string,
    floorValue: number,
    durationMinutes: number,
    version: number,
    clicks: number,
    status: RollingSuppressionLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.cohort = cohort;
    this.minimum = minimum;
    this.channel = channel;
    this.floorValue = floorValue;
    this.durationMinutes = durationMinutes;
    this.version = version;
    this.clicks = clicks;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingSuppressionLedgerStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingSuppressionLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling suppression ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netValue(): number {
    return Math.round(this.version * this.durationMinutes * 100) / 100;
  }

  copy(): RollingSuppressionLedger {
    return new RollingSuppressionLedger(
      this.code,
      this.label,
      this.weight,
      this.cohort,
      this.minimum,
      this.channel,
      this.floorValue,
      this.durationMinutes,
      this.version,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a rolling suppression ledger in status planned. */
export function newRollingSuppressionLedger(code: string, label: string): RollingSuppressionLedger {
  return new RollingSuppressionLedger(code, label, 0, "", 0, "", 0, 0, 0, 0, "planned");
}
