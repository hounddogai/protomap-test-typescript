import * as text from "../../../../kit/text.js";

/** Where a tiered paywall preference is in its life cycle. */
export type TieredPaywallPreferenceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tiered paywall preference. Its code is unique within a tenant. */
export class TieredPaywallPreference {
  code: string;
  title: string;
  cohort: string;
  utmSource: string;
  weight: number;
  expiresAt: number;
  sendAt: number;
  status: TieredPaywallPreferenceStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    utmSource: string,
    weight: number,
    expiresAt: number,
    sendAt: number,
    status: TieredPaywallPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.utmSource = utmSource;
    this.weight = weight;
    this.expiresAt = expiresAt;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredPaywallPreferenceStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredPaywallPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered paywall preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round((this.sendAt + this.expiresAt) * 100) / 100;
  }

  copy(): TieredPaywallPreference {
    return new TieredPaywallPreference(
      this.code,
      this.title,
      this.cohort,
      this.utmSource,
      this.weight,
      this.expiresAt,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a tiered paywall preference in status planned. */
export function newTieredPaywallPreference(code: string, title: string): TieredPaywallPreference {
  return new TieredPaywallPreference(code, title, "", "", 0, 0, 0, "planned");
}
