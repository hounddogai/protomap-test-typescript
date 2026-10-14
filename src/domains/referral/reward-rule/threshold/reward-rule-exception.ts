import * as text from "../../../../kit/text.js";

/** Where a reward rule exception is in its life cycle. */
export type RewardRuleExceptionStatus = "requested" | "granted" | "revoked" | "expired";

/** One reward rule exception, with what the planners need to act on it. */
export class RewardRuleException {
  code: string;
  label: string;
  name: string;
  variant: string;
  windowDays: number;
  pinned: boolean;
  timezone: string;
  quantity: number;
  attempts: number;
  notes: string;
  status: RewardRuleExceptionStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    variant: string,
    windowDays: number,
    pinned: boolean,
    timezone: string,
    quantity: number,
    attempts: number,
    notes: string,
    status: RewardRuleExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.variant = variant;
    this.windowDays = windowDays;
    this.pinned = pinned;
    this.timezone = timezone;
    this.quantity = quantity;
    this.attempts = attempts;
    this.notes = notes;
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

  canMoveTo(next: RewardRuleExceptionStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardRuleExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedVolume(): number {
    return Math.round(this.quantity * this.windowDays * 100) / 100;
  }

  copy(): RewardRuleException {
    return new RewardRuleException(
      this.code,
      this.label,
      this.name,
      this.variant,
      this.windowDays,
      this.pinned,
      this.timezone,
      this.quantity,
      this.attempts,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reward rule exception in status requested. */
export function newRewardRuleException(code: string, label: string): RewardRuleException {
  return new RewardRuleException(code, label, "", "", 0, false, "", 0, 0, "", "requested");
}
