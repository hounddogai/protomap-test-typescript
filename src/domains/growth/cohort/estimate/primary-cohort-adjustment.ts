import * as text from "../../../../kit/text.js";

/** Where a primary cohort adjustment is in its life cycle. */
export type PrimaryCohortAdjustmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A primary cohort adjustment as the cohort team keeps it. */
export class PrimaryCohortAdjustment {
  code: string;
  label: string;
  audienceId: string;
  region: string;
  windowDays: number;
  cohort: string;
  channel: string;
  country: string;
  locale: string;
  status: PrimaryCohortAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    region: string,
    windowDays: number,
    cohort: string,
    channel: string,
    country: string,
    locale: string,
    status: PrimaryCohortAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.region = region;
    this.windowDays = windowDays;
    this.cohort = cohort;
    this.channel = channel;
    this.country = country;
    this.locale = locale;
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

  canMoveTo(next: PrimaryCohortAdjustmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
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

  moveTo(next: PrimaryCohortAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary cohort adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.windowDays;
  }

  copy(): PrimaryCohortAdjustment {
    return new PrimaryCohortAdjustment(
      this.code,
      this.label,
      this.audienceId,
      this.region,
      this.windowDays,
      this.cohort,
      this.channel,
      this.country,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a primary cohort adjustment in status requested. */
export function newPrimaryCohortAdjustment(code: string, label: string): PrimaryCohortAdjustment {
  return new PrimaryCohortAdjustment(code, label, "", "", 0, "", "", "", "", "requested");
}
