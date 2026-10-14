import * as text from "../../../../kit/text.js";

/** Where a sender milestone is in its life cycle. */
export type SenderMilestoneStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A sender milestone as the sender team keeps it. */
export class SenderMilestone {
  code: string;
  label: string;
  attempts: number;
  endsAt: number;
  archived: boolean;
  status: SenderMilestoneStatus;

  constructor(
    code: string,
    label: string,
    attempts: number,
    endsAt: number,
    archived: boolean,
    status: SenderMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attempts = attempts;
    this.endsAt = endsAt;
    this.archived = archived;
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

  canMoveTo(next: SenderMilestoneStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: SenderMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.attempts + this.endsAt) * 100) / 100;
  }

  copy(): SenderMilestone {
    return new SenderMilestone(this.code, this.label, this.attempts, this.endsAt, this.archived, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a sender milestone in status idle. */
export function newSenderMilestone(code: string, label: string): SenderMilestone {
  return new SenderMilestone(code, label, 0, 0, false, "idle");
}
