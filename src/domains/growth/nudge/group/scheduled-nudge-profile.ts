import * as text from "../../../../kit/text.js";

/** Where a scheduled nudge profile is in its life cycle. */
export type ScheduledNudgeProfileStatus = "new" | "queued" | "running" | "done" | "failed";

/** A scheduled nudge profile. Its code is unique within a tenant. */
export class ScheduledNudgeProfile {
  code: string;
  label: string;
  reviewer: string;
  minimum: number;
  sendAt: number;
  weight: number;
  discount: number;
  graceDays: number;
  status: ScheduledNudgeProfileStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    minimum: number,
    sendAt: number,
    weight: number,
    discount: number,
    graceDays: number,
    status: ScheduledNudgeProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.minimum = minimum;
    this.sendAt = sendAt;
    this.weight = weight;
    this.discount = discount;
    this.graceDays = graceDays;
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

  canMoveTo(next: ScheduledNudgeProfileStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
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

  moveTo(next: ScheduledNudgeProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled nudge profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedVolume(): number {
    return Math.round((this.graceDays + this.weight) * 100) / 100;
  }

  copy(): ScheduledNudgeProfile {
    return new ScheduledNudgeProfile(
      this.code,
      this.label,
      this.reviewer,
      this.minimum,
      this.sendAt,
      this.weight,
      this.discount,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled nudge profile in status new. */
export function newScheduledNudgeProfile(code: string, label: string): ScheduledNudgeProfile {
  return new ScheduledNudgeProfile(code, label, "", 0, 0, 0, 0, 0, "new");
}
