/**
 * The escalation entry records of support's escalation work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a escalation entry is in its life cycle. */
export type EscalationEntryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One escalation entry, with what the planners need to act on it. */
export class EscalationEntry {
  code: string;
  name: string;
  title: string;
  sendAt: number;
  archived: boolean;
  country: string;
  channel: string;
  locale: string;
  status: EscalationEntryStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    sendAt: number,
    archived: boolean,
    country: string,
    channel: string,
    locale: string,
    status: EscalationEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.sendAt = sendAt;
    this.archived = archived;
    this.country = country;
    this.channel = channel;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: EscalationEntryStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: EscalationEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.sendAt;
  }

  copy(): EscalationEntry {
    return new EscalationEntry(
      this.code,
      this.name,
      this.title,
      this.sendAt,
      this.archived,
      this.country,
      this.channel,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a escalation entry in status proposed. */
export function newEscalationEntry(code: string, name: string): EscalationEntry {
  return new EscalationEntry(code, name, "", 0, false, "", "", "", "proposed");
}
