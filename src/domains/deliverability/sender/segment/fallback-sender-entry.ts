import * as text from "../../../../kit/text.js";

/** Where a fallback sender entry is in its life cycle. */
export type FallbackSenderEntryStatus = "created" | "validated" | "published" | "retired";

/** One fallback sender entry, with what the planners need to act on it. */
export class FallbackSenderEntry {
  code: string;
  label: string;
  channel: string;
  bid: number;
  startsAt: number;
  locale: string;
  revision: number;
  rate: number;
  status: FallbackSenderEntryStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    bid: number,
    startsAt: number,
    locale: string,
    revision: number,
    rate: number,
    status: FallbackSenderEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.bid = bid;
    this.startsAt = startsAt;
    this.locale = locale;
    this.revision = revision;
    this.rate = rate;
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

  canMoveTo(next: FallbackSenderEntryStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: FallbackSenderEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback sender entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveExposure(): number {
    return Math.round((this.rate + this.bid) * 100) / 100;
  }

  copy(): FallbackSenderEntry {
    return new FallbackSenderEntry(
      this.code,
      this.label,
      this.channel,
      this.bid,
      this.startsAt,
      this.locale,
      this.revision,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fallback sender entry in status created. */
export function newFallbackSenderEntry(code: string, label: string): FallbackSenderEntry {
  return new FallbackSenderEntry(code, label, "", 0, 0, "", 0, 0, "created");
}
