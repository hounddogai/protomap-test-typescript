import * as text from "../../../../kit/text.js";

/** Where a ticket view checkpoint is in its life cycle. */
export type TicketViewCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A ticket view checkpoint as the ticket view team keeps it. */
export class TicketViewCheckpoint {
  code: string;
  label: string;
  weight: number;
  journeyId: string;
  attributes: Map<string, string>;
  approved: boolean;
  timezone: string;
  minimum: number;
  attempts: number;
  phone: string;
  visible: boolean;
  status: TicketViewCheckpointStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    journeyId: string,
    attributes: Map<string, string>,
    approved: boolean,
    timezone: string,
    minimum: number,
    attempts: number,
    phone: string,
    visible: boolean,
    status: TicketViewCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.journeyId = journeyId;
    this.attributes = attributes;
    this.approved = approved;
    this.timezone = timezone;
    this.minimum = minimum;
    this.attempts = attempts;
    this.phone = phone;
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

  canMoveTo(next: TicketViewCheckpointStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TicketViewCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
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

  projectedVolume(): number {
    return Math.round(this.minimum * this.attempts * 100) / 100;
  }

  copy(): TicketViewCheckpoint {
    return new TicketViewCheckpoint(
      this.code,
      this.label,
      this.weight,
      this.journeyId,
      this.attributes,
      this.approved,
      this.timezone,
      this.minimum,
      this.attempts,
      this.phone,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a ticket view checkpoint in status idle. */
export function newTicketViewCheckpoint(code: string, label: string): TicketViewCheckpoint {
  return new TicketViewCheckpoint(code, label, 0, "", new Map<string, string>(), false, "", 0, 0, "", false, "idle");
}
