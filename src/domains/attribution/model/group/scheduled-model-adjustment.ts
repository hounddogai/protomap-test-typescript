import * as text from "../../../../kit/text.js";

/** Where a scheduled model adjustment is in its life cycle. */
export type ScheduledModelAdjustmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A scheduled model adjustment. Its code is unique within a tenant. */
export class ScheduledModelAdjustment {
  code: string;
  label: string;
  notes: string;
  startsAt: number;
  frequencyCap: number;
  ownerId: string;
  status: ScheduledModelAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    startsAt: number,
    frequencyCap: number,
    ownerId: string,
    status: ScheduledModelAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.startsAt = startsAt;
    this.frequencyCap = frequencyCap;
    this.ownerId = ownerId;
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

  canMoveTo(next: ScheduledModelAdjustmentStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ScheduledModelAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled model adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedTotal(): number {
    return Math.round(this.startsAt * this.frequencyCap * 100) / 100;
  }

  copy(): ScheduledModelAdjustment {
    return new ScheduledModelAdjustment(
      this.code,
      this.label,
      this.notes,
      this.startsAt,
      this.frequencyCap,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled model adjustment in status requested. */
export function newScheduledModelAdjustment(code: string, label: string): ScheduledModelAdjustment {
  return new ScheduledModelAdjustment(code, label, "", 0, 0, "", "requested");
}
