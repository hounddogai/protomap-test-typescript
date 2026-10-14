import * as text from "../../../../kit/text.js";

/** Where a fallback post rule is in its life cycle. */
export type FallbackPostRuleStatus = "created" | "validated" | "published" | "retired";

/** One fallback post rule, with what the planners need to act on it. */
export class FallbackPostRule {
  code: string;
  label: string;
  weight: number;
  pinned: boolean;
  startsAt: number;
  cost: number;
  status: FallbackPostRuleStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    pinned: boolean,
    startsAt: number,
    cost: number,
    status: FallbackPostRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.pinned = pinned;
    this.startsAt = startsAt;
    this.cost = cost;
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

  canMoveTo(next: FallbackPostRuleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: FallbackPostRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback post rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedLoad(): number {
    return Math.round((this.weight - this.startsAt) * 100) / 100;
  }

  copy(): FallbackPostRule {
    return new FallbackPostRule(this.code, this.label, this.weight, this.pinned, this.startsAt, this.cost, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback post rule in status created. */
export function newFallbackPostRule(code: string, label: string): FallbackPostRule {
  return new FallbackPostRule(code, label, 0, false, 0, 0, "created");
}
