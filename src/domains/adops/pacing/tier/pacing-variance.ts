import * as text from "../../../../kit/text.js";

/** Where a pacing variance is in its life cycle. */
export type PacingVarianceStatus = "requested" | "granted" | "revoked" | "expired";

/** A pacing variance as the pacing team keeps it. */
export class PacingVariance {
  code: string;
  name: string;
  summary: string;
  archived: boolean;
  retries: number;
  discount: number;
  category: string;
  segment: string;
  channel: string;
  unit: string;
  status: PacingVarianceStatus;

  constructor(
    code: string,
    name: string,
    summary: string,
    archived: boolean,
    retries: number,
    discount: number,
    category: string,
    segment: string,
    channel: string,
    unit: string,
    status: PacingVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.archived = archived;
    this.retries = retries;
    this.discount = discount;
    this.category = category;
    this.segment = segment;
    this.channel = channel;
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

  canMoveTo(next: PacingVarianceStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PacingVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pacing variance"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.retries + this.discount) * 100) / 100;
  }

  copy(): PacingVariance {
    return new PacingVariance(
      this.code,
      this.name,
      this.summary,
      this.archived,
      this.retries,
      this.discount,
      this.category,
      this.segment,
      this.channel,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a pacing variance in status requested. */
export function newPacingVariance(code: string, name: string): PacingVariance {
  return new PacingVariance(code, name, "", false, 0, 0, "", "", "", "", "requested");
}
