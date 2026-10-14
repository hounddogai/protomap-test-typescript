import * as text from "../../../../kit/text.js";

/** Where a seasonal deflection digest is in its life cycle. */
export type SeasonalDeflectionDigestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One seasonal deflection digest, with what the planners need to act on it. */
export class SeasonalDeflectionDigest {
  code: string;
  label: string;
  region: string;
  batchSize: number;
  priority: number;
  visible: boolean;
  phone: string;
  discount: number;
  clicks: number;
  status: SeasonalDeflectionDigestStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    batchSize: number,
    priority: number,
    visible: boolean,
    phone: string,
    discount: number,
    clicks: number,
    status: SeasonalDeflectionDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.batchSize = batchSize;
    this.priority = priority;
    this.visible = visible;
    this.phone = phone;
    this.discount = discount;
    this.clicks = clicks;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalDeflectionDigestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: SeasonalDeflectionDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal deflection digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedTotal(): number {
    return Math.round((this.clicks + this.discount) * 100) / 100;
  }

  copy(): SeasonalDeflectionDigest {
    return new SeasonalDeflectionDigest(
      this.code,
      this.label,
      this.region,
      this.batchSize,
      this.priority,
      this.visible,
      this.phone,
      this.discount,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a seasonal deflection digest in status draft. */
export function newSeasonalDeflectionDigest(code: string, label: string): SeasonalDeflectionDigest {
  return new SeasonalDeflectionDigest(code, label, "", 0, 0, false, "", 0, 0, "draft");
}
