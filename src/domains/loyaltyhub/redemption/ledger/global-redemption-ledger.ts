/**
 * The global redemption ledger records of loyaltyhub's redemption work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global redemption ledger is in its life cycle. */
export type GlobalRedemptionLedgerStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One global redemption ledger, with what the planners need to act on it. */
export class GlobalRedemptionLedger {
  code: string;
  label: string;
  phone: string;
  archived: boolean;
  ratio: number;
  attributes: Map<string, string>;
  channel: string;
  visible: boolean;
  status: GlobalRedemptionLedgerStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    archived: boolean,
    ratio: number,
    attributes: Map<string, string>,
    channel: string,
    visible: boolean,
    status: GlobalRedemptionLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.archived = archived;
    this.ratio = ratio;
    this.attributes = attributes;
    this.channel = channel;
    this.visible = visible;
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

  canMoveTo(next: GlobalRedemptionLedgerStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
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

  moveTo(next: GlobalRedemptionLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global redemption ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.ratio;
  }

  copy(): GlobalRedemptionLedger {
    return new GlobalRedemptionLedger(
      this.code,
      this.label,
      this.phone,
      this.archived,
      this.ratio,
      this.attributes,
      this.channel,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a global redemption ledger in status idle. */
export function newGlobalRedemptionLedger(code: string, label: string): GlobalRedemptionLedger {
  return new GlobalRedemptionLedger(code, label, "", false, 0, new Map<string, string>(), "", false, "idle");
}
