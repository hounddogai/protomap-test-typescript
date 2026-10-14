import * as text from "../../../../kit/text.js";

/** Where a placement window is in its life cycle. */
export type PlacementWindowStatus = "new" | "queued" | "running" | "done" | "failed";

/** A placement window as the placement team keeps it. */
export class PlacementWindow {
  code: string;
  title: string;
  pinned: boolean;
  weight: number;
  endsAt: number;
  approved: boolean;
  budget: number;
  status: PlacementWindowStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    weight: number,
    endsAt: number,
    approved: boolean,
    budget: number,
    status: PlacementWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.weight = weight;
    this.endsAt = endsAt;
    this.approved = approved;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PlacementWindowStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PlacementWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"placement window"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.budget - this.endsAt) * 100) / 100;
  }

  copy(): PlacementWindow {
    return new PlacementWindow(
      this.code,
      this.title,
      this.pinned,
      this.weight,
      this.endsAt,
      this.approved,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a placement window in status new. */
export function newPlacementWindow(code: string, title: string): PlacementWindow {
  return new PlacementWindow(code, title, false, 0, 0, false, 0, "new");
}
