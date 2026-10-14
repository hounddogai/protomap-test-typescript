import * as text from "../../../../kit/text.js";

/** Where a pending opt out adjustment is in its life cycle. */
export type PendingOptOutAdjustmentStatus = "created" | "validated" | "published" | "retired";

/** A pending opt out adjustment. Its code is unique within a tenant. */
export class PendingOptOutAdjustment {
  code: string;
  label: string;
  threshold: number;
  sendAt: number;
  endsAt: number;
  conversionRate: number;
  attempts: number;
  frequencyCap: number;
  summary: string;
  status: PendingOptOutAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    sendAt: number,
    endsAt: number,
    conversionRate: number,
    attempts: number,
    frequencyCap: number,
    summary: string,
    status: PendingOptOutAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.sendAt = sendAt;
    this.endsAt = endsAt;
    this.conversionRate = conversionRate;
    this.attempts = attempts;
    this.frequencyCap = frequencyCap;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingOptOutAdjustmentStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingOptOutAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending opt out adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveExposure(): number {
    return Math.round((this.conversionRate - this.endsAt) * 100) / 100;
  }

  copy(): PendingOptOutAdjustment {
    return new PendingOptOutAdjustment(
      this.code,
      this.label,
      this.threshold,
      this.sendAt,
      this.endsAt,
      this.conversionRate,
      this.attempts,
      this.frequencyCap,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pending opt out adjustment in status created. */
export function newPendingOptOutAdjustment(code: string, label: string): PendingOptOutAdjustment {
  return new PendingOptOutAdjustment(code, label, 0, 0, 0, 0, 0, 0, "", "created");
}
