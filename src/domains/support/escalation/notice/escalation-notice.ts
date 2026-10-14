/**
 * The escalation notice records of support's escalation work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a escalation notice is in its life cycle. */
export type EscalationNoticeStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A escalation notice. Its code is unique within a tenant. */
export class EscalationNotice {
  code: string;
  title: string;
  budget: number;
  unit: string;
  summary: string;
  channel: string;
  status: EscalationNoticeStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    unit: string,
    summary: string,
    channel: string,
    status: EscalationNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.unit = unit;
    this.summary = summary;
    this.channel = channel;
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

  canMoveTo(next: EscalationNoticeStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EscalationNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"escalation notice"} ${this.code}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): EscalationNotice {
    return new EscalationNotice(this.code, this.title, this.budget, this.unit, this.summary, this.channel, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a escalation notice in status proposed. */
export function newEscalationNotice(code: string, title: string): EscalationNotice {
  return new EscalationNotice(code, title, 0, "", "", "", "proposed");
}
