import * as text from "../../../../kit/text.js";

/** Where a warmup milestone is in its life cycle. */
export type WarmupMilestoneStatus = "created" | "validated" | "published" | "retired";

/** The record of a warmup milestone and its current status. */
export class WarmupMilestone {
  code: string;
  label: string;
  frequencyCap: number;
  limit: number;
  externalRef: string;
  channel: string;
  status: WarmupMilestoneStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    limit: number,
    externalRef: string,
    channel: string,
    status: WarmupMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.limit = limit;
    this.externalRef = externalRef;
    this.channel = channel;
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

  canMoveTo(next: WarmupMilestoneStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WarmupMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedVolume(): number {
    return Math.round((this.limit + this.frequencyCap) * 100) / 100;
  }

  copy(): WarmupMilestone {
    return new WarmupMilestone(
      this.code,
      this.label,
      this.frequencyCap,
      this.limit,
      this.externalRef,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a warmup milestone in status created. */
export function newWarmupMilestone(code: string, label: string): WarmupMilestone {
  return new WarmupMilestone(code, label, 0, 0, "", "", "created");
}
