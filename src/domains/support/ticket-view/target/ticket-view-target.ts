/**
 * The ticket view target records of support's ticket view work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a ticket view target is in its life cycle. */
export type TicketViewTargetStatus = "new" | "queued" | "running" | "done" | "failed";

/** One ticket view target, with what the planners need to act on it. */
export class TicketViewTarget {
  code: string;
  label: string;
  checksum: string;
  audienceId: string;
  ceiling: number;
  description: string;
  threshold: number;
  clicks: number;
  variant: string;
  status: TicketViewTargetStatus;

  constructor(
    code: string,
    label: string,
    checksum: string,
    audienceId: string,
    ceiling: number,
    description: string,
    threshold: number,
    clicks: number,
    variant: string,
    status: TicketViewTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.checksum = checksum;
    this.audienceId = audienceId;
    this.ceiling = ceiling;
    this.description = description;
    this.threshold = threshold;
    this.clicks = clicks;
    this.variant = variant;
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

  canMoveTo(next: TicketViewTargetStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TicketViewTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveLoad(): number {
    return Math.round(this.ceiling * this.threshold * 100) / 100;
  }

  copy(): TicketViewTarget {
    return new TicketViewTarget(
      this.code,
      this.label,
      this.checksum,
      this.audienceId,
      this.ceiling,
      this.description,
      this.threshold,
      this.clicks,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a ticket view target in status new. */
export function newTicketViewTarget(code: string, label: string): TicketViewTarget {
  return new TicketViewTarget(code, label, "", "", 0, "", 0, 0, "", "new");
}
