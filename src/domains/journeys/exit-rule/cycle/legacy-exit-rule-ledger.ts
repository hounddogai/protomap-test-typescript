import * as text from "../../../../kit/text.js";

/** Where a legacy exit rule ledger is in its life cycle. */
export type LegacyExitRuleLedgerStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a legacy exit rule ledger and its current status. */
export class LegacyExitRuleLedger {
  code: string;
  title: string;
  country: string;
  name: string;
  label: string;
  quantity: number;
  status: LegacyExitRuleLedgerStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    name: string,
    label: string,
    quantity: number,
    status: LegacyExitRuleLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.name = name;
    this.label = label;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyExitRuleLedgerStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyExitRuleLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy exit rule ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): LegacyExitRuleLedger {
    return new LegacyExitRuleLedger(
      this.code,
      this.title,
      this.country,
      this.name,
      this.label,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a legacy exit rule ledger in status idle. */
export function newLegacyExitRuleLedger(code: string, title: string): LegacyExitRuleLedger {
  return new LegacyExitRuleLedger(code, title, "", "", "", 0, "idle");
}
