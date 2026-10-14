import * as text from "../../../../kit/text.js";

/** Where a global deflection baseline is in its life cycle. */
export type GlobalDeflectionBaselineStatus = "requested" | "granted" | "revoked" | "expired";

/** A global deflection baseline as the deflection team keeps it. */
export class GlobalDeflectionBaseline {
  code: string;
  label: string;
  locale: string;
  description: string;
  cost: number;
  status: GlobalDeflectionBaselineStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    description: string,
    cost: number,
    status: GlobalDeflectionBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.description = description;
    this.cost = cost;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalDeflectionBaselineStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalDeflectionBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global deflection baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.cost;
  }

  copy(): GlobalDeflectionBaseline {
    return new GlobalDeflectionBaseline(this.code, this.label, this.locale, this.description, this.cost, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a global deflection baseline in status requested. */
export function newGlobalDeflectionBaseline(code: string, label: string): GlobalDeflectionBaseline {
  return new GlobalDeflectionBaseline(code, label, "", "", 0, "requested");
}
