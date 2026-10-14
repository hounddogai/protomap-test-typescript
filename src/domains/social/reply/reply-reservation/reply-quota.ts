import * as text from "../../../../kit/text.js";

/** Where a reply quota is in its life cycle. */
export type ReplyQuotaStatus = "requested" | "granted" | "revoked" | "expired";

/** A reply quota as the reply team keeps it. */
export class ReplyQuota {
  code: string;
  label: string;
  summary: string;
  journeyId: string;
  bid: number;
  status: ReplyQuotaStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    journeyId: string,
    bid: number,
    status: ReplyQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.journeyId = journeyId;
    this.bid = bid;
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

  canMoveTo(next: ReplyQuotaStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ReplyQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"reply quota"} ${this.code}`;
  }

  measuredValue(): number {
    return this.bid;
  }

  copy(): ReplyQuota {
    return new ReplyQuota(this.code, this.label, this.summary, this.journeyId, this.bid, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reply quota in status requested. */
export function newReplyQuota(code: string, label: string): ReplyQuota {
  return new ReplyQuota(code, label, "", "", 0, "requested");
}
