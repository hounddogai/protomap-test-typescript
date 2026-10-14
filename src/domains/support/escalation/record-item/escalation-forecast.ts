import * as text from "../../../../kit/text.js";

/** Where a escalation forecast is in its life cycle. */
export type EscalationForecastStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A escalation forecast. Its code is unique within a tenant. */
export class EscalationForecast {
  code: string;
  label: string;
  updatedAt: number;
  active: boolean;
  contactEmail: string;
  frequencyCap: number;
  rate: number;
  country: string;
  status: EscalationForecastStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    active: boolean,
    contactEmail: string,
    frequencyCap: number,
    rate: number,
    country: string,
    status: EscalationForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.active = active;
    this.contactEmail = contactEmail;
    this.frequencyCap = frequencyCap;
    this.rate = rate;
    this.country = country;
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

  canMoveTo(next: EscalationForecastStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EscalationForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveExposure(): number {
    return Math.round((this.frequencyCap - this.updatedAt) * 100) / 100;
  }

  copy(): EscalationForecast {
    return new EscalationForecast(
      this.code,
      this.label,
      this.updatedAt,
      this.active,
      this.contactEmail,
      this.frequencyCap,
      this.rate,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a escalation forecast in status planned. */
export function newEscalationForecast(code: string, label: string): EscalationForecast {
  return new EscalationForecast(code, label, 0, false, "", 0, 0, "", "planned");
}
