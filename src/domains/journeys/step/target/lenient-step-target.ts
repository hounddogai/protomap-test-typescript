/**
 * The lenient step target records of journeys's step work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient step target is in its life cycle. */
export type LenientStepTargetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A lenient step target. Its code is unique within a tenant. */
export class LenientStepTarget {
  code: string;
  title: string;
  discount: number;
  channel: string;
  reviewer: string;
  status: LenientStepTargetStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    channel: string,
    reviewer: string,
    status: LenientStepTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.channel = channel;
    this.reviewer = reviewer;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientStepTargetStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientStepTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient step target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.discount;
  }

  copy(): LenientStepTarget {
    return new LenientStepTarget(this.code, this.title, this.discount, this.channel, this.reviewer, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient step target in status planned. */
export function newLenientStepTarget(code: string, title: string): LenientStepTarget {
  return new LenientStepTarget(code, title, 0, "", "", "planned");
}
