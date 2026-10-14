import * as text from "../../../../kit/text.js";

/** Where a legacy activation estimate is in its life cycle. */
export type LegacyActivationEstimateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a legacy activation estimate and its current status. */
export class LegacyActivationEstimate {
  code: string;
  label: string;
  source: string;
  graceDays: number;
  approved: boolean;
  notes: string;
  durationMinutes: number;
  revision: number;
  status: LegacyActivationEstimateStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    graceDays: number,
    approved: boolean,
    notes: string,
    durationMinutes: number,
    revision: number,
    status: LegacyActivationEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.graceDays = graceDays;
    this.approved = approved;
    this.notes = notes;
    this.durationMinutes = durationMinutes;
    this.revision = revision;
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

  canMoveTo(next: LegacyActivationEstimateStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LegacyActivationEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy activation estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedValue(): number {
    return Math.round(this.graceDays * this.durationMinutes * 100) / 100;
  }

  copy(): LegacyActivationEstimate {
    return new LegacyActivationEstimate(
      this.code,
      this.label,
      this.source,
      this.graceDays,
      this.approved,
      this.notes,
      this.durationMinutes,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a legacy activation estimate in status draft. */
export function newLegacyActivationEstimate(code: string, label: string): LegacyActivationEstimate {
  return new LegacyActivationEstimate(code, label, "", 0, false, "", 0, 0, "draft");
}
