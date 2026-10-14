import * as text from "../../../../kit/text.js";

/** Where a pending escalation exception is in its life cycle. */
export type PendingEscalationExceptionStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One pending escalation exception, with what the planners need to act on it. */
export class PendingEscalationException {
  code: string;
  label: string;
  locale: string;
  segment: string;
  archived: boolean;
  ceiling: number;
  amount: number;
  capacity: number;
  attributes: Map<string, string>;
  status: PendingEscalationExceptionStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    segment: string,
    archived: boolean,
    ceiling: number,
    amount: number,
    capacity: number,
    attributes: Map<string, string>,
    status: PendingEscalationExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.segment = segment;
    this.archived = archived;
    this.ceiling = ceiling;
    this.amount = amount;
    this.capacity = capacity;
    this.attributes = attributes;
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

  canMoveTo(next: PendingEscalationExceptionStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PendingEscalationExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending escalation exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedTotal(): number {
    return Math.round(this.capacity * this.amount * 100) / 100;
  }

  copy(): PendingEscalationException {
    return new PendingEscalationException(
      this.code,
      this.label,
      this.locale,
      this.segment,
      this.archived,
      this.ceiling,
      this.amount,
      this.capacity,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pending escalation exception in status planned. */
export function newPendingEscalationException(code: string, label: string): PendingEscalationException {
  return new PendingEscalationException(code, label, "", "", false, 0, 0, 0, new Map<string, string>(), "planned");
}
