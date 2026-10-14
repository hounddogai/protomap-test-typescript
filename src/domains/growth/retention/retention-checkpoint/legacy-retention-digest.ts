import * as text from "../../../../kit/text.js";

/** Where a legacy retention digest is in its life cycle. */
export type LegacyRetentionDigestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A legacy retention digest. Its code is unique within a tenant. */
export class LegacyRetentionDigest {
  code: string;
  title: string;
  bid: number;
  channel: string;
  score: number;
  rate: number;
  status: LegacyRetentionDigestStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    channel: string,
    score: number,
    rate: number,
    status: LegacyRetentionDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.channel = channel;
    this.score = score;
    this.rate = rate;
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

  canMoveTo(next: LegacyRetentionDigestStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
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

  moveTo(next: LegacyRetentionDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy retention digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netVolume(): number {
    return Math.round((this.bid + this.score) * 100) / 100;
  }

  copy(): LegacyRetentionDigest {
    return new LegacyRetentionDigest(this.code, this.title, this.bid, this.channel, this.score, this.rate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a legacy retention digest in status idle. */
export function newLegacyRetentionDigest(code: string, title: string): LegacyRetentionDigest {
  return new LegacyRetentionDigest(code, title, 0, "", 0, 0, "idle");
}
