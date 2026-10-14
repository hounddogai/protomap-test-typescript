import * as text from "../../../../kit/text.js";

/** Where a preference reservation is in its life cycle. */
export type PreferenceReservationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A preference reservation. Its code is unique within a tenant. */
export class PreferenceReservation {
  code: string;
  label: string;
  discount: number;
  sequence: number;
  category: string;
  archived: boolean;
  ratio: number;
  locale: string;
  weight: number;
  status: PreferenceReservationStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    sequence: number,
    category: string,
    archived: boolean,
    ratio: number,
    locale: string,
    weight: number,
    status: PreferenceReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.sequence = sequence;
    this.category = category;
    this.archived = archived;
    this.ratio = ratio;
    this.locale = locale;
    this.weight = weight;
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

  canMoveTo(next: PreferenceReservationStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
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

  moveTo(next: PreferenceReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedExposure(): number {
    return Math.round((this.weight - this.sequence) * 100) / 100;
  }

  copy(): PreferenceReservation {
    return new PreferenceReservation(
      this.code,
      this.label,
      this.discount,
      this.sequence,
      this.category,
      this.archived,
      this.ratio,
      this.locale,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a preference reservation in status planned. */
export function newPreferenceReservation(code: string, label: string): PreferenceReservation {
  return new PreferenceReservation(code, label, 0, 0, "", false, 0, "", 0, "planned");
}
