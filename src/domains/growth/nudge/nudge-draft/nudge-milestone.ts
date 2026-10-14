import * as text from "../../../../kit/text.js";

/** Where a nudge milestone is in its life cycle. */
export type NudgeMilestoneStatus = "requested" | "granted" | "revoked" | "expired";

/** A nudge milestone as the nudge team keeps it. */
export class NudgeMilestone {
  code: string;
  label: string;
  sendAt: number;
  channel: string;
  variant: string;
  attempts: number;
  status: NudgeMilestoneStatus;

  constructor(
    code: string,
    label: string,
    sendAt: number,
    channel: string,
    variant: string,
    attempts: number,
    status: NudgeMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.channel = channel;
    this.variant = variant;
    this.attempts = attempts;
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

  canMoveTo(next: NudgeMilestoneStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: NudgeMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedValue(): number {
    return Math.round((this.attempts + this.sendAt) * 100) / 100;
  }

  copy(): NudgeMilestone {
    return new NudgeMilestone(
      this.code,
      this.label,
      this.sendAt,
      this.channel,
      this.variant,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a nudge milestone in status requested. */
export function newNudgeMilestone(code: string, label: string): NudgeMilestone {
  return new NudgeMilestone(code, label, 0, "", "", 0, "requested");
}
