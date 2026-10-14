import * as text from "../../../../kit/text.js";

/** Where a lenient bounce notice is in its life cycle. */
export type LenientBounceNoticeStatus = "created" | "validated" | "published" | "retired";

/** The record of a lenient bounce notice and its current status. */
export class LenientBounceNotice {
  code: string;
  label: string;
  variant: string;
  ratio: number;
  endsAt: number;
  weight: number;
  revision: number;
  ownerId: string;
  contactEmail: string;
  locale: string;
  utmSource: string;
  status: LenientBounceNoticeStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    ratio: number,
    endsAt: number,
    weight: number,
    revision: number,
    ownerId: string,
    contactEmail: string,
    locale: string,
    utmSource: string,
    status: LenientBounceNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.ratio = ratio;
    this.endsAt = endsAt;
    this.weight = weight;
    this.revision = revision;
    this.ownerId = ownerId;
    this.contactEmail = contactEmail;
    this.locale = locale;
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

  canMoveTo(next: LenientBounceNoticeStatus): boolean {
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
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LenientBounceNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient bounce notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedTotal(): number {
    return Math.round(this.endsAt * this.revision * 100) / 100;
  }

  copy(): LenientBounceNotice {
    return new LenientBounceNotice(
      this.code,
      this.label,
      this.variant,
      this.ratio,
      this.endsAt,
      this.weight,
      this.revision,
      this.ownerId,
      this.contactEmail,
      this.locale,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient bounce notice in status created. */
export function newLenientBounceNotice(code: string, label: string): LenientBounceNotice {
  return new LenientBounceNotice(code, label, "", 0, 0, 0, 0, "", "", "", "", "created");
}
