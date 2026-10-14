import * as text from "../../../../kit/text.js";

/** Where a weighted creative entry is in its life cycle. */
export type WeightedCreativeEntryStatus = "created" | "validated" | "published" | "retired";

/** A weighted creative entry as the creative team keeps it. */
export class WeightedCreativeEntry {
  code: string;
  label: string;
  phone: string;
  title: string;
  campaignRef: string;
  variant: string;
  utmSource: string;
  category: string;
  reviewer: string;
  endsAt: number;
  conversionRate: number;
  status: WeightedCreativeEntryStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    title: string,
    campaignRef: string,
    variant: string,
    utmSource: string,
    category: string,
    reviewer: string,
    endsAt: number,
    conversionRate: number,
    status: WeightedCreativeEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.title = title;
    this.campaignRef = campaignRef;
    this.variant = variant;
    this.utmSource = utmSource;
    this.category = category;
    this.reviewer = reviewer;
    this.endsAt = endsAt;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: WeightedCreativeEntryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
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

  moveTo(next: WeightedCreativeEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted creative entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"weighted creative entry"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.conversionRate + this.endsAt) * 100) / 100;
  }

  copy(): WeightedCreativeEntry {
    return new WeightedCreativeEntry(
      this.code,
      this.label,
      this.phone,
      this.title,
      this.campaignRef,
      this.variant,
      this.utmSource,
      this.category,
      this.reviewer,
      this.endsAt,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a weighted creative entry in status created. */
export function newWeightedCreativeEntry(code: string, label: string): WeightedCreativeEntry {
  return new WeightedCreativeEntry(code, label, "", "", "", "", "", "", "", 0, 0, "created");
}
