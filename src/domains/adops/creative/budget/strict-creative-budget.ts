/**
 * The strict creative budget records of adops's creative work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict creative budget is in its life cycle. */
export type StrictCreativeBudgetStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A strict creative budget. Its code is unique within a tenant. */
export class StrictCreativeBudget {
  code: string;
  label: string;
  title: string;
  priority: number;
  channel: string;
  currency: string;
  visible: boolean;
  ratio: number;
  amount: number;
  journeyId: string;
  status: StrictCreativeBudgetStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    priority: number,
    channel: string,
    currency: string,
    visible: boolean,
    ratio: number,
    amount: number,
    journeyId: string,
    status: StrictCreativeBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.priority = priority;
    this.channel = channel;
    this.currency = currency;
    this.visible = visible;
    this.ratio = ratio;
    this.amount = amount;
    this.journeyId = journeyId;
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

  canMoveTo(next: StrictCreativeBudgetStatus): boolean {
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

  moveTo(next: StrictCreativeBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict creative budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netExposure(): number {
    return Math.round(this.amount * this.priority * 100) / 100;
  }

  copy(): StrictCreativeBudget {
    return new StrictCreativeBudget(
      this.code,
      this.label,
      this.title,
      this.priority,
      this.channel,
      this.currency,
      this.visible,
      this.ratio,
      this.amount,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict creative budget in status open. */
export function newStrictCreativeBudget(code: string, label: string): StrictCreativeBudget {
  return new StrictCreativeBudget(code, label, "", 0, "", "", false, 0, 0, "", "open");
}
