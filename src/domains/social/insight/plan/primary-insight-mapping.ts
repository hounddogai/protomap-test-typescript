import * as text from "../../../../kit/text.js";

/** Where a primary insight mapping is in its life cycle. */
export type PrimaryInsightMappingStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a primary insight mapping and its current status. */
export class PrimaryInsightMapping {
  code: string;
  name: string;
  limit: number;
  amount: number;
  budget: number;
  quantity: number;
  priority: number;
  active: boolean;
  utmSource: string;
  endsAt: number;
  status: PrimaryInsightMappingStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    amount: number,
    budget: number,
    quantity: number,
    priority: number,
    active: boolean,
    utmSource: string,
    endsAt: number,
    status: PrimaryInsightMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.amount = amount;
    this.budget = budget;
    this.quantity = quantity;
    this.priority = priority;
    this.active = active;
    this.utmSource = utmSource;
    this.endsAt = endsAt;
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

  canMoveTo(next: PrimaryInsightMappingStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PrimaryInsightMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary insight mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"primary insight mapping"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.budget - this.endsAt) * 100) / 100;
  }

  copy(): PrimaryInsightMapping {
    return new PrimaryInsightMapping(
      this.code,
      this.name,
      this.limit,
      this.amount,
      this.budget,
      this.quantity,
      this.priority,
      this.active,
      this.utmSource,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a primary insight mapping in status planned. */
export function newPrimaryInsightMapping(code: string, name: string): PrimaryInsightMapping {
  return new PrimaryInsightMapping(code, name, 0, 0, 0, 0, 0, false, "", 0, "planned");
}
