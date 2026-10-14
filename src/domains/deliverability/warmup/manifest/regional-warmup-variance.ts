import * as text from "../../../../kit/text.js";

/** Where a regional warmup variance is in its life cycle. */
export type RegionalWarmupVarianceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A regional warmup variance as the warmup team keeps it. */
export class RegionalWarmupVariance {
  code: string;
  title: string;
  endsAt: number;
  phone: string;
  notes: string;
  graceDays: number;
  status: RegionalWarmupVarianceStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    phone: string,
    notes: string,
    graceDays: number,
    status: RegionalWarmupVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.phone = phone;
    this.notes = notes;
    this.graceDays = graceDays;
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

  canMoveTo(next: RegionalWarmupVarianceStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RegionalWarmupVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional warmup variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedVolume(): number {
    return Math.round((this.endsAt + this.graceDays) * 100) / 100;
  }

  copy(): RegionalWarmupVariance {
    return new RegionalWarmupVariance(
      this.code,
      this.title,
      this.endsAt,
      this.phone,
      this.notes,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional warmup variance in status draft. */
export function newRegionalWarmupVariance(code: string, title: string): RegionalWarmupVariance {
  return new RegionalWarmupVariance(code, title, 0, "", "", 0, "draft");
}
