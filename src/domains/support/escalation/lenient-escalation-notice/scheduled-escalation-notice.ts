/**
 * The scheduled escalation notice records of support's escalation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled escalation notice is in its life cycle. */
export type ScheduledEscalationNoticeStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a scheduled escalation notice and its current status. */
export class ScheduledEscalationNotice {
  code: string;
  label: string;
  source: string;
  utmSource: string;
  name: string;
  notes: string;
  title: string;
  pinned: boolean;
  quantity: number;
  status: ScheduledEscalationNoticeStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    utmSource: string,
    name: string,
    notes: string,
    title: string,
    pinned: boolean,
    quantity: number,
    status: ScheduledEscalationNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.utmSource = utmSource;
    this.name = name;
    this.notes = notes;
    this.title = title;
    this.pinned = pinned;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledEscalationNoticeStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ScheduledEscalationNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled escalation notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"scheduled escalation notice"} ${this.code}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): ScheduledEscalationNotice {
    return new ScheduledEscalationNotice(
      this.code,
      this.label,
      this.source,
      this.utmSource,
      this.name,
      this.notes,
      this.title,
      this.pinned,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a scheduled escalation notice in status draft. */
export function newScheduledEscalationNotice(code: string, label: string): ScheduledEscalationNotice {
  return new ScheduledEscalationNotice(code, label, "", "", "", "", "", false, 0, "draft");
}
