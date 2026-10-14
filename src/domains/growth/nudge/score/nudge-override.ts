import * as text from "../../../../kit/text.js";

/** Where a nudge override is in its life cycle. */
export type NudgeOverrideStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A nudge override. Its code is unique within a tenant. */
export class NudgeOverride {
  code: string;
  title: string;
  amount: number;
  budget: number;
  graceDays: number;
  sendAt: number;
  frequencyCap: number;
  status: NudgeOverrideStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    budget: number,
    graceDays: number,
    sendAt: number,
    frequencyCap: number,
    status: NudgeOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.budget = budget;
    this.graceDays = graceDays;
    this.sendAt = sendAt;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: NudgeOverrideStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
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
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: NudgeOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netValue(): number {
    return Math.round((this.amount - this.sendAt) * 100) / 100;
  }

  copy(): NudgeOverride {
    return new NudgeOverride(
      this.code,
      this.title,
      this.amount,
      this.budget,
      this.graceDays,
      this.sendAt,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a nudge override in status idle. */
export function newNudgeOverride(code: string, title: string): NudgeOverride {
  return new NudgeOverride(code, title, 0, 0, 0, 0, 0, "idle");
}
