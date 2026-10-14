import * as text from "../../../../kit/text.js";

/** Where a macro ledger is in its life cycle. */
export type MacroLedgerStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A macro ledger. Its code is unique within a tenant. */
export class MacroLedger {
  code: string;
  name: string;
  weight: number;
  notes: string;
  priority: number;
  label: string;
  campaignRef: string;
  status: MacroLedgerStatus;

  constructor(
    code: string,
    name: string,
    weight: number,
    notes: string,
    priority: number,
    label: string,
    campaignRef: string,
    status: MacroLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.notes = notes;
    this.priority = priority;
    this.label = label;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: MacroLedgerStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        return next === "reopened";
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: MacroLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveTotal(): number {
    return Math.round(this.weight * this.priority * 100) / 100;
  }

  copy(): MacroLedger {
    return new MacroLedger(
      this.code,
      this.name,
      this.weight,
      this.notes,
      this.priority,
      this.label,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a macro ledger in status open. */
export function newMacroLedger(code: string, name: string): MacroLedger {
  return new MacroLedger(code, name, 0, "", 0, "", "", "open");
}
