import * as text from "../../../../kit/text.js";

/** Where a pending tier audit is in its life cycle. */
export type PendingTierAuditStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a pending tier audit and its current status. */
export class PendingTierAudit {
  code: string;
  title: string;
  quantity: number;
  notes: string;
  locale: string;
  pinned: boolean;
  margin: number;
  source: string;
  active: boolean;
  cohort: string;
  status: PendingTierAuditStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    notes: string,
    locale: string,
    pinned: boolean,
    margin: number,
    source: string,
    active: boolean,
    cohort: string,
    status: PendingTierAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.notes = notes;
    this.locale = locale;
    this.pinned = pinned;
    this.margin = margin;
    this.source = source;
    this.active = active;
    this.cohort = cohort;
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

  canMoveTo(next: PendingTierAuditStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "draining";
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingTierAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending tier audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedValue(): number {
    return Math.round((this.margin + this.quantity) * 100) / 100;
  }

  copy(): PendingTierAudit {
    return new PendingTierAudit(
      this.code,
      this.title,
      this.quantity,
      this.notes,
      this.locale,
      this.pinned,
      this.margin,
      this.source,
      this.active,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pending tier audit in status idle. */
export function newPendingTierAudit(code: string, title: string): PendingTierAudit {
  return new PendingTierAudit(code, title, 0, "", "", false, 0, "", false, "", "idle");
}
