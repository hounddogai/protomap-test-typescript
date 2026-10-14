import * as text from "../../../../kit/text.js";

/** Where a badge adjustment is in its life cycle. */
export type BadgeAdjustmentStatus = "created" | "validated" | "published" | "retired";

/** A badge adjustment. Its code is unique within a tenant. */
export class BadgeAdjustment {
  code: string;
  title: string;
  checksum: string;
  segment: string;
  margin: number;
  name: string;
  audienceId: string;
  impressions: number;
  utmSource: string;
  status: BadgeAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    segment: string,
    margin: number,
    name: string,
    audienceId: string,
    impressions: number,
    utmSource: string,
    status: BadgeAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.segment = segment;
    this.margin = margin;
    this.name = name;
    this.audienceId = audienceId;
    this.impressions = impressions;
    this.utmSource = utmSource;
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

  canMoveTo(next: BadgeAdjustmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: BadgeAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedValue(): number {
    return Math.round((this.margin - this.impressions) * 100) / 100;
  }

  copy(): BadgeAdjustment {
    return new BadgeAdjustment(
      this.code,
      this.title,
      this.checksum,
      this.segment,
      this.margin,
      this.name,
      this.audienceId,
      this.impressions,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a badge adjustment in status created. */
export function newBadgeAdjustment(code: string, title: string): BadgeAdjustment {
  return new BadgeAdjustment(code, title, "", "", 0, "", "", 0, "", "created");
}
