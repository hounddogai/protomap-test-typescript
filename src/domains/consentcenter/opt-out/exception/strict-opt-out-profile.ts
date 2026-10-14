import * as text from "../../../../kit/text.js";

/** Where a strict opt out profile is in its life cycle. */
export type StrictOptOutProfileStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a strict opt out profile and its current status. */
export class StrictOptOutProfile {
  code: string;
  name: string;
  phone: string;
  locale: string;
  label: string;
  amount: number;
  status: StrictOptOutProfileStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    locale: string,
    label: string,
    amount: number,
    status: StrictOptOutProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.locale = locale;
    this.label = label;
    this.amount = amount;
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

  canMoveTo(next: StrictOptOutProfileStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: StrictOptOutProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict opt out profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"strict opt out profile"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): StrictOptOutProfile {
    return new StrictOptOutProfile(this.code, this.name, this.phone, this.locale, this.label, this.amount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a strict opt out profile in status planned. */
export function newStrictOptOutProfile(code: string, name: string): StrictOptOutProfile {
  return new StrictOptOutProfile(code, name, "", "", "", 0, "planned");
}
