import * as text from "../../../../kit/text.js";

/** Where a placement draft is in its life cycle. */
export type PlacementDraftStatus = "created" | "validated" | "published" | "retired";

/** The record of a placement draft and its current status. */
export class PlacementDraft {
  code: string;
  name: string;
  endsAt: number;
  graceDays: number;
  currency: string;
  status: PlacementDraftStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    graceDays: number,
    currency: string,
    status: PlacementDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.graceDays = graceDays;
    this.currency = currency;
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

  canMoveTo(next: PlacementDraftStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PlacementDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedLoad(): number {
    return Math.round((this.graceDays - this.endsAt) * 100) / 100;
  }

  copy(): PlacementDraft {
    return new PlacementDraft(this.code, this.name, this.endsAt, this.graceDays, this.currency, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a placement draft in status created. */
export function newPlacementDraft(code: string, name: string): PlacementDraft {
  return new PlacementDraft(code, name, 0, 0, "", "created");
}
