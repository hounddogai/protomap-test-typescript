import * as text from "../../../../kit/text.js";

/** Where a lenient deflection reservation is in its life cycle. */
export type LenientDeflectionReservationStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A lenient deflection reservation. Its code is unique within a tenant. */
export class LenientDeflectionReservation {
  code: string;
  label: string;
  category: string;
  locale: string;
  phone: string;
  quantity: number;
  status: LenientDeflectionReservationStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    locale: string,
    phone: string,
    quantity: number,
    status: LenientDeflectionReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.locale = locale;
    this.phone = phone;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientDeflectionReservationStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientDeflectionReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient deflection reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"lenient deflection reservation"} ${this.code}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): LenientDeflectionReservation {
    return new LenientDeflectionReservation(
      this.code,
      this.label,
      this.category,
      this.locale,
      this.phone,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a lenient deflection reservation in status draft. */
export function newLenientDeflectionReservation(code: string, label: string): LenientDeflectionReservation {
  return new LenientDeflectionReservation(code, label, "", "", "", 0, "draft");
}
