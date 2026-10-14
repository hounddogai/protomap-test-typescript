import * as text from "../../../../kit/text.js";

/** Where a capped reply ledger is in its life cycle. */
export type CappedReplyLedgerStatus = "created" | "validated" | "published" | "retired";

/** A capped reply ledger as the reply team keeps it. */
export class CappedReplyLedger {
  code: string;
  title: string;
  channel: string;
  locale: string;
  approved: boolean;
  cost: number;
  utmSource: string;
  status: CappedReplyLedgerStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    locale: string,
    approved: boolean,
    cost: number,
    utmSource: string,
    status: CappedReplyLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.locale = locale;
    this.approved = approved;
    this.cost = cost;
    this.utmSource = utmSource;
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

  canMoveTo(next: CappedReplyLedgerStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
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

  moveTo(next: CappedReplyLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped reply ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.cost;
  }

  copy(): CappedReplyLedger {
    return new CappedReplyLedger(
      this.code,
      this.title,
      this.channel,
      this.locale,
      this.approved,
      this.cost,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a capped reply ledger in status created. */
export function newCappedReplyLedger(code: string, title: string): CappedReplyLedger {
  return new CappedReplyLedger(code, title, "", "", false, 0, "", "created");
}
