/**
 * The manual activation window records of growth's activation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual activation window is in its life cycle. */
export type ManualActivationWindowStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One manual activation window, with what the planners need to act on it. */
export class ManualActivationWindow {
  code: string;
  name: string;
  description: string;
  checksum: string;
  maximum: number;
  sequence: number;
  startsAt: number;
  channel: string;
  budget: number;
  pinned: boolean;
  status: ManualActivationWindowStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    checksum: string,
    maximum: number,
    sequence: number,
    startsAt: number,
    channel: string,
    budget: number,
    pinned: boolean,
    status: ManualActivationWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.checksum = checksum;
    this.maximum = maximum;
    this.sequence = sequence;
    this.startsAt = startsAt;
    this.channel = channel;
    this.budget = budget;
    this.pinned = pinned;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualActivationWindowStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ManualActivationWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual activation window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"manual activation window"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.maximum - this.startsAt) * 100) / 100;
  }

  copy(): ManualActivationWindow {
    return new ManualActivationWindow(
      this.code,
      this.name,
      this.description,
      this.checksum,
      this.maximum,
      this.sequence,
      this.startsAt,
      this.channel,
      this.budget,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual activation window in status proposed. */
export function newManualActivationWindow(code: string, name: string): ManualActivationWindow {
  return new ManualActivationWindow(code, name, "", "", 0, 0, 0, "", 0, false, "proposed");
}
