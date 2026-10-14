import * as text from "../../../../kit/text.js";

/** Where a rolling queue override is in its life cycle. */
export type RollingQueueOverrideStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One rolling queue override, with what the planners need to act on it. */
export class RollingQueueOverride {
  code: string;
  name: string;
  conversionRate: number;
  attributes: Map<string, string>;
  country: string;
  cohort: string;
  active: boolean;
  status: RollingQueueOverrideStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    attributes: Map<string, string>,
    country: string,
    cohort: string,
    active: boolean,
    status: RollingQueueOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.attributes = attributes;
    this.country = country;
    this.cohort = cohort;
    this.active = active;
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

  canMoveTo(next: RollingQueueOverrideStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RollingQueueOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling queue override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.conversionRate;
  }

  copy(): RollingQueueOverride {
    return new RollingQueueOverride(
      this.code,
      this.name,
      this.conversionRate,
      this.attributes,
      this.country,
      this.cohort,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a rolling queue override in status draft. */
export function newRollingQueueOverride(code: string, name: string): RollingQueueOverride {
  return new RollingQueueOverride(code, name, 0, new Map<string, string>(), "", "", false, "draft");
}
