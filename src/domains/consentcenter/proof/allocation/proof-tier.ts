import * as text from "../../../../kit/text.js";

/** Where a proof tier is in its life cycle. */
export type ProofTierStatus = "created" | "validated" | "published" | "retired";

/** One proof tier, with what the planners need to act on it. */
export class ProofTier {
  code: string;
  title: string;
  active: boolean;
  budget: number;
  cost: number;
  status: ProofTierStatus;

  constructor(code: string, title: string, active: boolean, budget: number, cost: number, status: ProofTierStatus) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.budget = budget;
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

  canMoveTo(next: ProofTierStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ProofTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedValue(): number {
    return Math.round((this.budget - this.cost) * 100) / 100;
  }

  copy(): ProofTier {
    return new ProofTier(this.code, this.title, this.active, this.budget, this.cost, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a proof tier in status created. */
export function newProofTier(code: string, title: string): ProofTier {
  return new ProofTier(code, title, false, 0, 0, "created");
}
