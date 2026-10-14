import * as text from "../../../../kit/text.js";

/** Where a conversion notice is in its life cycle. */
export type ConversionNoticeStatus = "created" | "validated" | "published" | "retired";

/** One conversion notice, with what the planners need to act on it. */
export class ConversionNotice {
  code: string;
  label: string;
  retries: number;
  contactEmail: string;
  timezone: string;
  sequence: number;
  status: ConversionNoticeStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    contactEmail: string,
    timezone: string,
    sequence: number,
    status: ConversionNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.contactEmail = contactEmail;
    this.timezone = timezone;
    this.sequence = sequence;
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

  canMoveTo(next: ConversionNoticeStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ConversionNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netExposure(): number {
    return Math.round((this.retries + this.sequence) * 100) / 100;
  }

  copy(): ConversionNotice {
    return new ConversionNotice(
      this.code,
      this.label,
      this.retries,
      this.contactEmail,
      this.timezone,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a conversion notice in status created. */
export function newConversionNotice(code: string, label: string): ConversionNotice {
  return new ConversionNotice(code, label, 0, "", "", 0, "created");
}
