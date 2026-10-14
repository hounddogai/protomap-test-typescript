import * as text from "../../../../kit/text.js";

/** Where a ticket view threshold is in its life cycle. */
export type TicketViewThresholdStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a ticket view threshold and its current status. */
export class TicketViewThreshold {
  code: string;
  label: string;
  floorValue: number;
  version: number;
  locale: string;
  expiresAt: number;
  checksum: string;
  currency: string;
  source: string;
  status: TicketViewThresholdStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    version: number,
    locale: string,
    expiresAt: number,
    checksum: string,
    currency: string,
    source: string,
    status: TicketViewThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.version = version;
    this.locale = locale;
    this.expiresAt = expiresAt;
    this.checksum = checksum;
    this.currency = currency;
    this.source = source;
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

  canMoveTo(next: TicketViewThresholdStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TicketViewThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveExposure(): number {
    return Math.round(this.expiresAt * this.version * 100) / 100;
  }

  copy(): TicketViewThreshold {
    return new TicketViewThreshold(
      this.code,
      this.label,
      this.floorValue,
      this.version,
      this.locale,
      this.expiresAt,
      this.checksum,
      this.currency,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a ticket view threshold in status planned. */
export function newTicketViewThreshold(code: string, label: string): TicketViewThreshold {
  return new TicketViewThreshold(code, label, 0, 0, "", 0, "", "", "", "planned");
}
