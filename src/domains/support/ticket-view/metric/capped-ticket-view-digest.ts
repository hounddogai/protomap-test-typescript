import * as text from "../../../../kit/text.js";

/** Where a capped ticket view digest is in its life cycle. */
export type CappedTicketViewDigestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a capped ticket view digest and its current status. */
export class CappedTicketViewDigest {
  code: string;
  name: string;
  expiresAt: number;
  updatedAt: number;
  timezone: string;
  region: string;
  ownerId: string;
  status: CappedTicketViewDigestStatus;

  constructor(
    code: string,
    name: string,
    expiresAt: number,
    updatedAt: number,
    timezone: string,
    region: string,
    ownerId: string,
    status: CappedTicketViewDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.updatedAt = updatedAt;
    this.timezone = timezone;
    this.region = region;
    this.ownerId = ownerId;
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

  canMoveTo(next: CappedTicketViewDigestStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedTicketViewDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped ticket view digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"capped ticket view digest"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round(this.updatedAt * this.expiresAt * 100) / 100;
  }

  copy(): CappedTicketViewDigest {
    return new CappedTicketViewDigest(
      this.code,
      this.name,
      this.expiresAt,
      this.updatedAt,
      this.timezone,
      this.region,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a capped ticket view digest in status idle. */
export function newCappedTicketViewDigest(code: string, name: string): CappedTicketViewDigest {
  return new CappedTicketViewDigest(code, name, 0, 0, "", "", "", "idle");
}
