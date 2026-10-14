import * as text from "../../../../kit/text.js";

/** Where a primary journey audit is in its life cycle. */
export type PrimaryJourneyAuditStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A primary journey audit. Its code is unique within a tenant. */
export class PrimaryJourneyAudit {
  code: string;
  label: string;
  title: string;
  endsAt: number;
  amount: number;
  currency: string;
  version: number;
  sendAt: number;
  status: PrimaryJourneyAuditStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    endsAt: number,
    amount: number,
    currency: string,
    version: number,
    sendAt: number,
    status: PrimaryJourneyAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.endsAt = endsAt;
    this.amount = amount;
    this.currency = currency;
    this.version = version;
    this.sendAt = sendAt;
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

  canMoveTo(next: PrimaryJourneyAuditStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PrimaryJourneyAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary journey audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"primary journey audit"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round(this.endsAt * this.amount * 100) / 100;
  }

  copy(): PrimaryJourneyAudit {
    return new PrimaryJourneyAudit(
      this.code,
      this.label,
      this.title,
      this.endsAt,
      this.amount,
      this.currency,
      this.version,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a primary journey audit in status idle. */
export function newPrimaryJourneyAudit(code: string, label: string): PrimaryJourneyAudit {
  return new PrimaryJourneyAudit(code, label, "", 0, 0, "", 0, 0, "idle");
}
