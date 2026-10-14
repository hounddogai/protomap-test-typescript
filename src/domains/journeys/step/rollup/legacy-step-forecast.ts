import * as text from "../../../../kit/text.js";

/** Where a legacy step forecast is in its life cycle. */
export type LegacyStepForecastStatus = "new" | "queued" | "running" | "done" | "failed";

/** A legacy step forecast as the step team keeps it. */
export class LegacyStepForecast {
  code: string;
  name: string;
  contactEmail: string;
  reviewer: string;
  score: number;
  attributes: Map<string, string>;
  notes: string;
  active: boolean;
  quantity: number;
  country: string;
  approved: boolean;
  status: LegacyStepForecastStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    reviewer: string,
    score: number,
    attributes: Map<string, string>,
    notes: string,
    active: boolean,
    quantity: number,
    country: string,
    approved: boolean,
    status: LegacyStepForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.reviewer = reviewer;
    this.score = score;
    this.attributes = attributes;
    this.notes = notes;
    this.active = active;
    this.quantity = quantity;
    this.country = country;
    this.approved = approved;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyStepForecastStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LegacyStepForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy step forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"legacy step forecast"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedTotal(): number {
    return Math.round((this.score + this.quantity) * 100) / 100;
  }

  copy(): LegacyStepForecast {
    return new LegacyStepForecast(
      this.code,
      this.name,
      this.contactEmail,
      this.reviewer,
      this.score,
      this.attributes,
      this.notes,
      this.active,
      this.quantity,
      this.country,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a legacy step forecast in status new. */
export function newLegacyStepForecast(code: string, name: string): LegacyStepForecast {
  return new LegacyStepForecast(code, name, "", "", 0, new Map<string, string>(), "", false, 0, "", false, "new");
}
