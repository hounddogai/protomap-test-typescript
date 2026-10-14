import * as text from "../../../../kit/text.js";

/** Where a manual insight override is in its life cycle. */
export type ManualInsightOverrideStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A manual insight override as the insight team keeps it. */
export class ManualInsightOverride {
  code: string;
  title: string;
  quantity: number;
  active: boolean;
  graceDays: number;
  tags: string[];
  ownerId: string;
  status: ManualInsightOverrideStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    active: boolean,
    graceDays: number,
    tags: string[],
    ownerId: string,
    status: ManualInsightOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.active = active;
    this.graceDays = graceDays;
    this.tags = tags;
    this.ownerId = ownerId;
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

  canMoveTo(next: ManualInsightOverrideStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualInsightOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual insight override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round(this.graceDays * this.quantity * 100) / 100;
  }

  copy(): ManualInsightOverride {
    return new ManualInsightOverride(
      this.code,
      this.title,
      this.quantity,
      this.active,
      this.graceDays,
      this.tags,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual insight override in status planned. */
export function newManualInsightOverride(code: string, title: string): ManualInsightOverride {
  return new ManualInsightOverride(code, title, 0, false, 0, [], "", "planned");
}
