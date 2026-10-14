import * as text from "../../../../kit/text.js";

/** Where a regional credit baseline is in its life cycle. */
export type RegionalCreditBaselineStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A regional credit baseline as the credit team keeps it. */
export class RegionalCreditBaseline {
  code: string;
  label: string;
  ownerId: string;
  createdAt: number;
  locale: string;
  title: string;
  status: RegionalCreditBaselineStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    createdAt: number,
    locale: string,
    title: string,
    status: RegionalCreditBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.createdAt = createdAt;
    this.locale = locale;
    this.title = title;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalCreditBaselineStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RegionalCreditBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional credit baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): RegionalCreditBaseline {
    return new RegionalCreditBaseline(
      this.code,
      this.label,
      this.ownerId,
      this.createdAt,
      this.locale,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional credit baseline in status proposed. */
export function newRegionalCreditBaseline(code: string, label: string): RegionalCreditBaseline {
  return new RegionalCreditBaseline(code, label, "", 0, "", "", "proposed");
}
