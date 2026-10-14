import * as text from "../../../../kit/text.js";

/** Where a pending sla target is in its life cycle. */
export type PendingSlaTargetStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One pending sla target, with what the planners need to act on it. */
export class PendingSlaTarget {
  code: string;
  label: string;
  campaignRef: string;
  endsAt: number;
  score: number;
  maximum: number;
  discount: number;
  priority: number;
  capacity: number;
  status: PendingSlaTargetStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    endsAt: number,
    score: number,
    maximum: number,
    discount: number,
    priority: number,
    capacity: number,
    status: PendingSlaTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.endsAt = endsAt;
    this.score = score;
    this.maximum = maximum;
    this.discount = discount;
    this.priority = priority;
    this.capacity = capacity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingSlaTargetStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingSlaTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending sla target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedValue(): number {
    return Math.round((this.endsAt + this.capacity) * 100) / 100;
  }

  copy(): PendingSlaTarget {
    return new PendingSlaTarget(
      this.code,
      this.label,
      this.campaignRef,
      this.endsAt,
      this.score,
      this.maximum,
      this.discount,
      this.priority,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pending sla target in status open. */
export function newPendingSlaTarget(code: string, label: string): PendingSlaTarget {
  return new PendingSlaTarget(code, label, "", 0, 0, 0, 0, 0, 0, "open");
}
