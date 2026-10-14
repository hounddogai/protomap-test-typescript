import * as text from "../../../../kit/text.js";

/** Where a reply ledger is in its life cycle. */
export type ReplyLedgerStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a reply ledger and its current status. */
export class ReplyLedger {
  code: string;
  name: string;
  country: string;
  tags: string[];
  channel: string;
  floorValue: number;
  status: ReplyLedgerStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    tags: string[],
    channel: string,
    floorValue: number,
    status: ReplyLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.tags = tags;
    this.channel = channel;
    this.floorValue = floorValue;
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

  canMoveTo(next: ReplyLedgerStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ReplyLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.floorValue;
  }

  copy(): ReplyLedger {
    return new ReplyLedger(this.code, this.name, this.country, this.tags, this.channel, this.floorValue, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a reply ledger in status draft. */
export function newReplyLedger(code: string, name: string): ReplyLedger {
  return new ReplyLedger(code, name, "", [], "", 0, "draft");
}
