import * as text from "../../../../kit/text.js";

/** Where a manual bounce notice is in its life cycle. */
export type ManualBounceNoticeStatus = "requested" | "granted" | "revoked" | "expired";

/** One manual bounce notice, with what the planners need to act on it. */
export class ManualBounceNotice {
  code: string;
  title: string;
  revision: number;
  openRate: number;
  country: string;
  journeyId: string;
  segment: string;
  attributes: Map<string, string>;
  utmSource: string;
  status: ManualBounceNoticeStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    openRate: number,
    country: string,
    journeyId: string,
    segment: string,
    attributes: Map<string, string>,
    utmSource: string,
    status: ManualBounceNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.openRate = openRate;
    this.country = country;
    this.journeyId = journeyId;
    this.segment = segment;
    this.attributes = attributes;
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

  canMoveTo(next: ManualBounceNoticeStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualBounceNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual bounce notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedVolume(): number {
    return Math.round(this.revision * this.openRate * 100) / 100;
  }

  copy(): ManualBounceNotice {
    return new ManualBounceNotice(
      this.code,
      this.title,
      this.revision,
      this.openRate,
      this.country,
      this.journeyId,
      this.segment,
      this.attributes,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a manual bounce notice in status requested. */
export function newManualBounceNotice(code: string, title: string): ManualBounceNotice {
  return new ManualBounceNotice(code, title, 0, 0, "", "", "", new Map<string, string>(), "", "requested");
}
