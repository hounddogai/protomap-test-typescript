import * as text from "../../../../kit/text.js";

/** Where a strict touchpoint policy is in its life cycle. */
export type StrictTouchpointPolicyStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One strict touchpoint policy, with what the planners need to act on it. */
export class StrictTouchpointPolicy {
  code: string;
  label: string;
  createdAt: number;
  windowDays: number;
  channel: string;
  amount: number;
  status: StrictTouchpointPolicyStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    windowDays: number,
    channel: string,
    amount: number,
    status: StrictTouchpointPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.windowDays = windowDays;
    this.channel = channel;
    this.amount = amount;
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

  canMoveTo(next: StrictTouchpointPolicyStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        return next === "resolved" || next === "reopened";
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

  moveTo(next: StrictTouchpointPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict touchpoint policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"strict touchpoint policy"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.createdAt + this.amount) * 100) / 100;
  }

  copy(): StrictTouchpointPolicy {
    return new StrictTouchpointPolicy(
      this.code,
      this.label,
      this.createdAt,
      this.windowDays,
      this.channel,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict touchpoint policy in status open. */
export function newStrictTouchpointPolicy(code: string, label: string): StrictTouchpointPolicy {
  return new StrictTouchpointPolicy(code, label, 0, 0, "", 0, "open");
}
