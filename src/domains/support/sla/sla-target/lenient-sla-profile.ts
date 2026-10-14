import * as text from "../../../../kit/text.js";

/** Where a lenient sla profile is in its life cycle. */
export type LenientSlaProfileStatus = "created" | "validated" | "published" | "retired";

/** The record of a lenient sla profile and its current status. */
export class LenientSlaProfile {
  code: string;
  name: string;
  bid: number;
  attempts: number;
  createdAt: number;
  revision: number;
  source: string;
  minimum: number;
  retries: number;
  status: LenientSlaProfileStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    attempts: number,
    createdAt: number,
    revision: number,
    source: string,
    minimum: number,
    retries: number,
    status: LenientSlaProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.attempts = attempts;
    this.createdAt = createdAt;
    this.revision = revision;
    this.source = source;
    this.minimum = minimum;
    this.retries = retries;
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

  canMoveTo(next: LenientSlaProfileStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LenientSlaProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient sla profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"lenient sla profile"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.minimum + this.retries) * 100) / 100;
  }

  copy(): LenientSlaProfile {
    return new LenientSlaProfile(
      this.code,
      this.name,
      this.bid,
      this.attempts,
      this.createdAt,
      this.revision,
      this.source,
      this.minimum,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a lenient sla profile in status created. */
export function newLenientSlaProfile(code: string, name: string): LenientSlaProfile {
  return new LenientSlaProfile(code, name, 0, 0, 0, 0, "", 0, 0, "created");
}
