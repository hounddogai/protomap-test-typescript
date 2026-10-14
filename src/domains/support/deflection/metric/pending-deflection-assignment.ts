import * as text from "../../../../kit/text.js";

/** Where a pending deflection assignment is in its life cycle. */
export type PendingDeflectionAssignmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A pending deflection assignment as the deflection team keeps it. */
export class PendingDeflectionAssignment {
  code: string;
  label: string;
  currency: string;
  batchSize: number;
  category: string;
  locale: string;
  channel: string;
  unit: string;
  floorValue: number;
  impressions: number;
  status: PendingDeflectionAssignmentStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    batchSize: number,
    category: string,
    locale: string,
    channel: string,
    unit: string,
    floorValue: number,
    impressions: number,
    status: PendingDeflectionAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.batchSize = batchSize;
    this.category = category;
    this.locale = locale;
    this.channel = channel;
    this.unit = unit;
    this.floorValue = floorValue;
    this.impressions = impressions;
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

  canMoveTo(next: PendingDeflectionAssignmentStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
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

  moveTo(next: PendingDeflectionAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending deflection assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"pending deflection assignment"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round(this.impressions * this.floorValue * 100) / 100;
  }

  copy(): PendingDeflectionAssignment {
    return new PendingDeflectionAssignment(
      this.code,
      this.label,
      this.currency,
      this.batchSize,
      this.category,
      this.locale,
      this.channel,
      this.unit,
      this.floorValue,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a pending deflection assignment in status new. */
export function newPendingDeflectionAssignment(code: string, label: string): PendingDeflectionAssignment {
  return new PendingDeflectionAssignment(code, label, "", 0, "", "", "", "", 0, 0, "new");
}
