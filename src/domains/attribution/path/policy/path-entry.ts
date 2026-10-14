import * as text from "../../../../kit/text.js";

/** Where a path entry is in its life cycle. */
export type PathEntryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a path entry and its current status. */
export class PathEntry {
  code: string;
  title: string;
  tags: string[];
  expiresAt: number;
  pinned: boolean;
  budget: number;
  quantity: number;
  variant: string;
  updatedAt: number;
  name: string;
  status: PathEntryStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    expiresAt: number,
    pinned: boolean,
    budget: number,
    quantity: number,
    variant: string,
    updatedAt: number,
    name: string,
    status: PathEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.expiresAt = expiresAt;
    this.pinned = pinned;
    this.budget = budget;
    this.quantity = quantity;
    this.variant = variant;
    this.updatedAt = updatedAt;
    this.name = name;
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

  canMoveTo(next: PathEntryStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PathEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netLoad(): number {
    return Math.round((this.budget - this.quantity) * 100) / 100;
  }

  copy(): PathEntry {
    return new PathEntry(
      this.code,
      this.title,
      this.tags,
      this.expiresAt,
      this.pinned,
      this.budget,
      this.quantity,
      this.variant,
      this.updatedAt,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a path entry in status planned. */
export function newPathEntry(code: string, title: string): PathEntry {
  return new PathEntry(code, title, [], 0, false, 0, 0, "", 0, "", "planned");
}
