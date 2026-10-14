import * as text from "../../../../kit/text.js";

/** Where a strict suppression exception is in its life cycle. */
export type StrictSuppressionExceptionStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A strict suppression exception. Its code is unique within a tenant. */
export class StrictSuppressionException {
  code: string;
  name: string;
  priority: number;
  durationMinutes: number;
  margin: number;
  notes: string;
  sequence: number;
  locale: string;
  segment: string;
  status: StrictSuppressionExceptionStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    durationMinutes: number,
    margin: number,
    notes: string,
    sequence: number,
    locale: string,
    segment: string,
    status: StrictSuppressionExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.durationMinutes = durationMinutes;
    this.margin = margin;
    this.notes = notes;
    this.sequence = sequence;
    this.locale = locale;
    this.segment = segment;
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

  canMoveTo(next: StrictSuppressionExceptionStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictSuppressionExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict suppression exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict suppression exception"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.margin - this.durationMinutes) * 100) / 100;
  }

  copy(): StrictSuppressionException {
    return new StrictSuppressionException(
      this.code,
      this.name,
      this.priority,
      this.durationMinutes,
      this.margin,
      this.notes,
      this.sequence,
      this.locale,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a strict suppression exception in status idle. */
export function newStrictSuppressionException(code: string, name: string): StrictSuppressionException {
  return new StrictSuppressionException(code, name, 0, 0, 0, "", 0, "", "", "idle");
}
