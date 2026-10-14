import * as text from "../../../../kit/text.js";

/** Where a challenge ledger is in its life cycle. */
export type ChallengeLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A challenge ledger. Its code is unique within a tenant. */
export class ChallengeLedger {
  code: string;
  name: string;
  checksum: string;
  budget: number;
  windowDays: number;
  updatedAt: number;
  sequence: number;
  channel: string;
  pinned: boolean;
  durationMinutes: number;
  attributes: Map<string, string>;
  status: ChallengeLedgerStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    budget: number,
    windowDays: number,
    updatedAt: number,
    sequence: number,
    channel: string,
    pinned: boolean,
    durationMinutes: number,
    attributes: Map<string, string>,
    status: ChallengeLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.budget = budget;
    this.windowDays = windowDays;
    this.updatedAt = updatedAt;
    this.sequence = sequence;
    this.channel = channel;
    this.pinned = pinned;
    this.durationMinutes = durationMinutes;
    this.attributes = attributes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ChallengeLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ChallengeLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"challenge ledger"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedValue(): number {
    return Math.round((this.durationMinutes - this.windowDays) * 100) / 100;
  }

  copy(): ChallengeLedger {
    return new ChallengeLedger(
      this.code,
      this.name,
      this.checksum,
      this.budget,
      this.windowDays,
      this.updatedAt,
      this.sequence,
      this.channel,
      this.pinned,
      this.durationMinutes,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a challenge ledger in status proposed. */
export function newChallengeLedger(code: string, name: string): ChallengeLedger {
  return new ChallengeLedger(code, name, "", 0, 0, 0, 0, "", false, 0, new Map<string, string>(), "proposed");
}
