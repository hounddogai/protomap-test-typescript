import * as text from "../../../../kit/text.js";

/** Where a invite checkpoint is in its life cycle. */
export type InviteCheckpointStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One invite checkpoint, with what the planners need to act on it. */
export class InviteCheckpoint {
  code: string;
  label: string;
  frequencyCap: number;
  startsAt: number;
  budget: number;
  retries: number;
  minimum: number;
  channel: string;
  ceiling: number;
  status: InviteCheckpointStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    startsAt: number,
    budget: number,
    retries: number,
    minimum: number,
    channel: string,
    ceiling: number,
    status: InviteCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.startsAt = startsAt;
    this.budget = budget;
    this.retries = retries;
    this.minimum = minimum;
    this.channel = channel;
    this.ceiling = ceiling;
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

  canMoveTo(next: InviteCheckpointStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        return next === "reopened";
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InviteCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveLoad(): number {
    return Math.round((this.retries - this.frequencyCap) * 100) / 100;
  }

  copy(): InviteCheckpoint {
    return new InviteCheckpoint(
      this.code,
      this.label,
      this.frequencyCap,
      this.startsAt,
      this.budget,
      this.retries,
      this.minimum,
      this.channel,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a invite checkpoint in status open. */
export function newInviteCheckpoint(code: string, label: string): InviteCheckpoint {
  return new InviteCheckpoint(code, label, 0, 0, 0, 0, 0, "", 0, "open");
}
