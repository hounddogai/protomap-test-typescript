import * as text from "../../../../kit/text.js";

/** Where a lenient sender notice is in its life cycle. */
export type LenientSenderNoticeStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A lenient sender notice as the sender team keeps it. */
export class LenientSenderNotice {
  code: string;
  label: string;
  batchSize: number;
  title: string;
  journeyId: string;
  externalRef: string;
  region: string;
  phone: string;
  sequence: number;
  rate: number;
  impressions: number;
  status: LenientSenderNoticeStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    title: string,
    journeyId: string,
    externalRef: string,
    region: string,
    phone: string,
    sequence: number,
    rate: number,
    impressions: number,
    status: LenientSenderNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.title = title;
    this.journeyId = journeyId;
    this.externalRef = externalRef;
    this.region = region;
    this.phone = phone;
    this.sequence = sequence;
    this.rate = rate;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientSenderNoticeStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientSenderNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient sender notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round((this.impressions - this.batchSize) * 100) / 100;
  }

  copy(): LenientSenderNotice {
    return new LenientSenderNotice(
      this.code,
      this.label,
      this.batchSize,
      this.title,
      this.journeyId,
      this.externalRef,
      this.region,
      this.phone,
      this.sequence,
      this.rate,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a lenient sender notice in status open. */
export function newLenientSenderNotice(code: string, label: string): LenientSenderNotice {
  return new LenientSenderNotice(code, label, 0, "", "", "", "", "", 0, 0, 0, "open");
}
