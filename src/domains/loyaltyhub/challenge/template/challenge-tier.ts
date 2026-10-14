import * as text from "../../../../kit/text.js";

/** Where a challenge tier is in its life cycle. */
export type ChallengeTierStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One challenge tier, with what the planners need to act on it. */
export class ChallengeTier {
  code: string;
  label: string;
  amount: number;
  attempts: number;
  retries: number;
  phone: string;
  approved: boolean;
  name: string;
  attributes: Map<string, string>;
  status: ChallengeTierStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    attempts: number,
    retries: number,
    phone: string,
    approved: boolean,
    name: string,
    attributes: Map<string, string>,
    status: ChallengeTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.attempts = attempts;
    this.retries = retries;
    this.phone = phone;
    this.approved = approved;
    this.name = name;
    this.attributes = attributes;
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

  canMoveTo(next: ChallengeTierStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ChallengeTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedLoad(): number {
    return Math.round((this.amount - this.attempts) * 100) / 100;
  }

  copy(): ChallengeTier {
    return new ChallengeTier(
      this.code,
      this.label,
      this.amount,
      this.attempts,
      this.retries,
      this.phone,
      this.approved,
      this.name,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a challenge tier in status draft. */
export function newChallengeTier(code: string, label: string): ChallengeTier {
  return new ChallengeTier(code, label, 0, 0, 0, "", false, "", new Map<string, string>(), "draft");
}
