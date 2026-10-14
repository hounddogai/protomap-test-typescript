import * as text from "../../../../kit/text.js";

/** Where a double opt in slot is in its life cycle. */
export type DoubleOptInSlotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A double opt in slot as the double opt in team keeps it. */
export class DoubleOptInSlot {
  code: string;
  label: string;
  sendAt: number;
  windowDays: number;
  title: string;
  channel: string;
  segment: string;
  minimum: number;
  attributes: Map<string, string>;
  active: boolean;
  bid: number;
  status: DoubleOptInSlotStatus;

  constructor(
    code: string,
    label: string,
    sendAt: number,
    windowDays: number,
    title: string,
    channel: string,
    segment: string,
    minimum: number,
    attributes: Map<string, string>,
    active: boolean,
    bid: number,
    status: DoubleOptInSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.windowDays = windowDays;
    this.title = title;
    this.channel = channel;
    this.segment = segment;
    this.minimum = minimum;
    this.attributes = attributes;
    this.active = active;
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

  canMoveTo(next: DoubleOptInSlotStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
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
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: DoubleOptInSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedExposure(): number {
    return Math.round((this.bid + this.minimum) * 100) / 100;
  }

  copy(): DoubleOptInSlot {
    return new DoubleOptInSlot(
      this.code,
      this.label,
      this.sendAt,
      this.windowDays,
      this.title,
      this.channel,
      this.segment,
      this.minimum,
      this.attributes,
      this.active,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a double opt in slot in status planned. */
export function newDoubleOptInSlot(code: string, label: string): DoubleOptInSlot {
  return new DoubleOptInSlot(code, label, 0, 0, "", "", "", 0, new Map<string, string>(), false, 0, "planned");
}
