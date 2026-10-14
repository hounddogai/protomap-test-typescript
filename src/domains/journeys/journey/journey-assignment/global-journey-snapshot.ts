import * as text from "../../../../kit/text.js";

/** Where a global journey snapshot is in its life cycle. */
export type GlobalJourneySnapshotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A global journey snapshot as the journey team keeps it. */
export class GlobalJourneySnapshot {
  code: string;
  title: string;
  currency: string;
  sequence: number;
  ceiling: number;
  score: number;
  category: string;
  cost: number;
  country: string;
  status: GlobalJourneySnapshotStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    sequence: number,
    ceiling: number,
    score: number,
    category: string,
    cost: number,
    country: string,
    status: GlobalJourneySnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.sequence = sequence;
    this.ceiling = ceiling;
    this.score = score;
    this.category = category;
    this.cost = cost;
    this.country = country;
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

  canMoveTo(next: GlobalJourneySnapshotStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: GlobalJourneySnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global journey snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedTotal(): number {
    return Math.round(this.cost * this.sequence * 100) / 100;
  }

  copy(): GlobalJourneySnapshot {
    return new GlobalJourneySnapshot(
      this.code,
      this.title,
      this.currency,
      this.sequence,
      this.ceiling,
      this.score,
      this.category,
      this.cost,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a global journey snapshot in status proposed. */
export function newGlobalJourneySnapshot(code: string, title: string): GlobalJourneySnapshot {
  return new GlobalJourneySnapshot(code, title, "", 0, 0, 0, "", 0, "", "proposed");
}
