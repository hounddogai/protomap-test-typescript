import * as text from "../../../../kit/text.js";

/** Where a preference estimate is in its life cycle. */
export type PreferenceEstimateStatus = "created" | "validated" | "published" | "retired";

/** A preference estimate as the preference team keeps it. */
export class PreferenceEstimate {
  code: string;
  title: string;
  endsAt: number;
  phone: string;
  variant: string;
  floorValue: number;
  name: string;
  locale: string;
  status: PreferenceEstimateStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    phone: string,
    variant: string,
    floorValue: number,
    name: string,
    locale: string,
    status: PreferenceEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.phone = phone;
    this.variant = variant;
    this.floorValue = floorValue;
    this.name = name;
    this.locale = locale;
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

  canMoveTo(next: PreferenceEstimateStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
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

  moveTo(next: PreferenceEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"preference estimate"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.endsAt - this.floorValue) * 100) / 100;
  }

  copy(): PreferenceEstimate {
    return new PreferenceEstimate(
      this.code,
      this.title,
      this.endsAt,
      this.phone,
      this.variant,
      this.floorValue,
      this.name,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a preference estimate in status created. */
export function newPreferenceEstimate(code: string, title: string): PreferenceEstimate {
  return new PreferenceEstimate(code, title, 0, "", "", 0, "", "", "created");
}
