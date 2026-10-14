import * as text from "../../../../kit/text.js";

/** Where a capped sender profile is in its life cycle. */
export type CappedSenderProfileStatus = "requested" | "granted" | "revoked" | "expired";

/** A capped sender profile as the sender team keeps it. */
export class CappedSenderProfile {
  code: string;
  name: string;
  source: string;
  attempts: number;
  bid: number;
  margin: number;
  status: CappedSenderProfileStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    attempts: number,
    bid: number,
    margin: number,
    status: CappedSenderProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.attempts = attempts;
    this.bid = bid;
    this.margin = margin;
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

  canMoveTo(next: CappedSenderProfileStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: CappedSenderProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped sender profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"capped sender profile"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.bid - this.margin) * 100) / 100;
  }

  copy(): CappedSenderProfile {
    return new CappedSenderProfile(
      this.code,
      this.name,
      this.source,
      this.attempts,
      this.bid,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a capped sender profile in status requested. */
export function newCappedSenderProfile(code: string, name: string): CappedSenderProfile {
  return new CappedSenderProfile(code, name, "", 0, 0, 0, "requested");
}
