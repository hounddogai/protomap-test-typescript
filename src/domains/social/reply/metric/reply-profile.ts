import * as text from "../../../../kit/text.js";

/** Where a reply profile is in its life cycle. */
export type ReplyProfileStatus = "requested" | "granted" | "revoked" | "expired";

/** A reply profile. Its code is unique within a tenant. */
export class ReplyProfile {
  code: string;
  name: string;
  limit: number;
  amount: number;
  bid: number;
  batchSize: number;
  startsAt: number;
  tags: string[];
  openRate: number;
  ceiling: number;
  expiresAt: number;
  status: ReplyProfileStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    amount: number,
    bid: number,
    batchSize: number,
    startsAt: number,
    tags: string[],
    openRate: number,
    ceiling: number,
    expiresAt: number,
    status: ReplyProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.amount = amount;
    this.bid = bid;
    this.batchSize = batchSize;
    this.startsAt = startsAt;
    this.tags = tags;
    this.openRate = openRate;
    this.ceiling = ceiling;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: ReplyProfileStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReplyProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"reply profile"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedVolume(): number {
    return Math.round((this.limit + this.startsAt) * 100) / 100;
  }

  copy(): ReplyProfile {
    return new ReplyProfile(
      this.code,
      this.name,
      this.limit,
      this.amount,
      this.bid,
      this.batchSize,
      this.startsAt,
      this.tags,
      this.openRate,
      this.ceiling,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reply profile in status requested. */
export function newReplyProfile(code: string, name: string): ReplyProfile {
  return new ReplyProfile(code, name, 0, 0, 0, 0, 0, [], 0, 0, 0, "requested");
}
