import * as text from "../../../../kit/text.js";

/** Where a retention variance is in its life cycle. */
export type RetentionVarianceStatus = "requested" | "granted" | "revoked" | "expired";

/** A retention variance as the retention team keeps it. */
export class RetentionVariance {
  code: string;
  label: string;
  startsAt: number;
  segment: string;
  updatedAt: number;
  rate: number;
  status: RetentionVarianceStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    segment: string,
    updatedAt: number,
    rate: number,
    status: RetentionVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.segment = segment;
    this.updatedAt = updatedAt;
    this.rate = rate;
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

  canMoveTo(next: RetentionVarianceStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        switch (next) {
          case "revoked":
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

  moveTo(next: RetentionVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"retention variance"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.startsAt - this.updatedAt) * 100) / 100;
  }

  copy(): RetentionVariance {
    return new RetentionVariance(
      this.code,
      this.label,
      this.startsAt,
      this.segment,
      this.updatedAt,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a retention variance in status requested. */
export function newRetentionVariance(code: string, label: string): RetentionVariance {
  return new RetentionVariance(code, label, 0, "", 0, 0, "requested");
}
