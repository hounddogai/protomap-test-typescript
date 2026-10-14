import * as text from "../../../../kit/text.js";

/** Where a capped bid rule override is in its life cycle. */
export type CappedBidRuleOverrideStatus = "created" | "validated" | "published" | "retired";

/** A capped bid rule override as the bid rule team keeps it. */
export class CappedBidRuleOverride {
  code: string;
  name: string;
  rate: number;
  active: boolean;
  attributes: Map<string, string>;
  capacity: number;
  checksum: string;
  description: string;
  status: CappedBidRuleOverrideStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    active: boolean,
    attributes: Map<string, string>,
    capacity: number,
    checksum: string,
    description: string,
    status: CappedBidRuleOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.active = active;
    this.attributes = attributes;
    this.capacity = capacity;
    this.checksum = checksum;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedBidRuleOverrideStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: CappedBidRuleOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped bid rule override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedExposure(): number {
    return Math.round((this.rate + this.capacity) * 100) / 100;
  }

  copy(): CappedBidRuleOverride {
    return new CappedBidRuleOverride(
      this.code,
      this.name,
      this.rate,
      this.active,
      this.attributes,
      this.capacity,
      this.checksum,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped bid rule override in status created. */
export function newCappedBidRuleOverride(code: string, name: string): CappedBidRuleOverride {
  return new CappedBidRuleOverride(code, name, 0, false, new Map<string, string>(), 0, "", "", "created");
}
