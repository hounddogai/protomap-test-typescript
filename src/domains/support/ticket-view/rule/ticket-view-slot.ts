import * as text from "../../../../kit/text.js";

/** Where a ticket view slot is in its life cycle. */
export type TicketViewSlotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One ticket view slot, with what the planners need to act on it. */
export class TicketViewSlot {
  code: string;
  title: string;
  pinned: boolean;
  attributes: Map<string, string>;
  category: string;
  version: number;
  label: string;
  phone: string;
  contactEmail: string;
  status: TicketViewSlotStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    attributes: Map<string, string>,
    category: string,
    version: number,
    label: string,
    phone: string,
    contactEmail: string,
    status: TicketViewSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.attributes = attributes;
    this.category = category;
    this.version = version;
    this.label = label;
    this.phone = phone;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: TicketViewSlotStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: TicketViewSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.version;
  }

  copy(): TicketViewSlot {
    return new TicketViewSlot(
      this.code,
      this.title,
      this.pinned,
      this.attributes,
      this.category,
      this.version,
      this.label,
      this.phone,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a ticket view slot in status open. */
export function newTicketViewSlot(code: string, title: string): TicketViewSlot {
  return new TicketViewSlot(code, title, false, new Map<string, string>(), "", 0, "", "", "", "open");
}
