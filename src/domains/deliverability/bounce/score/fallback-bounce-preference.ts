import * as text from "../../../../kit/text.js";

/** Where a fallback bounce preference is in its life cycle. */
export type FallbackBouncePreferenceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One fallback bounce preference, with what the planners need to act on it. */
export class FallbackBouncePreference {
  code: string;
  label: string;
  attempts: number;
  openRate: number;
  capacity: number;
  graceDays: number;
  expiresAt: number;
  budget: number;
  currency: string;
  status: FallbackBouncePreferenceStatus;

  constructor(
    code: string,
    label: string,
    attempts: number,
    openRate: number,
    capacity: number,
    graceDays: number,
    expiresAt: number,
    budget: number,
    currency: string,
    status: FallbackBouncePreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attempts = attempts;
    this.openRate = openRate;
    this.capacity = capacity;
    this.graceDays = graceDays;
    this.expiresAt = expiresAt;
    this.budget = budget;
    this.currency = currency;
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

  canMoveTo(next: FallbackBouncePreferenceStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: FallbackBouncePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback bounce preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedTotal(): number {
    return Math.round((this.graceDays - this.attempts) * 100) / 100;
  }

  copy(): FallbackBouncePreference {
    return new FallbackBouncePreference(
      this.code,
      this.label,
      this.attempts,
      this.openRate,
      this.capacity,
      this.graceDays,
      this.expiresAt,
      this.budget,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback bounce preference in status draft. */
export function newFallbackBouncePreference(code: string, label: string): FallbackBouncePreference {
  return new FallbackBouncePreference(code, label, 0, 0, 0, 0, 0, 0, "", "draft");
}
