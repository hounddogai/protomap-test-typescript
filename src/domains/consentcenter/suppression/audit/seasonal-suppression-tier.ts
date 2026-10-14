import * as text from "../../../../kit/text.js";

/** Where a seasonal suppression tier is in its life cycle. */
export type SeasonalSuppressionTierStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One seasonal suppression tier, with what the planners need to act on it. */
export class SeasonalSuppressionTier {
  code: string;
  title: string;
  visible: boolean;
  windowDays: number;
  locale: string;
  contactEmail: string;
  currency: string;
  impressions: number;
  status: SeasonalSuppressionTierStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    windowDays: number,
    locale: string,
    contactEmail: string,
    currency: string,
    impressions: number,
    status: SeasonalSuppressionTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.windowDays = windowDays;
    this.locale = locale;
    this.contactEmail = contactEmail;
    this.currency = currency;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalSuppressionTierStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalSuppressionTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal suppression tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"seasonal suppression tier"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.impressions + this.windowDays) * 100) / 100;
  }

  copy(): SeasonalSuppressionTier {
    return new SeasonalSuppressionTier(
      this.code,
      this.title,
      this.visible,
      this.windowDays,
      this.locale,
      this.contactEmail,
      this.currency,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a seasonal suppression tier in status open. */
export function newSeasonalSuppressionTier(code: string, title: string): SeasonalSuppressionTier {
  return new SeasonalSuppressionTier(code, title, false, 0, "", "", "", 0, "open");
}
