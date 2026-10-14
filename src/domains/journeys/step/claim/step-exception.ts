import * as text from "../../../../kit/text.js";

/** Where a step exception is in its life cycle. */
export type StepExceptionStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a step exception and its current status. */
export class StepException {
  code: string;
  label: string;
  active: boolean;
  sequence: number;
  expiresAt: number;
  locale: string;
  archived: boolean;
  durationMinutes: number;
  amount: number;
  attributes: Map<string, string>;
  name: string;
  status: StepExceptionStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    sequence: number,
    expiresAt: number,
    locale: string,
    archived: boolean,
    durationMinutes: number,
    amount: number,
    attributes: Map<string, string>,
    name: string,
    status: StepExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.sequence = sequence;
    this.expiresAt = expiresAt;
    this.locale = locale;
    this.archived = archived;
    this.durationMinutes = durationMinutes;
    this.amount = amount;
    this.attributes = attributes;
    this.name = name;
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

  canMoveTo(next: StepExceptionStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: StepExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"step exception"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedTotal(): number {
    return Math.round((this.durationMinutes + this.sequence) * 100) / 100;
  }

  copy(): StepException {
    return new StepException(
      this.code,
      this.label,
      this.active,
      this.sequence,
      this.expiresAt,
      this.locale,
      this.archived,
      this.durationMinutes,
      this.amount,
      this.attributes,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a step exception in status open. */
export function newStepException(code: string, label: string): StepException {
  return new StepException(code, label, false, 0, 0, "", false, 0, 0, new Map<string, string>(), "", "open");
}
