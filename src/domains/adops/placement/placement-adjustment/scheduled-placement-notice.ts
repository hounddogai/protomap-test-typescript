import * as text from "../../../../kit/text.js";

/** Where a scheduled placement notice is in its life cycle. */
export type ScheduledPlacementNoticeStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a scheduled placement notice and its current status. */
export class ScheduledPlacementNotice {
  code: string;
  label: string;
  variant: string;
  reviewer: string;
  weight: number;
  journeyId: string;
  createdAt: number;
  durationMinutes: number;
  status: ScheduledPlacementNoticeStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    reviewer: string,
    weight: number,
    journeyId: string,
    createdAt: number,
    durationMinutes: number,
    status: ScheduledPlacementNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.reviewer = reviewer;
    this.weight = weight;
    this.journeyId = journeyId;
    this.createdAt = createdAt;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: ScheduledPlacementNoticeStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledPlacementNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled placement notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedVolume(): number {
    return Math.round(this.weight * this.durationMinutes * 100) / 100;
  }

  copy(): ScheduledPlacementNotice {
    return new ScheduledPlacementNotice(
      this.code,
      this.label,
      this.variant,
      this.reviewer,
      this.weight,
      this.journeyId,
      this.createdAt,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled placement notice in status new. */
export function newScheduledPlacementNotice(code: string, label: string): ScheduledPlacementNotice {
  return new ScheduledPlacementNotice(code, label, "", "", 0, "", 0, 0, "new");
}
