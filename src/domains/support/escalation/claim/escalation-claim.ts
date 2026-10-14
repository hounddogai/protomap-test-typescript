/**
 * The escalation claim records of support's escalation work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a escalation claim is in its life cycle. */
export type EscalationClaimStatus = "created" | "validated" | "published" | "retired";

/** One escalation claim, with what the planners need to act on it. */
export class EscalationClaim {
  code: string;
  title: string;
  durationMinutes: number;
  pinned: boolean;
  journeyId: string;
  externalRef: string;
  sendAt: number;
  status: EscalationClaimStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    pinned: boolean,
    journeyId: string,
    externalRef: string,
    sendAt: number,
    status: EscalationClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.pinned = pinned;
    this.journeyId = journeyId;
    this.externalRef = externalRef;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: EscalationClaimStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EscalationClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round(this.durationMinutes * this.sendAt * 100) / 100;
  }

  copy(): EscalationClaim {
    return new EscalationClaim(
      this.code,
      this.title,
      this.durationMinutes,
      this.pinned,
      this.journeyId,
      this.externalRef,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a escalation claim in status created. */
export function newEscalationClaim(code: string, title: string): EscalationClaim {
  return new EscalationClaim(code, title, 0, false, "", "", 0, "created");
}
