import * as text from "../../../../kit/text.js";

/** Where a tiered placement exception is in its life cycle. */
export type TieredPlacementExceptionStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tiered placement exception. Its code is unique within a tenant. */
export class TieredPlacementException {
  code: string;
  label: string;
  capacity: number;
  budget: number;
  source: string;
  priority: number;
  ownerId: string;
  locale: string;
  approved: boolean;
  status: TieredPlacementExceptionStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    budget: number,
    source: string,
    priority: number,
    ownerId: string,
    locale: string,
    approved: boolean,
    status: TieredPlacementExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.budget = budget;
    this.source = source;
    this.priority = priority;
    this.ownerId = ownerId;
    this.locale = locale;
    this.approved = approved;
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

  canMoveTo(next: TieredPlacementExceptionStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredPlacementExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered placement exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedVolume(): number {
    return Math.round((this.capacity + this.budget) * 100) / 100;
  }

  copy(): TieredPlacementException {
    return new TieredPlacementException(
      this.code,
      this.label,
      this.capacity,
      this.budget,
      this.source,
      this.priority,
      this.ownerId,
      this.locale,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tiered placement exception in status planned. */
export function newTieredPlacementException(code: string, label: string): TieredPlacementException {
  return new TieredPlacementException(code, label, 0, 0, "", 0, "", "", false, "planned");
}
