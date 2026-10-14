import * as text from "../../../../kit/text.js";

/** Where a scheduled domain record is in its life cycle. */
export type ScheduledDomainRecordStatus = "requested" | "granted" | "revoked" | "expired";

/** One scheduled domain record, with what the planners need to act on it. */
export class ScheduledDomainRecord {
  code: string;
  title: string;
  region: string;
  discount: number;
  locale: string;
  phone: string;
  openRate: number;
  startsAt: number;
  source: string;
  threshold: number;
  currency: string;
  status: ScheduledDomainRecordStatus;

  constructor(
    code: string,
    title: string,
    region: string,
    discount: number,
    locale: string,
    phone: string,
    openRate: number,
    startsAt: number,
    source: string,
    threshold: number,
    currency: string,
    status: ScheduledDomainRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.discount = discount;
    this.locale = locale;
    this.phone = phone;
    this.openRate = openRate;
    this.startsAt = startsAt;
    this.source = source;
    this.threshold = threshold;
    this.currency = currency;
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

  canMoveTo(next: ScheduledDomainRecordStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
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

  moveTo(next: ScheduledDomainRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled domain record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveTotal(): number {
    return Math.round((this.startsAt + this.threshold) * 100) / 100;
  }

  copy(): ScheduledDomainRecord {
    return new ScheduledDomainRecord(
      this.code,
      this.title,
      this.region,
      this.discount,
      this.locale,
      this.phone,
      this.openRate,
      this.startsAt,
      this.source,
      this.threshold,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a scheduled domain record in status requested. */
export function newScheduledDomainRecord(code: string, title: string): ScheduledDomainRecord {
  return new ScheduledDomainRecord(code, title, "", 0, "", "", 0, 0, "", 0, "", "requested");
}
