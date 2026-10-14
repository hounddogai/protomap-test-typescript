import * as text from "../../../../kit/text.js";

/** Where a global journey digest is in its life cycle. */
export type GlobalJourneyDigestStatus = "requested" | "granted" | "revoked" | "expired";

/** A global journey digest as the journey team keeps it. */
export class GlobalJourneyDigest {
  code: string;
  label: string;
  channel: string;
  startsAt: number;
  clicks: number;
  currency: string;
  unit: string;
  status: GlobalJourneyDigestStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    startsAt: number,
    clicks: number,
    currency: string,
    unit: string,
    status: GlobalJourneyDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.startsAt = startsAt;
    this.clicks = clicks;
    this.currency = currency;
    this.unit = unit;
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

  canMoveTo(next: GlobalJourneyDigestStatus): boolean {
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
        return next === "expired";
    }
    return false;
  }

  moveTo(next: GlobalJourneyDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global journey digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"global journey digest"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.startsAt - this.clicks) * 100) / 100;
  }

  copy(): GlobalJourneyDigest {
    return new GlobalJourneyDigest(
      this.code,
      this.label,
      this.channel,
      this.startsAt,
      this.clicks,
      this.currency,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a global journey digest in status requested. */
export function newGlobalJourneyDigest(code: string, label: string): GlobalJourneyDigest {
  return new GlobalJourneyDigest(code, label, "", 0, 0, "", "", "requested");
}
