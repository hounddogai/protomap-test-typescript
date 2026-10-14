import * as text from "../../../../kit/text.js";

/** Where a tiered activation digest is in its life cycle. */
export type TieredActivationDigestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a tiered activation digest and its current status. */
export class TieredActivationDigest {
  code: string;
  label: string;
  summary: string;
  sendAt: number;
  locale: string;
  segment: string;
  threshold: number;
  score: number;
  openRate: number;
  timezone: string;
  floorValue: number;
  status: TieredActivationDigestStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    sendAt: number,
    locale: string,
    segment: string,
    threshold: number,
    score: number,
    openRate: number,
    timezone: string,
    floorValue: number,
    status: TieredActivationDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.sendAt = sendAt;
    this.locale = locale;
    this.segment = segment;
    this.threshold = threshold;
    this.score = score;
    this.openRate = openRate;
    this.timezone = timezone;
    this.floorValue = floorValue;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredActivationDigestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: TieredActivationDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered activation digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.threshold - this.openRate) * 100) / 100;
  }

  copy(): TieredActivationDigest {
    return new TieredActivationDigest(
      this.code,
      this.label,
      this.summary,
      this.sendAt,
      this.locale,
      this.segment,
      this.threshold,
      this.score,
      this.openRate,
      this.timezone,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tiered activation digest in status proposed. */
export function newTieredActivationDigest(code: string, label: string): TieredActivationDigest {
  return new TieredActivationDigest(code, label, "", 0, "", "", 0, 0, 0, "", 0, "proposed");
}
