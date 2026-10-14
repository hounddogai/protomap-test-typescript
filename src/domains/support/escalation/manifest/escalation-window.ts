import * as text from "../../../../kit/text.js";

/** Where a escalation window is in its life cycle. */
export type EscalationWindowStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A escalation window. Its code is unique within a tenant. */
export class EscalationWindow {
  code: string;
  title: string;
  region: string;
  label: string;
  floorValue: number;
  unit: string;
  channel: string;
  bid: number;
  cohort: string;
  status: EscalationWindowStatus;

  constructor(
    code: string,
    title: string,
    region: string,
    label: string,
    floorValue: number,
    unit: string,
    channel: string,
    bid: number,
    cohort: string,
    status: EscalationWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.label = label;
    this.floorValue = floorValue;
    this.unit = unit;
    this.channel = channel;
    this.bid = bid;
    this.cohort = cohort;
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

  canMoveTo(next: EscalationWindowStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: EscalationWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedLoad(): number {
    return Math.round((this.floorValue - this.bid) * 100) / 100;
  }

  copy(): EscalationWindow {
    return new EscalationWindow(
      this.code,
      this.title,
      this.region,
      this.label,
      this.floorValue,
      this.unit,
      this.channel,
      this.bid,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a escalation window in status open. */
export function newEscalationWindow(code: string, title: string): EscalationWindow {
  return new EscalationWindow(code, title, "", "", 0, "", "", 0, "", "open");
}
