import * as text from "../../../../kit/text.js";

/** Where a mention checkpoint is in its life cycle. */
export type MentionCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A mention checkpoint as the mention team keeps it. */
export class MentionCheckpoint {
  code: string;
  label: string;
  unit: string;
  budget: number;
  notes: string;
  updatedAt: number;
  status: MentionCheckpointStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    budget: number,
    notes: string,
    updatedAt: number,
    status: MentionCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.budget = budget;
    this.notes = notes;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: MentionCheckpointStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: MentionCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netExposure(): number {
    return Math.round((this.budget + this.updatedAt) * 100) / 100;
  }

  copy(): MentionCheckpoint {
    return new MentionCheckpoint(
      this.code,
      this.label,
      this.unit,
      this.budget,
      this.notes,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a mention checkpoint in status idle. */
export function newMentionCheckpoint(code: string, label: string): MentionCheckpoint {
  return new MentionCheckpoint(code, label, "", 0, "", 0, "idle");
}
