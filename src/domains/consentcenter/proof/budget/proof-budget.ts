/**
 * The proof budget records of consentcenter's proof work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a proof budget is in its life cycle. */
export type ProofBudgetStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A proof budget. Its code is unique within a tenant. */
export class ProofBudget {
  code: string;
  name: string;
  description: string;
  visible: boolean;
  locale: string;
  capacity: number;
  title: string;
  status: ProofBudgetStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    visible: boolean,
    locale: string,
    capacity: number,
    title: string,
    status: ProofBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.visible = visible;
    this.locale = locale;
    this.capacity = capacity;
    this.title = title;
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

  canMoveTo(next: ProofBudgetStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
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

  moveTo(next: ProofBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.capacity;
  }

  copy(): ProofBudget {
    return new ProofBudget(
      this.code,
      this.name,
      this.description,
      this.visible,
      this.locale,
      this.capacity,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a proof budget in status open. */
export function newProofBudget(code: string, name: string): ProofBudget {
  return new ProofBudget(code, name, "", false, "", 0, "", "open");
}
