import * as text from "../../../../kit/text.js";

/** Where a fallback preference item is in its life cycle. */
export type FallbackPreferenceItemStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a fallback preference item and its current status. */
export class FallbackPreferenceItem {
  code: string;
  title: string;
  budget: number;
  ownerId: string;
  channel: string;
  capacity: number;
  summary: string;
  status: FallbackPreferenceItemStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    ownerId: string,
    channel: string,
    capacity: number,
    summary: string,
    status: FallbackPreferenceItemStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.ownerId = ownerId;
    this.channel = channel;
    this.capacity = capacity;
    this.summary = summary;
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

  canMoveTo(next: FallbackPreferenceItemStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: FallbackPreferenceItemStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback preference item ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback preference item"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.budget - this.capacity) * 100) / 100;
  }

  copy(): FallbackPreferenceItem {
    return new FallbackPreferenceItem(
      this.code,
      this.title,
      this.budget,
      this.ownerId,
      this.channel,
      this.capacity,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fallback preference item in status draft. */
export function newFallbackPreferenceItem(code: string, title: string): FallbackPreferenceItem {
  return new FallbackPreferenceItem(code, title, 0, "", "", 0, "", "draft");
}
