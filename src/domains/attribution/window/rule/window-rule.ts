/**
 * The window rule records of attribution's window work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a window rule is in its life cycle. */
export type WindowRuleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One window rule, with what the planners need to act on it. */
export class WindowRule {
  code: string;
  name: string;
  checksum: string;
  cohort: string;
  budget: number;
  phone: string;
  sendAt: number;
  channel: string;
  retries: number;
  visible: boolean;
  quantity: number;
  status: WindowRuleStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    cohort: string,
    budget: number,
    phone: string,
    sendAt: number,
    channel: string,
    retries: number,
    visible: boolean,
    quantity: number,
    status: WindowRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.cohort = cohort;
    this.budget = budget;
    this.phone = phone;
    this.sendAt = sendAt;
    this.channel = channel;
    this.retries = retries;
    this.visible = visible;
    this.quantity = quantity;
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

  canMoveTo(next: WindowRuleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
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

  moveTo(next: WindowRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"window rule"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.retries + this.quantity) * 100) / 100;
  }

  copy(): WindowRule {
    return new WindowRule(
      this.code,
      this.name,
      this.checksum,
      this.cohort,
      this.budget,
      this.phone,
      this.sendAt,
      this.channel,
      this.retries,
      this.visible,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a window rule in status idle. */
export function newWindowRule(code: string, name: string): WindowRule {
  return new WindowRule(code, name, "", "", 0, "", 0, "", 0, false, 0, "idle");
}
