/**
 * The pending macro claim records of support's macro work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending macro claim is in its life cycle. */
export type PendingMacroClaimStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One pending macro claim, with what the planners need to act on it. */
export class PendingMacroClaim {
  code: string;
  label: string;
  timezone: string;
  ratio: number;
  budget: number;
  channel: string;
  status: PendingMacroClaimStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    ratio: number,
    budget: number,
    channel: string,
    status: PendingMacroClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.ratio = ratio;
    this.budget = budget;
    this.channel = channel;
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

  canMoveTo(next: PendingMacroClaimStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        switch (next) {
          case "ready":
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

  moveTo(next: PendingMacroClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending macro claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedValue(): number {
    return Math.round(this.budget * this.ratio * 100) / 100;
  }

  copy(): PendingMacroClaim {
    return new PendingMacroClaim(
      this.code,
      this.label,
      this.timezone,
      this.ratio,
      this.budget,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a pending macro claim in status idle. */
export function newPendingMacroClaim(code: string, label: string): PendingMacroClaim {
  return new PendingMacroClaim(code, label, "", 0, 0, "", "idle");
}
