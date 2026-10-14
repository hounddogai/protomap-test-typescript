import * as text from "../../../../kit/text.js";

/** Where a legacy subscription bundle is in its life cycle. */
export type LegacySubscriptionBundleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A legacy subscription bundle. Its code is unique within a tenant. */
export class LegacySubscriptionBundle {
  code: string;
  title: string;
  unit: string;
  conversionRate: number;
  locale: string;
  discount: number;
  notes: string;
  impressions: number;
  summary: string;
  revision: number;
  status: LegacySubscriptionBundleStatus;

  constructor(
    code: string,
    title: string,
    unit: string,
    conversionRate: number,
    locale: string,
    discount: number,
    notes: string,
    impressions: number,
    summary: string,
    revision: number,
    status: LegacySubscriptionBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.conversionRate = conversionRate;
    this.locale = locale;
    this.discount = discount;
    this.notes = notes;
    this.impressions = impressions;
    this.summary = summary;
    this.revision = revision;
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

  canMoveTo(next: LegacySubscriptionBundleStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacySubscriptionBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy subscription bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round(this.revision * this.impressions * 100) / 100;
  }

  copy(): LegacySubscriptionBundle {
    return new LegacySubscriptionBundle(
      this.code,
      this.title,
      this.unit,
      this.conversionRate,
      this.locale,
      this.discount,
      this.notes,
      this.impressions,
      this.summary,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a legacy subscription bundle in status draft. */
export function newLegacySubscriptionBundle(code: string, title: string): LegacySubscriptionBundle {
  return new LegacySubscriptionBundle(code, title, "", 0, "", 0, "", 0, "", 0, "draft");
}
