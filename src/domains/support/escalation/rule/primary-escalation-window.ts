import * as text from "../../../../kit/text.js";

/** Where a primary escalation window is in its life cycle. */
export type PrimaryEscalationWindowStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A primary escalation window. Its code is unique within a tenant. */
export class PrimaryEscalationWindow {
  code: string;
  label: string;
  category: string;
  ownerId: string;
  bid: number;
  updatedAt: number;
  priority: number;
  rate: number;
  cohort: string;
  retries: number;
  status: PrimaryEscalationWindowStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    ownerId: string,
    bid: number,
    updatedAt: number,
    priority: number,
    rate: number,
    cohort: string,
    retries: number,
    status: PrimaryEscalationWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.ownerId = ownerId;
    this.bid = bid;
    this.updatedAt = updatedAt;
    this.priority = priority;
    this.rate = rate;
    this.cohort = cohort;
    this.retries = retries;
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

  canMoveTo(next: PrimaryEscalationWindowStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryEscalationWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary escalation window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedTotal(): number {
    return Math.round(this.retries * this.priority * 100) / 100;
  }

  copy(): PrimaryEscalationWindow {
    return new PrimaryEscalationWindow(
      this.code,
      this.label,
      this.category,
      this.ownerId,
      this.bid,
      this.updatedAt,
      this.priority,
      this.rate,
      this.cohort,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a primary escalation window in status planned. */
export function newPrimaryEscalationWindow(code: string, label: string): PrimaryEscalationWindow {
  return new PrimaryEscalationWindow(code, label, "", "", 0, 0, 0, 0, "", 0, "planned");
}
