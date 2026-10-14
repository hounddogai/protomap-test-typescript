import * as text from "../../../../kit/text.js";

/** Where a regional model notice is in its life cycle. */
export type RegionalModelNoticeStatus = "created" | "validated" | "published" | "retired";

/** One regional model notice, with what the planners need to act on it. */
export class RegionalModelNotice {
  code: string;
  label: string;
  campaignRef: string;
  locale: string;
  rate: number;
  title: string;
  graceDays: number;
  expiresAt: number;
  attributes: Map<string, string>;
  status: RegionalModelNoticeStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    locale: string,
    rate: number,
    title: string,
    graceDays: number,
    expiresAt: number,
    attributes: Map<string, string>,
    status: RegionalModelNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.locale = locale;
    this.rate = rate;
    this.title = title;
    this.graceDays = graceDays;
    this.expiresAt = expiresAt;
    this.attributes = attributes;
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

  canMoveTo(next: RegionalModelNoticeStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
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

  moveTo(next: RegionalModelNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional model notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveExposure(): number {
    return Math.round((this.expiresAt - this.rate) * 100) / 100;
  }

  copy(): RegionalModelNotice {
    return new RegionalModelNotice(
      this.code,
      this.label,
      this.campaignRef,
      this.locale,
      this.rate,
      this.title,
      this.graceDays,
      this.expiresAt,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional model notice in status created. */
export function newRegionalModelNotice(code: string, label: string): RegionalModelNotice {
  return new RegionalModelNotice(code, label, "", "", 0, "", 0, 0, new Map<string, string>(), "created");
}
