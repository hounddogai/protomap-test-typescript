import * as text from "../../../../kit/text.js";

/** Where a lenient preference baseline is in its life cycle. */
export type LenientPreferenceBaselineStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A lenient preference baseline. Its code is unique within a tenant. */
export class LenientPreferenceBaseline {
  code: string;
  title: string;
  notes: string;
  description: string;
  category: string;
  sequence: number;
  utmSource: string;
  country: string;
  status: LenientPreferenceBaselineStatus;

  constructor(
    code: string,
    title: string,
    notes: string,
    description: string,
    category: string,
    sequence: number,
    utmSource: string,
    country: string,
    status: LenientPreferenceBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.notes = notes;
    this.description = description;
    this.category = category;
    this.sequence = sequence;
    this.utmSource = utmSource;
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

  canMoveTo(next: LenientPreferenceBaselineStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientPreferenceBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient preference baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient preference baseline"} ${this.code}`;
  }

  measuredValue(): number {
    return this.sequence;
  }

  copy(): LenientPreferenceBaseline {
    return new LenientPreferenceBaseline(
      this.code,
      this.title,
      this.notes,
      this.description,
      this.category,
      this.sequence,
      this.utmSource,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a lenient preference baseline in status planned. */
export function newLenientPreferenceBaseline(code: string, title: string): LenientPreferenceBaseline {
  return new LenientPreferenceBaseline(code, title, "", "", "", 0, "", "", "planned");
}
