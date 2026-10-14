import * as text from "../../../../kit/text.js";

/** Where a capped payout quota is in its life cycle. */
export type CappedPayoutQuotaStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a capped payout quota and its current status. */
export class CappedPayoutQuota {
  code: string;
  label: string;
  name: string;
  sequence: number;
  endsAt: number;
  segment: string;
  expiresAt: number;
  locale: string;
  sendAt: number;
  status: CappedPayoutQuotaStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    sequence: number,
    endsAt: number,
    segment: string,
    expiresAt: number,
    locale: string,
    sendAt: number,
    status: CappedPayoutQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.sequence = sequence;
    this.endsAt = endsAt;
    this.segment = segment;
    this.expiresAt = expiresAt;
    this.locale = locale;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedPayoutQuotaStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: CappedPayoutQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped payout quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"capped payout quota"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.sequence - this.endsAt) * 100) / 100;
  }

  copy(): CappedPayoutQuota {
    return new CappedPayoutQuota(
      this.code,
      this.label,
      this.name,
      this.sequence,
      this.endsAt,
      this.segment,
      this.expiresAt,
      this.locale,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a capped payout quota in status new. */
export function newCappedPayoutQuota(code: string, label: string): CappedPayoutQuota {
  return new CappedPayoutQuota(code, label, "", 0, 0, "", 0, "", 0, "new");
}
