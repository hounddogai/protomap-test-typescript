import * as text from "../../../../kit/text.js";

/** Where a complaint slot is in its life cycle. */
export type ComplaintSlotStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a complaint slot and its current status. */
export class ComplaintSlot {
  code: string;
  title: string;
  locale: string;
  timezone: string;
  amount: number;
  channel: string;
  capacity: number;
  attributes: Map<string, string>;
  margin: number;
  status: ComplaintSlotStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    timezone: string,
    amount: number,
    channel: string,
    capacity: number,
    attributes: Map<string, string>,
    margin: number,
    status: ComplaintSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.timezone = timezone;
    this.amount = amount;
    this.channel = channel;
    this.capacity = capacity;
    this.attributes = attributes;
    this.margin = margin;
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

  canMoveTo(next: ComplaintSlotStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ComplaintSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedLoad(): number {
    return Math.round(this.amount * this.capacity * 100) / 100;
  }

  copy(): ComplaintSlot {
    return new ComplaintSlot(
      this.code,
      this.title,
      this.locale,
      this.timezone,
      this.amount,
      this.channel,
      this.capacity,
      this.attributes,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a complaint slot in status requested. */
export function newComplaintSlot(code: string, title: string): ComplaintSlot {
  return new ComplaintSlot(code, title, "", "", 0, "", 0, new Map<string, string>(), 0, "requested");
}
