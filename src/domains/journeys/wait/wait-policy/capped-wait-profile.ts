import * as text from "../../../../kit/text.js";

/** Where a capped wait profile is in its life cycle. */
export type CappedWaitProfileStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One capped wait profile, with what the planners need to act on it. */
export class CappedWaitProfile {
  code: string;
  name: string;
  margin: number;
  quantity: number;
  currency: string;
  endsAt: number;
  amount: number;
  source: string;
  sequence: number;
  country: string;
  archived: boolean;
  status: CappedWaitProfileStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    quantity: number,
    currency: string,
    endsAt: number,
    amount: number,
    source: string,
    sequence: number,
    country: string,
    archived: boolean,
    status: CappedWaitProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.quantity = quantity;
    this.currency = currency;
    this.endsAt = endsAt;
    this.amount = amount;
    this.source = source;
    this.sequence = sequence;
    this.country = country;
    this.archived = archived;
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

  canMoveTo(next: CappedWaitProfileStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        return next === "ready";
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: CappedWaitProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped wait profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"capped wait profile"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.amount - this.endsAt) * 100) / 100;
  }

  copy(): CappedWaitProfile {
    return new CappedWaitProfile(
      this.code,
      this.name,
      this.margin,
      this.quantity,
      this.currency,
      this.endsAt,
      this.amount,
      this.source,
      this.sequence,
      this.country,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a capped wait profile in status idle. */
export function newCappedWaitProfile(code: string, name: string): CappedWaitProfile {
  return new CappedWaitProfile(code, name, 0, 0, "", 0, 0, "", 0, "", false, "idle");
}
