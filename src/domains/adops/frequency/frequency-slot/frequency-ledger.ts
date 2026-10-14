import * as text from "../../../../kit/text.js";

/** Where a frequency ledger is in its life cycle. */
export type FrequencyLedgerStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One frequency ledger, with what the planners need to act on it. */
export class FrequencyLedger {
  code: string;
  title: string;
  contactEmail: string;
  maximum: number;
  journeyId: string;
  version: number;
  channel: string;
  status: FrequencyLedgerStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    maximum: number,
    journeyId: string,
    version: number,
    channel: string,
    status: FrequencyLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.maximum = maximum;
    this.journeyId = journeyId;
    this.version = version;
    this.channel = channel;
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

  canMoveTo(next: FrequencyLedgerStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
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

  moveTo(next: FrequencyLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netValue(): number {
    return Math.round((this.maximum - this.version) * 100) / 100;
  }

  copy(): FrequencyLedger {
    return new FrequencyLedger(
      this.code,
      this.title,
      this.contactEmail,
      this.maximum,
      this.journeyId,
      this.version,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a frequency ledger in status idle. */
export function newFrequencyLedger(code: string, title: string): FrequencyLedger {
  return new FrequencyLedger(code, title, "", 0, "", 0, "", "idle");
}
