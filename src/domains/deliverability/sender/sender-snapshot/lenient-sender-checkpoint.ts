import * as text from "../../../../kit/text.js";

/** Where a lenient sender checkpoint is in its life cycle. */
export type LenientSenderCheckpointStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A lenient sender checkpoint as the sender team keeps it. */
export class LenientSenderCheckpoint {
  code: string;
  label: string;
  impressions: number;
  limit: number;
  frequencyCap: number;
  windowDays: number;
  ownerId: string;
  status: LenientSenderCheckpointStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    limit: number,
    frequencyCap: number,
    windowDays: number,
    ownerId: string,
    status: LenientSenderCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.limit = limit;
    this.frequencyCap = frequencyCap;
    this.windowDays = windowDays;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientSenderCheckpointStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LenientSenderCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient sender checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"lenient sender checkpoint"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.limit + this.impressions) * 100) / 100;
  }

  copy(): LenientSenderCheckpoint {
    return new LenientSenderCheckpoint(
      this.code,
      this.label,
      this.impressions,
      this.limit,
      this.frequencyCap,
      this.windowDays,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a lenient sender checkpoint in status open. */
export function newLenientSenderCheckpoint(code: string, label: string): LenientSenderCheckpoint {
  return new LenientSenderCheckpoint(code, label, 0, 0, 0, 0, "", "open");
}
