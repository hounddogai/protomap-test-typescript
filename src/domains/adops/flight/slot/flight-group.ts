import * as text from "../../../../kit/text.js";

/** Where a flight group is in its life cycle. */
export type FlightGroupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a flight group and its current status. */
export class FlightGroup {
  code: string;
  label: string;
  approved: boolean;
  ratio: number;
  retries: number;
  weight: number;
  archived: boolean;
  journeyId: string;
  locale: string;
  name: string;
  description: string;
  status: FlightGroupStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    ratio: number,
    retries: number,
    weight: number,
    archived: boolean,
    journeyId: string,
    locale: string,
    name: string,
    description: string,
    status: FlightGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.ratio = ratio;
    this.retries = retries;
    this.weight = weight;
    this.archived = archived;
    this.journeyId = journeyId;
    this.locale = locale;
    this.name = name;
    this.description = description;
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

  canMoveTo(next: FlightGroupStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: FlightGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedLoad(): number {
    return Math.round((this.weight + this.ratio) * 100) / 100;
  }

  copy(): FlightGroup {
    return new FlightGroup(
      this.code,
      this.label,
      this.approved,
      this.ratio,
      this.retries,
      this.weight,
      this.archived,
      this.journeyId,
      this.locale,
      this.name,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a flight group in status planned. */
export function newFlightGroup(code: string, label: string): FlightGroup {
  return new FlightGroup(code, label, false, 0, 0, 0, false, "", "", "", "", "planned");
}
