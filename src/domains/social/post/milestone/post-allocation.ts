import * as text from "../../../../kit/text.js";

/** Where a post allocation is in its life cycle. */
export type PostAllocationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a post allocation and its current status. */
export class PostAllocation {
  code: string;
  label: string;
  expiresAt: number;
  pinned: boolean;
  category: string;
  locale: string;
  floorValue: number;
  capacity: number;
  active: boolean;
  attempts: number;
  status: PostAllocationStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    pinned: boolean,
    category: string,
    locale: string,
    floorValue: number,
    capacity: number,
    active: boolean,
    attempts: number,
    status: PostAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.pinned = pinned;
    this.category = category;
    this.locale = locale;
    this.floorValue = floorValue;
    this.capacity = capacity;
    this.active = active;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: PostAllocationStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PostAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netExposure(): number {
    return Math.round(this.floorValue * this.expiresAt * 100) / 100;
  }

  copy(): PostAllocation {
    return new PostAllocation(
      this.code,
      this.label,
      this.expiresAt,
      this.pinned,
      this.category,
      this.locale,
      this.floorValue,
      this.capacity,
      this.active,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a post allocation in status planned. */
export function newPostAllocation(code: string, label: string): PostAllocation {
  return new PostAllocation(code, label, 0, false, "", "", 0, 0, false, 0, "planned");
}
