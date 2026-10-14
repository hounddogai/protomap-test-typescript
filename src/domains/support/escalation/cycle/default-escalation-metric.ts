import * as text from "../../../../kit/text.js";

/** Where a default escalation metric is in its life cycle. */
export type DefaultEscalationMetricStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One default escalation metric, with what the planners need to act on it. */
export class DefaultEscalationMetric {
  code: string;
  title: string;
  expiresAt: number;
  notes: string;
  phone: string;
  bid: number;
  retries: number;
  locale: string;
  frequencyCap: number;
  floorValue: number;
  status: DefaultEscalationMetricStatus;

  constructor(
    code: string,
    title: string,
    expiresAt: number,
    notes: string,
    phone: string,
    bid: number,
    retries: number,
    locale: string,
    frequencyCap: number,
    floorValue: number,
    status: DefaultEscalationMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.notes = notes;
    this.phone = phone;
    this.bid = bid;
    this.retries = retries;
    this.locale = locale;
    this.frequencyCap = frequencyCap;
    this.floorValue = floorValue;
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

  canMoveTo(next: DefaultEscalationMetricStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: DefaultEscalationMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default escalation metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"default escalation metric"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round(this.expiresAt * this.frequencyCap * 100) / 100;
  }

  copy(): DefaultEscalationMetric {
    return new DefaultEscalationMetric(
      this.code,
      this.title,
      this.expiresAt,
      this.notes,
      this.phone,
      this.bid,
      this.retries,
      this.locale,
      this.frequencyCap,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default escalation metric in status planned. */
export function newDefaultEscalationMetric(code: string, title: string): DefaultEscalationMetric {
  return new DefaultEscalationMetric(code, title, 0, "", "", 0, 0, "", 0, 0, "planned");
}
