import * as text from "../../../../kit/text.js";

/** Where a fallback level budget is in its life cycle. */
export type FallbackLevelBudgetStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A fallback level budget as the level team keeps it. */
export class FallbackLevelBudget {
  code: string;
  name: string;
  attributes: Map<string, string>;
  graceDays: number;
  ratio: number;
  contactEmail: string;
  status: FallbackLevelBudgetStatus;

  constructor(
    code: string,
    name: string,
    attributes: Map<string, string>,
    graceDays: number,
    ratio: number,
    contactEmail: string,
    status: FallbackLevelBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attributes = attributes;
    this.graceDays = graceDays;
    this.ratio = ratio;
    this.contactEmail = contactEmail;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackLevelBudgetStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "reopened";
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackLevelBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback level budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback level budget"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveVolume(): number {
    return Math.round((this.graceDays + this.ratio) * 100) / 100;
  }

  copy(): FallbackLevelBudget {
    return new FallbackLevelBudget(
      this.code,
      this.name,
      this.attributes,
      this.graceDays,
      this.ratio,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback level budget in status open. */
export function newFallbackLevelBudget(code: string, name: string): FallbackLevelBudget {
  return new FallbackLevelBudget(code, name, new Map<string, string>(), 0, 0, "", "open");
}
