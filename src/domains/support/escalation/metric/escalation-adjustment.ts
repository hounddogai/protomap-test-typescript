import * as text from "../../../../kit/text.js";

/** Where a escalation adjustment is in its life cycle. */
export type EscalationAdjustmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a escalation adjustment and its current status. */
export class EscalationAdjustment {
  code: string;
  name: string;
  contactEmail: string;
  channel: string;
  revision: number;
  timezone: string;
  status: EscalationAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    channel: string,
    revision: number,
    timezone: string,
    status: EscalationAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.channel = channel;
    this.revision = revision;
    this.timezone = timezone;
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

  canMoveTo(next: EscalationAdjustmentStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "draining":
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

  moveTo(next: EscalationAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): EscalationAdjustment {
    return new EscalationAdjustment(
      this.code,
      this.name,
      this.contactEmail,
      this.channel,
      this.revision,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a escalation adjustment in status idle. */
export function newEscalationAdjustment(code: string, name: string): EscalationAdjustment {
  return new EscalationAdjustment(code, name, "", "", 0, "", "idle");
}
