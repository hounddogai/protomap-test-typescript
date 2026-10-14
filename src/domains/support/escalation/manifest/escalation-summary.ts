import * as text from "../../../../kit/text.js";

/** Where a escalation summary is in its life cycle. */
export type EscalationSummaryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A escalation summary as the escalation team keeps it. */
export class EscalationSummary {
  code: string;
  label: string;
  variant: string;
  priority: number;
  windowDays: number;
  attributes: Map<string, string>;
  status: EscalationSummaryStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    priority: number,
    windowDays: number,
    attributes: Map<string, string>,
    status: EscalationSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.priority = priority;
    this.windowDays = windowDays;
    this.attributes = attributes;
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

  canMoveTo(next: EscalationSummaryStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EscalationSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"escalation summary"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveVolume(): number {
    return Math.round(this.windowDays * this.priority * 100) / 100;
  }

  copy(): EscalationSummary {
    return new EscalationSummary(
      this.code,
      this.label,
      this.variant,
      this.priority,
      this.windowDays,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a escalation summary in status proposed. */
export function newEscalationSummary(code: string, label: string): EscalationSummary {
  return new EscalationSummary(code, label, "", 0, 0, new Map<string, string>(), "proposed");
}
