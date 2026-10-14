import * as text from "../../../../kit/text.js";

/** Where a fraud check target is in its life cycle. */
export type FraudCheckTargetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a fraud check target and its current status. */
export class FraudCheckTarget {
  code: string;
  name: string;
  limit: number;
  cost: number;
  unit: string;
  windowDays: number;
  attributes: Map<string, string>;
  priority: number;
  ownerId: string;
  minimum: number;
  archived: boolean;
  status: FraudCheckTargetStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    cost: number,
    unit: string,
    windowDays: number,
    attributes: Map<string, string>,
    priority: number,
    ownerId: string,
    minimum: number,
    archived: boolean,
    status: FraudCheckTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.cost = cost;
    this.unit = unit;
    this.windowDays = windowDays;
    this.attributes = attributes;
    this.priority = priority;
    this.ownerId = ownerId;
    this.minimum = minimum;
    this.archived = archived;
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

  canMoveTo(next: FraudCheckTargetStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FraudCheckTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netTotal(): number {
    return Math.round((this.priority + this.limit) * 100) / 100;
  }

  copy(): FraudCheckTarget {
    return new FraudCheckTarget(
      this.code,
      this.name,
      this.limit,
      this.cost,
      this.unit,
      this.windowDays,
      this.attributes,
      this.priority,
      this.ownerId,
      this.minimum,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a fraud check target in status draft. */
export function newFraudCheckTarget(code: string, name: string): FraudCheckTarget {
  return new FraudCheckTarget(code, name, 0, 0, "", 0, new Map<string, string>(), 0, "", 0, false, "draft");
}
