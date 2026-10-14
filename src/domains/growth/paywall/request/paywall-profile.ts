import * as text from "../../../../kit/text.js";

/** Where a paywall profile is in its life cycle. */
export type PaywallProfileStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a paywall profile and its current status. */
export class PaywallProfile {
  code: string;
  title: string;
  cost: number;
  summary: string;
  sendAt: number;
  status: PaywallProfileStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    summary: string,
    sendAt: number,
    status: PaywallProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.summary = summary;
    this.sendAt = sendAt;
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

  canMoveTo(next: PaywallProfileStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PaywallProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"paywall profile"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.sendAt - this.cost) * 100) / 100;
  }

  copy(): PaywallProfile {
    return new PaywallProfile(this.code, this.title, this.cost, this.summary, this.sendAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a paywall profile in status new. */
export function newPaywallProfile(code: string, title: string): PaywallProfile {
  return new PaywallProfile(code, title, 0, "", 0, "new");
}
