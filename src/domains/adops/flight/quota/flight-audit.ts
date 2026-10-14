import * as text from "../../../../kit/text.js";

/** Where a flight audit is in its life cycle. */
export type FlightAuditStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One flight audit, with what the planners need to act on it. */
export class FlightAudit {
  code: string;
  label: string;
  quantity: number;
  externalRef: string;
  openRate: number;
  timezone: string;
  archived: boolean;
  clicks: number;
  locale: string;
  minimum: number;
  graceDays: number;
  status: FlightAuditStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    externalRef: string,
    openRate: number,
    timezone: string,
    archived: boolean,
    clicks: number,
    locale: string,
    minimum: number,
    graceDays: number,
    status: FlightAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.externalRef = externalRef;
    this.openRate = openRate;
    this.timezone = timezone;
    this.archived = archived;
    this.clicks = clicks;
    this.locale = locale;
    this.minimum = minimum;
    this.graceDays = graceDays;
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

  canMoveTo(next: FlightAuditStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: FlightAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"flight audit"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round(this.quantity * this.openRate * 100) / 100;
  }

  copy(): FlightAudit {
    return new FlightAudit(
      this.code,
      this.label,
      this.quantity,
      this.externalRef,
      this.openRate,
      this.timezone,
      this.archived,
      this.clicks,
      this.locale,
      this.minimum,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a flight audit in status planned. */
export function newFlightAudit(code: string, label: string): FlightAudit {
  return new FlightAudit(code, label, 0, "", 0, "", false, 0, "", 0, 0, "planned");
}
