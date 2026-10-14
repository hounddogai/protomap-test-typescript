/**
 * The sla quota records of support's sla work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sla quota is in its life cycle. */
export type SlaQuotaStatus = "created" | "validated" | "published" | "retired";

/** One sla quota, with what the planners need to act on it. */
export class SlaQuota {
  code: string;
  name: string;
  label: string;
  score: number;
  discount: number;
  country: string;
  budget: number;
  createdAt: number;
  attempts: number;
  status: SlaQuotaStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    score: number,
    discount: number,
    country: string,
    budget: number,
    createdAt: number,
    attempts: number,
    status: SlaQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.score = score;
    this.discount = discount;
    this.country = country;
    this.budget = budget;
    this.createdAt = createdAt;
    this.attempts = attempts;
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

  canMoveTo(next: SlaQuotaStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: SlaQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  netTotal(): number {
    return Math.round((this.budget - this.discount) * 100) / 100;
  }

  copy(): SlaQuota {
    return new SlaQuota(
      this.code,
      this.name,
      this.label,
      this.score,
      this.discount,
      this.country,
      this.budget,
      this.createdAt,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a sla quota in status created. */
export function newSlaQuota(code: string, name: string): SlaQuota {
  return new SlaQuota(code, name, "", 0, 0, "", 0, 0, 0, "created");
}
