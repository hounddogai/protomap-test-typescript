import * as text from "../../../../kit/text.js";

/** Where a primary queue rule is in its life cycle. */
export type PrimaryQueueRuleStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a primary queue rule and its current status. */
export class PrimaryQueueRule {
  code: string;
  name: string;
  channel: string;
  variant: string;
  locale: string;
  notes: string;
  durationMinutes: number;
  status: PrimaryQueueRuleStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    variant: string,
    locale: string,
    notes: string,
    durationMinutes: number,
    status: PrimaryQueueRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.variant = variant;
    this.locale = locale;
    this.notes = notes;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: PrimaryQueueRuleStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PrimaryQueueRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary queue rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.durationMinutes;
  }

  copy(): PrimaryQueueRule {
    return new PrimaryQueueRule(
      this.code,
      this.name,
      this.channel,
      this.variant,
      this.locale,
      this.notes,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a primary queue rule in status requested. */
export function newPrimaryQueueRule(code: string, name: string): PrimaryQueueRule {
  return new PrimaryQueueRule(code, name, "", "", "", "", 0, "requested");
}
