import * as text from "../../../../kit/text.js";

/** Where a ticket view exception is in its life cycle. */
export type TicketViewExceptionStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One ticket view exception, with what the planners need to act on it. */
export class TicketViewException {
  code: string;
  name: string;
  channel: string;
  ceiling: number;
  frequencyCap: number;
  floorValue: number;
  audienceId: string;
  attributes: Map<string, string>;
  quantity: number;
  approved: boolean;
  status: TicketViewExceptionStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    ceiling: number,
    frequencyCap: number,
    floorValue: number,
    audienceId: string,
    attributes: Map<string, string>,
    quantity: number,
    approved: boolean,
    status: TicketViewExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.ceiling = ceiling;
    this.frequencyCap = frequencyCap;
    this.floorValue = floorValue;
    this.audienceId = audienceId;
    this.attributes = attributes;
    this.quantity = quantity;
    this.approved = approved;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: TicketViewExceptionStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TicketViewExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveLoad(): number {
    return Math.round(this.quantity * this.frequencyCap * 100) / 100;
  }

  copy(): TicketViewException {
    return new TicketViewException(
      this.code,
      this.name,
      this.channel,
      this.ceiling,
      this.frequencyCap,
      this.floorValue,
      this.audienceId,
      this.attributes,
      this.quantity,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a ticket view exception in status draft. */
export function newTicketViewException(code: string, name: string): TicketViewException {
  return new TicketViewException(code, name, "", 0, 0, 0, "", new Map<string, string>(), 0, false, "draft");
}
