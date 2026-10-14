import * as text from "../../../../kit/text.js";

/** Where a regional reply record is in its life cycle. */
export type RegionalReplyRecordStatus = "requested" | "granted" | "revoked" | "expired";

/** A regional reply record. Its code is unique within a tenant. */
export class RegionalReplyRecord {
  code: string;
  title: string;
  sequence: number;
  quantity: number;
  utmSource: string;
  journeyId: string;
  reviewer: string;
  locale: string;
  cost: number;
  updatedAt: number;
  impressions: number;
  status: RegionalReplyRecordStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    quantity: number,
    utmSource: string,
    journeyId: string,
    reviewer: string,
    locale: string,
    cost: number,
    updatedAt: number,
    impressions: number,
    status: RegionalReplyRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.quantity = quantity;
    this.utmSource = utmSource;
    this.journeyId = journeyId;
    this.reviewer = reviewer;
    this.locale = locale;
    this.cost = cost;
    this.updatedAt = updatedAt;
    this.impressions = impressions;
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

  canMoveTo(next: RegionalReplyRecordStatus): boolean {
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

  moveTo(next: RegionalReplyRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional reply record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"regional reply record"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round(this.cost * this.updatedAt * 100) / 100;
  }

  copy(): RegionalReplyRecord {
    return new RegionalReplyRecord(
      this.code,
      this.title,
      this.sequence,
      this.quantity,
      this.utmSource,
      this.journeyId,
      this.reviewer,
      this.locale,
      this.cost,
      this.updatedAt,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a regional reply record in status requested. */
export function newRegionalReplyRecord(code: string, title: string): RegionalReplyRecord {
  return new RegionalReplyRecord(code, title, 0, 0, "", "", "", "", 0, 0, 0, "requested");
}
