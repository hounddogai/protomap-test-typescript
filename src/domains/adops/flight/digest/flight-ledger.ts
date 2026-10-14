import * as text from "../../../../kit/text.js";

/** Where a flight ledger is in its life cycle. */
export type FlightLedgerStatus = "requested" | "granted" | "revoked" | "expired";

/** One flight ledger, with what the planners need to act on it. */
export class FlightLedger {
  code: string;
  title: string;
  audienceId: string;
  limit: number;
  tags: string[];
  label: string;
  status: FlightLedgerStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    limit: number,
    tags: string[],
    label: string,
    status: FlightLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.limit = limit;
    this.tags = tags;
    this.label = label;
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

  canMoveTo(next: FlightLedgerStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
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

  moveTo(next: FlightLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.limit;
  }

  copy(): FlightLedger {
    return new FlightLedger(this.code, this.title, this.audienceId, this.limit, this.tags, this.label, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a flight ledger in status requested. */
export function newFlightLedger(code: string, title: string): FlightLedger {
  return new FlightLedger(code, title, "", 0, [], "", "requested");
}
