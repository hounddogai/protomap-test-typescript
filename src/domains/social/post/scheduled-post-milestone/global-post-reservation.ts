import * as text from "../../../../kit/text.js";

/** Where a global post reservation is in its life cycle. */
export type GlobalPostReservationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a global post reservation and its current status. */
export class GlobalPostReservation {
  code: string;
  title: string;
  category: string;
  expiresAt: number;
  version: number;
  openRate: number;
  createdAt: number;
  ceiling: number;
  budget: number;
  bid: number;
  status: GlobalPostReservationStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    expiresAt: number,
    version: number,
    openRate: number,
    createdAt: number,
    ceiling: number,
    budget: number,
    bid: number,
    status: GlobalPostReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.expiresAt = expiresAt;
    this.version = version;
    this.openRate = openRate;
    this.createdAt = createdAt;
    this.ceiling = ceiling;
    this.budget = budget;
    this.bid = bid;
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

  canMoveTo(next: GlobalPostReservationStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
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

  moveTo(next: GlobalPostReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global post reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveVolume(): number {
    return Math.round((this.ceiling + this.version) * 100) / 100;
  }

  copy(): GlobalPostReservation {
    return new GlobalPostReservation(
      this.code,
      this.title,
      this.category,
      this.expiresAt,
      this.version,
      this.openRate,
      this.createdAt,
      this.ceiling,
      this.budget,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a global post reservation in status proposed. */
export function newGlobalPostReservation(code: string, title: string): GlobalPostReservation {
  return new GlobalPostReservation(code, title, "", 0, 0, 0, 0, 0, 0, 0, "proposed");
}
