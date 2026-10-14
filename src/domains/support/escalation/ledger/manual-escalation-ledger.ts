/**
 * The manual escalation ledger records of support's escalation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual escalation ledger is in its life cycle. */
export type ManualEscalationLedgerStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a manual escalation ledger and its current status. */
export class ManualEscalationLedger {
  code: string;
  label: string;
  visible: boolean;
  floorValue: number;
  windowDays: number;
  budget: number;
  clicks: number;
  margin: number;
  category: string;
  archived: boolean;
  title: string;
  status: ManualEscalationLedgerStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    floorValue: number,
    windowDays: number,
    budget: number,
    clicks: number,
    margin: number,
    category: string,
    archived: boolean,
    title: string,
    status: ManualEscalationLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.floorValue = floorValue;
    this.windowDays = windowDays;
    this.budget = budget;
    this.clicks = clicks;
    this.margin = margin;
    this.category = category;
    this.archived = archived;
    this.title = title;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualEscalationLedgerStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ManualEscalationLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual escalation ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netTotal(): number {
    return Math.round((this.margin + this.budget) * 100) / 100;
  }

  copy(): ManualEscalationLedger {
    return new ManualEscalationLedger(
      this.code,
      this.label,
      this.visible,
      this.floorValue,
      this.windowDays,
      this.budget,
      this.clicks,
      this.margin,
      this.category,
      this.archived,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a manual escalation ledger in status requested. */
export function newManualEscalationLedger(code: string, label: string): ManualEscalationLedger {
  return new ManualEscalationLedger(code, label, false, 0, 0, 0, 0, 0, "", false, "", "requested");
}
