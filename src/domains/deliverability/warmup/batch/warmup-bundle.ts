import * as text from "../../../../kit/text.js";

/** Where a warmup bundle is in its life cycle. */
export type WarmupBundleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A warmup bundle. Its code is unique within a tenant. */
export class WarmupBundle {
  code: string;
  title: string;
  rate: number;
  maximum: number;
  active: boolean;
  limit: number;
  graceDays: number;
  updatedAt: number;
  endsAt: number;
  impressions: number;
  segment: string;
  status: WarmupBundleStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    maximum: number,
    active: boolean,
    limit: number,
    graceDays: number,
    updatedAt: number,
    endsAt: number,
    impressions: number,
    segment: string,
    status: WarmupBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.maximum = maximum;
    this.active = active;
    this.limit = limit;
    this.graceDays = graceDays;
    this.updatedAt = updatedAt;
    this.endsAt = endsAt;
    this.impressions = impressions;
    this.segment = segment;
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

  canMoveTo(next: WarmupBundleStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WarmupBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedVolume(): number {
    return Math.round(this.endsAt * this.updatedAt * 100) / 100;
  }

  copy(): WarmupBundle {
    return new WarmupBundle(
      this.code,
      this.title,
      this.rate,
      this.maximum,
      this.active,
      this.limit,
      this.graceDays,
      this.updatedAt,
      this.endsAt,
      this.impressions,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a warmup bundle in status draft. */
export function newWarmupBundle(code: string, title: string): WarmupBundle {
  return new WarmupBundle(code, title, 0, 0, false, 0, 0, 0, 0, 0, "", "draft");
}
