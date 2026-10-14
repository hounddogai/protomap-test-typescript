import * as text from "../../../../kit/text.js";

/** Where a preference mapping is in its life cycle. */
export type PreferenceMappingStatus = "created" | "validated" | "published" | "retired";

/** The record of a preference mapping and its current status. */
export class PreferenceMapping {
  code: string;
  name: string;
  conversionRate: number;
  minimum: number;
  audienceId: string;
  discount: number;
  title: string;
  locale: string;
  budget: number;
  attempts: number;
  endsAt: number;
  status: PreferenceMappingStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    minimum: number,
    audienceId: string,
    discount: number,
    title: string,
    locale: string,
    budget: number,
    attempts: number,
    endsAt: number,
    status: PreferenceMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.minimum = minimum;
    this.audienceId = audienceId;
    this.discount = discount;
    this.title = title;
    this.locale = locale;
    this.budget = budget;
    this.attempts = attempts;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PreferenceMappingStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PreferenceMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"preference mapping"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.budget - this.attempts) * 100) / 100;
  }

  copy(): PreferenceMapping {
    return new PreferenceMapping(
      this.code,
      this.name,
      this.conversionRate,
      this.minimum,
      this.audienceId,
      this.discount,
      this.title,
      this.locale,
      this.budget,
      this.attempts,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a preference mapping in status created. */
export function newPreferenceMapping(code: string, name: string): PreferenceMapping {
  return new PreferenceMapping(code, name, 0, 0, "", 0, "", "", 0, 0, 0, "created");
}
