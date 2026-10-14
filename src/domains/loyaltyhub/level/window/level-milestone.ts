import * as text from "../../../../kit/text.js";

/** Where a level milestone is in its life cycle. */
export type LevelMilestoneStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a level milestone and its current status. */
export class LevelMilestone {
  code: string;
  label: string;
  sendAt: number;
  notes: string;
  source: string;
  margin: number;
  budget: number;
  phone: string;
  approved: boolean;
  status: LevelMilestoneStatus;

  constructor(
    code: string,
    label: string,
    sendAt: number,
    notes: string,
    source: string,
    margin: number,
    budget: number,
    phone: string,
    approved: boolean,
    status: LevelMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.notes = notes;
    this.source = source;
    this.margin = margin;
    this.budget = budget;
    this.phone = phone;
    this.approved = approved;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: LevelMilestoneStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LevelMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedTotal(): number {
    return Math.round((this.sendAt + this.margin) * 100) / 100;
  }

  copy(): LevelMilestone {
    return new LevelMilestone(
      this.code,
      this.label,
      this.sendAt,
      this.notes,
      this.source,
      this.margin,
      this.budget,
      this.phone,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a level milestone in status idle. */
export function newLevelMilestone(code: string, label: string): LevelMilestone {
  return new LevelMilestone(code, label, 0, "", "", 0, 0, "", false, "idle");
}
