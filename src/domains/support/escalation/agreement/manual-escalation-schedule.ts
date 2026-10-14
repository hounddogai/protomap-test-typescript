import * as text from "../../../../kit/text.js";

/** Where a manual escalation schedule is in its life cycle. */
export type ManualEscalationScheduleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A manual escalation schedule. Its code is unique within a tenant. */
export class ManualEscalationSchedule {
  code: string;
  title: string;
  ceiling: number;
  phone: string;
  summary: string;
  maximum: number;
  retries: number;
  active: boolean;
  variant: string;
  limit: number;
  locale: string;
  status: ManualEscalationScheduleStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    phone: string,
    summary: string,
    maximum: number,
    retries: number,
    active: boolean,
    variant: string,
    limit: number,
    locale: string,
    status: ManualEscalationScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.phone = phone;
    this.summary = summary;
    this.maximum = maximum;
    this.retries = retries;
    this.active = active;
    this.variant = variant;
    this.limit = limit;
    this.locale = locale;
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

  canMoveTo(next: ManualEscalationScheduleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ManualEscalationScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual escalation schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedTotal(): number {
    return Math.round((this.limit - this.maximum) * 100) / 100;
  }

  copy(): ManualEscalationSchedule {
    return new ManualEscalationSchedule(
      this.code,
      this.title,
      this.ceiling,
      this.phone,
      this.summary,
      this.maximum,
      this.retries,
      this.active,
      this.variant,
      this.limit,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual escalation schedule in status planned. */
export function newManualEscalationSchedule(code: string, title: string): ManualEscalationSchedule {
  return new ManualEscalationSchedule(code, title, 0, "", "", 0, 0, false, "", 0, "", "planned");
}
