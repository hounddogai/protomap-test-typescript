import * as text from "../../../../kit/text.js";

/** Where a global macro override is in its life cycle. */
export type GlobalMacroOverrideStatus = "requested" | "granted" | "revoked" | "expired";

/** A global macro override as the macro team keeps it. */
export class GlobalMacroOverride {
  code: string;
  label: string;
  budget: number;
  endsAt: number;
  startsAt: number;
  attempts: number;
  priority: number;
  approved: boolean;
  tags: string[];
  country: string;
  ceiling: number;
  status: GlobalMacroOverrideStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    endsAt: number,
    startsAt: number,
    attempts: number,
    priority: number,
    approved: boolean,
    tags: string[],
    country: string,
    ceiling: number,
    status: GlobalMacroOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.endsAt = endsAt;
    this.startsAt = startsAt;
    this.attempts = attempts;
    this.priority = priority;
    this.approved = approved;
    this.tags = tags;
    this.country = country;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalMacroOverrideStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalMacroOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global macro override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"global macro override"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedLoad(): number {
    return Math.round((this.attempts + this.budget) * 100) / 100;
  }

  copy(): GlobalMacroOverride {
    return new GlobalMacroOverride(
      this.code,
      this.label,
      this.budget,
      this.endsAt,
      this.startsAt,
      this.attempts,
      this.priority,
      this.approved,
      this.tags,
      this.country,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a global macro override in status requested. */
export function newGlobalMacroOverride(code: string, label: string): GlobalMacroOverride {
  return new GlobalMacroOverride(code, label, 0, 0, 0, 0, 0, false, [], "", 0, "requested");
}
