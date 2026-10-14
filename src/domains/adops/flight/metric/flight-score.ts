import * as text from "../../../../kit/text.js";

/** Where a flight score is in its life cycle. */
export type FlightScoreStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A flight score. Its code is unique within a tenant. */
export class FlightScore {
  code: string;
  label: string;
  attempts: number;
  windowDays: number;
  variant: string;
  margin: number;
  archived: boolean;
  visible: boolean;
  country: string;
  locale: string;
  status: FlightScoreStatus;

  constructor(
    code: string,
    label: string,
    attempts: number,
    windowDays: number,
    variant: string,
    margin: number,
    archived: boolean,
    visible: boolean,
    country: string,
    locale: string,
    status: FlightScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attempts = attempts;
    this.windowDays = windowDays;
    this.variant = variant;
    this.margin = margin;
    this.archived = archived;
    this.visible = visible;
    this.country = country;
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

  canMoveTo(next: FlightScoreStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
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

  moveTo(next: FlightScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedTotal(): number {
    return Math.round(this.margin * this.attempts * 100) / 100;
  }

  copy(): FlightScore {
    return new FlightScore(
      this.code,
      this.label,
      this.attempts,
      this.windowDays,
      this.variant,
      this.margin,
      this.archived,
      this.visible,
      this.country,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a flight score in status planned. */
export function newFlightScore(code: string, label: string): FlightScore {
  return new FlightScore(code, label, 0, 0, "", 0, false, false, "", "", "planned");
}
