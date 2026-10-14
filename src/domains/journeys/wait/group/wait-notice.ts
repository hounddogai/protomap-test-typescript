import * as text from "../../../../kit/text.js";

/** Where a wait notice is in its life cycle. */
export type WaitNoticeStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A wait notice as the wait team keeps it. */
export class WaitNotice {
  code: string;
  name: string;
  margin: number;
  attributes: Map<string, string>;
  priority: number;
  category: string;
  threshold: number;
  startsAt: number;
  status: WaitNoticeStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    attributes: Map<string, string>,
    priority: number,
    category: string,
    threshold: number,
    startsAt: number,
    status: WaitNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.attributes = attributes;
    this.priority = priority;
    this.category = category;
    this.threshold = threshold;
    this.startsAt = startsAt;
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

  canMoveTo(next: WaitNoticeStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
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

  moveTo(next: WaitNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedExposure(): number {
    return Math.round((this.margin + this.priority) * 100) / 100;
  }

  copy(): WaitNotice {
    return new WaitNotice(
      this.code,
      this.name,
      this.margin,
      this.attributes,
      this.priority,
      this.category,
      this.threshold,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a wait notice in status planned. */
export function newWaitNotice(code: string, name: string): WaitNotice {
  return new WaitNotice(code, name, 0, new Map<string, string>(), 0, "", 0, 0, "planned");
}
