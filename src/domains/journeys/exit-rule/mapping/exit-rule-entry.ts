import * as text from "../../../../kit/text.js";

/** Where a exit rule entry is in its life cycle. */
export type ExitRuleEntryStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a exit rule entry and its current status. */
export class ExitRuleEntry {
  code: string;
  label: string;
  region: string;
  maximum: number;
  channel: string;
  phone: string;
  approved: boolean;
  endsAt: number;
  status: ExitRuleEntryStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    maximum: number,
    channel: string,
    phone: string,
    approved: boolean,
    endsAt: number,
    status: ExitRuleEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.maximum = maximum;
    this.channel = channel;
    this.phone = phone;
    this.approved = approved;
    this.endsAt = endsAt;
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

  canMoveTo(next: ExitRuleEntryStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ExitRuleEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedTotal(): number {
    return Math.round((this.maximum - this.endsAt) * 100) / 100;
  }

  copy(): ExitRuleEntry {
    return new ExitRuleEntry(
      this.code,
      this.label,
      this.region,
      this.maximum,
      this.channel,
      this.phone,
      this.approved,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a exit rule entry in status requested. */
export function newExitRuleEntry(code: string, label: string): ExitRuleEntry {
  return new ExitRuleEntry(code, label, "", 0, "", "", false, 0, "requested");
}
