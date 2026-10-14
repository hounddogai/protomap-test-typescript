import * as text from "../../../../kit/text.js";

/** Where a invite override is in its life cycle. */
export type InviteOverrideStatus = "created" | "validated" | "published" | "retired";

/** A invite override as the invite team keeps it. */
export class InviteOverride {
  code: string;
  name: string;
  attempts: number;
  segment: string;
  currency: string;
  floorValue: number;
  status: InviteOverrideStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    segment: string,
    currency: string,
    floorValue: number,
    status: InviteOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.segment = segment;
    this.currency = currency;
    this.floorValue = floorValue;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: InviteOverrideStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: InviteOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.floorValue + this.attempts) * 100) / 100;
  }

  copy(): InviteOverride {
    return new InviteOverride(
      this.code,
      this.name,
      this.attempts,
      this.segment,
      this.currency,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a invite override in status created. */
export function newInviteOverride(code: string, name: string): InviteOverride {
  return new InviteOverride(code, name, 0, "", "", 0, "created");
}
