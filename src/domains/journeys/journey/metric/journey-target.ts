import * as text from "../../../../kit/text.js";

/** Where a journey target is in its life cycle. */
export type JourneyTargetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A journey target. Its code is unique within a tenant. */
export class JourneyTarget {
  code: string;
  name: string;
  country: string;
  currency: string;
  utmSource: string;
  source: string;
  amount: number;
  ownerId: string;
  clicks: number;
  sequence: number;
  status: JourneyTargetStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    currency: string,
    utmSource: string,
    source: string,
    amount: number,
    ownerId: string,
    clicks: number,
    sequence: number,
    status: JourneyTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.currency = currency;
    this.utmSource = utmSource;
    this.source = source;
    this.amount = amount;
    this.ownerId = ownerId;
    this.clicks = clicks;
    this.sequence = sequence;
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

  canMoveTo(next: JourneyTargetStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "draining";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: JourneyTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"journey target"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round(this.amount * this.clicks * 100) / 100;
  }

  copy(): JourneyTarget {
    return new JourneyTarget(
      this.code,
      this.name,
      this.country,
      this.currency,
      this.utmSource,
      this.source,
      this.amount,
      this.ownerId,
      this.clicks,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a journey target in status idle. */
export function newJourneyTarget(code: string, name: string): JourneyTarget {
  return new JourneyTarget(code, name, "", "", "", "", 0, "", 0, 0, "idle");
}
