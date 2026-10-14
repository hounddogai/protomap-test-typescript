import * as text from "../../../../kit/text.js";

/** Where a lenient streak notice is in its life cycle. */
export type LenientStreakNoticeStatus = "requested" | "granted" | "revoked" | "expired";

/** A lenient streak notice as the streak team keeps it. */
export class LenientStreakNotice {
  code: string;
  title: string;
  locale: string;
  maximum: number;
  pinned: boolean;
  utmSource: string;
  status: LenientStreakNoticeStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    maximum: number,
    pinned: boolean,
    utmSource: string,
    status: LenientStreakNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.maximum = maximum;
    this.pinned = pinned;
    this.utmSource = utmSource;
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

  canMoveTo(next: LenientStreakNoticeStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
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

  moveTo(next: LenientStreakNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient streak notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient streak notice"} ${this.code}`;
  }

  measuredValue(): number {
    return this.maximum;
  }

  copy(): LenientStreakNotice {
    return new LenientStreakNotice(
      this.code,
      this.title,
      this.locale,
      this.maximum,
      this.pinned,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient streak notice in status requested. */
export function newLenientStreakNotice(code: string, title: string): LenientStreakNotice {
  return new LenientStreakNotice(code, title, "", 0, false, "", "requested");
}
