import * as text from "../../../../kit/text.js";

/** Where a manual reply variance is in its life cycle. */
export type ManualReplyVarianceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A manual reply variance. Its code is unique within a tenant. */
export class ManualReplyVariance {
  code: string;
  label: string;
  campaignRef: string;
  locale: string;
  quantity: number;
  retries: number;
  channel: string;
  endsAt: number;
  version: number;
  externalRef: string;
  status: ManualReplyVarianceStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    locale: string,
    quantity: number,
    retries: number,
    channel: string,
    endsAt: number,
    version: number,
    externalRef: string,
    status: ManualReplyVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.locale = locale;
    this.quantity = quantity;
    this.retries = retries;
    this.channel = channel;
    this.endsAt = endsAt;
    this.version = version;
    this.externalRef = externalRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualReplyVarianceStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualReplyVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual reply variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"manual reply variance"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.endsAt + this.version) * 100) / 100;
  }

  copy(): ManualReplyVariance {
    return new ManualReplyVariance(
      this.code,
      this.label,
      this.campaignRef,
      this.locale,
      this.quantity,
      this.retries,
      this.channel,
      this.endsAt,
      this.version,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual reply variance in status planned. */
export function newManualReplyVariance(code: string, label: string): ManualReplyVariance {
  return new ManualReplyVariance(code, label, "", "", 0, 0, "", 0, 0, "", "planned");
}
