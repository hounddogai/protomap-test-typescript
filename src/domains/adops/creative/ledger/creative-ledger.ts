/**
 * The creative ledger records of adops's creative work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a creative ledger is in its life cycle. */
export type CreativeLedgerStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a creative ledger and its current status. */
export class CreativeLedger {
  code: string;
  title: string;
  durationMinutes: number;
  description: string;
  weight: number;
  phone: string;
  campaignRef: string;
  visible: boolean;
  bid: number;
  status: CreativeLedgerStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    description: string,
    weight: number,
    phone: string,
    campaignRef: string,
    visible: boolean,
    bid: number,
    status: CreativeLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.description = description;
    this.weight = weight;
    this.phone = phone;
    this.campaignRef = campaignRef;
    this.visible = visible;
    this.bid = bid;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreativeLedgerStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: CreativeLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netTotal(): number {
    return Math.round((this.bid + this.weight) * 100) / 100;
  }

  copy(): CreativeLedger {
    return new CreativeLedger(
      this.code,
      this.title,
      this.durationMinutes,
      this.description,
      this.weight,
      this.phone,
      this.campaignRef,
      this.visible,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a creative ledger in status planned. */
export function newCreativeLedger(code: string, title: string): CreativeLedger {
  return new CreativeLedger(code, title, 0, "", 0, "", "", false, 0, "planned");
}
