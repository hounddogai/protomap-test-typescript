/**
 * The pending path proposal records of attribution's path work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending path proposal is in its life cycle. */
export type PendingPathProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A pending path proposal as the path team keeps it. */
export class PendingPathProposal {
  code: string;
  name: string;
  utmSource: string;
  attempts: number;
  active: boolean;
  status: PendingPathProposalStatus;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    attempts: number,
    active: boolean,
    status: PendingPathProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.attempts = attempts;
    this.active = active;
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

  canMoveTo(next: PendingPathProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PendingPathProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending path proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.attempts;
  }

  copy(): PendingPathProposal {
    return new PendingPathProposal(this.code, this.name, this.utmSource, this.attempts, this.active, this.status);
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a pending path proposal in status idle. */
export function newPendingPathProposal(code: string, name: string): PendingPathProposal {
  return new PendingPathProposal(code, name, "", 0, false, "idle");
}
