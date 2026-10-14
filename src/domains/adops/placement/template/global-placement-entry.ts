import * as text from "../../../../kit/text.js";

/** Where a global placement entry is in its life cycle. */
export type GlobalPlacementEntryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One global placement entry, with what the planners need to act on it. */
export class GlobalPlacementEntry {
  code: string;
  title: string;
  graceDays: number;
  bid: number;
  startsAt: number;
  quantity: number;
  revision: number;
  priority: number;
  status: GlobalPlacementEntryStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    bid: number,
    startsAt: number,
    quantity: number,
    revision: number,
    priority: number,
    status: GlobalPlacementEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.bid = bid;
    this.startsAt = startsAt;
    this.quantity = quantity;
    this.revision = revision;
    this.priority = priority;
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

  canMoveTo(next: GlobalPlacementEntryStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: GlobalPlacementEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global placement entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"global placement entry"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.graceDays - this.quantity) * 100) / 100;
  }

  copy(): GlobalPlacementEntry {
    return new GlobalPlacementEntry(
      this.code,
      this.title,
      this.graceDays,
      this.bid,
      this.startsAt,
      this.quantity,
      this.revision,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a global placement entry in status draft. */
export function newGlobalPlacementEntry(code: string, title: string): GlobalPlacementEntry {
  return new GlobalPlacementEntry(code, title, 0, 0, 0, 0, 0, 0, "draft");
}
