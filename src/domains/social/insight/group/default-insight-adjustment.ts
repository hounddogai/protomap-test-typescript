import * as text from "../../../../kit/text.js";

/** Where a default insight adjustment is in its life cycle. */
export type DefaultInsightAdjustmentStatus = "created" | "validated" | "published" | "retired";

/** A default insight adjustment. Its code is unique within a tenant. */
export class DefaultInsightAdjustment {
  code: string;
  title: string;
  unit: string;
  version: number;
  category: string;
  segment: string;
  active: boolean;
  impressions: number;
  campaignRef: string;
  contactEmail: string;
  status: DefaultInsightAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    unit: string,
    version: number,
    category: string,
    segment: string,
    active: boolean,
    impressions: number,
    campaignRef: string,
    contactEmail: string,
    status: DefaultInsightAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.version = version;
    this.category = category;
    this.segment = segment;
    this.active = active;
    this.impressions = impressions;
    this.campaignRef = campaignRef;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: DefaultInsightAdjustmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
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
        return next === "retired";
    }
    return false;
  }

  moveTo(next: DefaultInsightAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default insight adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveVolume(): number {
    return Math.round(this.version * this.impressions * 100) / 100;
  }

  copy(): DefaultInsightAdjustment {
    return new DefaultInsightAdjustment(
      this.code,
      this.title,
      this.unit,
      this.version,
      this.category,
      this.segment,
      this.active,
      this.impressions,
      this.campaignRef,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a default insight adjustment in status created. */
export function newDefaultInsightAdjustment(code: string, title: string): DefaultInsightAdjustment {
  return new DefaultInsightAdjustment(code, title, "", 0, "", "", false, 0, "", "", "created");
}
