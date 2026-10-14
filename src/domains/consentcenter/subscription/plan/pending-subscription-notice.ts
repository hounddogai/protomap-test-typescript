import * as text from "../../../../kit/text.js";

/** Where a pending subscription notice is in its life cycle. */
export type PendingSubscriptionNoticeStatus = "created" | "validated" | "published" | "retired";

/** A pending subscription notice as the subscription team keeps it. */
export class PendingSubscriptionNotice {
  code: string;
  name: string;
  audienceId: string;
  quantity: number;
  utmSource: string;
  locale: string;
  externalRef: string;
  contactEmail: string;
  score: number;
  graceDays: number;
  conversionRate: number;
  status: PendingSubscriptionNoticeStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    quantity: number,
    utmSource: string,
    locale: string,
    externalRef: string,
    contactEmail: string,
    score: number,
    graceDays: number,
    conversionRate: number,
    status: PendingSubscriptionNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.quantity = quantity;
    this.utmSource = utmSource;
    this.locale = locale;
    this.externalRef = externalRef;
    this.contactEmail = contactEmail;
    this.score = score;
    this.graceDays = graceDays;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: PendingSubscriptionNoticeStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingSubscriptionNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending subscription notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netValue(): number {
    return Math.round((this.quantity + this.graceDays) * 100) / 100;
  }

  copy(): PendingSubscriptionNotice {
    return new PendingSubscriptionNotice(
      this.code,
      this.name,
      this.audienceId,
      this.quantity,
      this.utmSource,
      this.locale,
      this.externalRef,
      this.contactEmail,
      this.score,
      this.graceDays,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a pending subscription notice in status created. */
export function newPendingSubscriptionNotice(code: string, name: string): PendingSubscriptionNotice {
  return new PendingSubscriptionNotice(code, name, "", 0, "", "", "", "", 0, 0, 0, "created");
}
