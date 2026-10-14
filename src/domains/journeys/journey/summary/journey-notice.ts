import * as text from "../../../../kit/text.js";

/** Where a journey notice is in its life cycle. */
export type JourneyNoticeStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a journey notice and its current status. */
export class JourneyNotice {
  code: string;
  title: string;
  source: string;
  durationMinutes: number;
  audienceId: string;
  country: string;
  openRate: number;
  status: JourneyNoticeStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    durationMinutes: number,
    audienceId: string,
    country: string,
    openRate: number,
    status: JourneyNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.durationMinutes = durationMinutes;
    this.audienceId = audienceId;
    this.country = country;
    this.openRate = openRate;
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

  canMoveTo(next: JourneyNoticeStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
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
        return next === "expired";
    }
    return false;
  }

  moveTo(next: JourneyNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedExposure(): number {
    return Math.round((this.durationMinutes - this.openRate) * 100) / 100;
  }

  copy(): JourneyNotice {
    return new JourneyNotice(
      this.code,
      this.title,
      this.source,
      this.durationMinutes,
      this.audienceId,
      this.country,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a journey notice in status requested. */
export function newJourneyNotice(code: string, title: string): JourneyNotice {
  return new JourneyNotice(code, title, "", 0, "", "", 0, "requested");
}
