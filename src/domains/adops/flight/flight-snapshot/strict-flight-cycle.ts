import * as text from "../../../../kit/text.js";

/** Where a strict flight cycle is in its life cycle. */
export type StrictFlightCycleStatus = "requested" | "granted" | "revoked" | "expired";

/** A strict flight cycle. Its code is unique within a tenant. */
export class StrictFlightCycle {
  code: string;
  label: string;
  category: string;
  title: string;
  updatedAt: number;
  cost: number;
  locale: string;
  status: StrictFlightCycleStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    title: string,
    updatedAt: number,
    cost: number,
    locale: string,
    status: StrictFlightCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.title = title;
    this.updatedAt = updatedAt;
    this.cost = cost;
    this.locale = locale;
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

  canMoveTo(next: StrictFlightCycleStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictFlightCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict flight cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedValue(): number {
    return Math.round(this.cost * this.updatedAt * 100) / 100;
  }

  copy(): StrictFlightCycle {
    return new StrictFlightCycle(
      this.code,
      this.label,
      this.category,
      this.title,
      this.updatedAt,
      this.cost,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a strict flight cycle in status requested. */
export function newStrictFlightCycle(code: string, label: string): StrictFlightCycle {
  return new StrictFlightCycle(code, label, "", "", 0, 0, "", "requested");
}
