import * as text from "../../../../kit/text.js";

/** Where a adaptive window group is in its life cycle. */
export type AdaptiveWindowGroupStatus = "requested" | "granted" | "revoked" | "expired";

/** One adaptive window group, with what the planners need to act on it. */
export class AdaptiveWindowGroup {
  code: string;
  title: string;
  retries: number;
  utmSource: string;
  checksum: string;
  discount: number;
  pinned: boolean;
  archived: boolean;
  conversionRate: number;
  journeyId: string;
  status: AdaptiveWindowGroupStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    utmSource: string,
    checksum: string,
    discount: number,
    pinned: boolean,
    archived: boolean,
    conversionRate: number,
    journeyId: string,
    status: AdaptiveWindowGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.utmSource = utmSource;
    this.checksum = checksum;
    this.discount = discount;
    this.pinned = pinned;
    this.archived = archived;
    this.conversionRate = conversionRate;
    this.journeyId = journeyId;
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

  canMoveTo(next: AdaptiveWindowGroupStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
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

  moveTo(next: AdaptiveWindowGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive window group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedTotal(): number {
    return Math.round((this.discount - this.retries) * 100) / 100;
  }

  copy(): AdaptiveWindowGroup {
    return new AdaptiveWindowGroup(
      this.code,
      this.title,
      this.retries,
      this.utmSource,
      this.checksum,
      this.discount,
      this.pinned,
      this.archived,
      this.conversionRate,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a adaptive window group in status requested. */
export function newAdaptiveWindowGroup(code: string, title: string): AdaptiveWindowGroup {
  return new AdaptiveWindowGroup(code, title, 0, "", "", 0, false, false, 0, "", "requested");
}
