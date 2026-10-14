/**
 * The default paywall budget records of growth's paywall work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default paywall budget is in its life cycle. */
export type DefaultPaywallBudgetStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A default paywall budget. Its code is unique within a tenant. */
export class DefaultPaywallBudget {
  code: string;
  name: string;
  label: string;
  maximum: number;
  frequencyCap: number;
  endsAt: number;
  score: number;
  version: number;
  status: DefaultPaywallBudgetStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    maximum: number,
    frequencyCap: number,
    endsAt: number,
    score: number,
    version: number,
    status: DefaultPaywallBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.maximum = maximum;
    this.frequencyCap = frequencyCap;
    this.endsAt = endsAt;
    this.score = score;
    this.version = version;
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

  canMoveTo(next: DefaultPaywallBudgetStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultPaywallBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default paywall budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  netVolume(): number {
    return Math.round(this.version * this.frequencyCap * 100) / 100;
  }

  copy(): DefaultPaywallBudget {
    return new DefaultPaywallBudget(
      this.code,
      this.name,
      this.label,
      this.maximum,
      this.frequencyCap,
      this.endsAt,
      this.score,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default paywall budget in status open. */
export function newDefaultPaywallBudget(code: string, name: string): DefaultPaywallBudget {
  return new DefaultPaywallBudget(code, name, "", 0, 0, 0, 0, 0, "open");
}
