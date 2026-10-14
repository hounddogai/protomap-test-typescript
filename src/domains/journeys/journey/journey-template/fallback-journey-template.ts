/**
 * The fallback journey template records of journeys's journey work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback journey template is in its life cycle. */
export type FallbackJourneyTemplateStatus = "requested" | "granted" | "revoked" | "expired";

/** A fallback journey template as the journey team keeps it. */
export class FallbackJourneyTemplate {
  code: string;
  title: string;
  utmSource: string;
  segment: string;
  ceiling: number;
  country: string;
  audienceId: string;
  journeyId: string;
  impressions: number;
  status: FallbackJourneyTemplateStatus;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    segment: string,
    ceiling: number,
    country: string,
    audienceId: string,
    journeyId: string,
    impressions: number,
    status: FallbackJourneyTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.segment = segment;
    this.ceiling = ceiling;
    this.country = country;
    this.audienceId = audienceId;
    this.journeyId = journeyId;
    this.impressions = impressions;
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

  canMoveTo(next: FallbackJourneyTemplateStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: FallbackJourneyTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback journey template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netVolume(): number {
    return Math.round((this.impressions - this.ceiling) * 100) / 100;
  }

  copy(): FallbackJourneyTemplate {
    return new FallbackJourneyTemplate(
      this.code,
      this.title,
      this.utmSource,
      this.segment,
      this.ceiling,
      this.country,
      this.audienceId,
      this.journeyId,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a fallback journey template in status requested. */
export function newFallbackJourneyTemplate(code: string, title: string): FallbackJourneyTemplate {
  return new FallbackJourneyTemplate(code, title, "", "", 0, "", "", "", 0, "requested");
}
