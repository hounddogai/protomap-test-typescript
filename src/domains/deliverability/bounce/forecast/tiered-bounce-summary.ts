import * as text from "../../../../kit/text.js";

/** Where a tiered bounce summary is in its life cycle. */
export type TieredBounceSummaryStatus = "created" | "validated" | "published" | "retired";

/** The record of a tiered bounce summary and its current status. */
export class TieredBounceSummary {
  code: string;
  name: string;
  minimum: number;
  floorValue: number;
  campaignRef: string;
  contactEmail: string;
  amount: number;
  channel: string;
  expiresAt: number;
  attempts: number;
  sendAt: number;
  status: TieredBounceSummaryStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    floorValue: number,
    campaignRef: string,
    contactEmail: string,
    amount: number,
    channel: string,
    expiresAt: number,
    attempts: number,
    sendAt: number,
    status: TieredBounceSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.floorValue = floorValue;
    this.campaignRef = campaignRef;
    this.contactEmail = contactEmail;
    this.amount = amount;
    this.channel = channel;
    this.expiresAt = expiresAt;
    this.attempts = attempts;
    this.sendAt = sendAt;
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

  canMoveTo(next: TieredBounceSummaryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredBounceSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered bounce summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round((this.minimum + this.attempts) * 100) / 100;
  }

  copy(): TieredBounceSummary {
    return new TieredBounceSummary(
      this.code,
      this.name,
      this.minimum,
      this.floorValue,
      this.campaignRef,
      this.contactEmail,
      this.amount,
      this.channel,
      this.expiresAt,
      this.attempts,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered bounce summary in status created. */
export function newTieredBounceSummary(code: string, name: string): TieredBounceSummary {
  return new TieredBounceSummary(code, name, 0, 0, "", "", 0, "", 0, 0, 0, "created");
}
