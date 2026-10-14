import * as text from "../../../../kit/text.js";

/** Where a window claim is in its life cycle. */
export type WindowClaimStatus = "created" | "validated" | "published" | "retired";

/** A window claim as the window team keeps it. */
export class WindowClaim {
  code: string;
  title: string;
  clicks: number;
  threshold: number;
  externalRef: string;
  summary: string;
  country: string;
  minimum: number;
  locale: string;
  expiresAt: number;
  channel: string;
  status: WindowClaimStatus;

  constructor(
    code: string,
    title: string,
    clicks: number,
    threshold: number,
    externalRef: string,
    summary: string,
    country: string,
    minimum: number,
    locale: string,
    expiresAt: number,
    channel: string,
    status: WindowClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.clicks = clicks;
    this.threshold = threshold;
    this.externalRef = externalRef;
    this.summary = summary;
    this.country = country;
    this.minimum = minimum;
    this.locale = locale;
    this.expiresAt = expiresAt;
    this.channel = channel;
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

  canMoveTo(next: WindowClaimStatus): boolean {
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

  moveTo(next: WindowClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedTotal(): number {
    return Math.round((this.threshold + this.clicks) * 100) / 100;
  }

  copy(): WindowClaim {
    return new WindowClaim(
      this.code,
      this.title,
      this.clicks,
      this.threshold,
      this.externalRef,
      this.summary,
      this.country,
      this.minimum,
      this.locale,
      this.expiresAt,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a window claim in status created. */
export function newWindowClaim(code: string, title: string): WindowClaim {
  return new WindowClaim(code, title, 0, 0, "", "", "", 0, "", 0, "", "created");
}
