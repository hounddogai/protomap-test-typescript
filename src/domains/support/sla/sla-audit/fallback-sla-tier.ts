import * as text from "../../../../kit/text.js";

/** Where a fallback sla tier is in its life cycle. */
export type FallbackSlaTierStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A fallback sla tier. Its code is unique within a tenant. */
export class FallbackSlaTier {
  code: string;
  name: string;
  phone: string;
  locale: string;
  impressions: number;
  graceDays: number;
  timezone: string;
  source: string;
  status: FallbackSlaTierStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    locale: string,
    impressions: number,
    graceDays: number,
    timezone: string,
    source: string,
    status: FallbackSlaTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.locale = locale;
    this.impressions = impressions;
    this.graceDays = graceDays;
    this.timezone = timezone;
    this.source = source;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackSlaTierStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: FallbackSlaTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback sla tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback sla tier"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.impressions + this.graceDays) * 100) / 100;
  }

  copy(): FallbackSlaTier {
    return new FallbackSlaTier(
      this.code,
      this.name,
      this.phone,
      this.locale,
      this.impressions,
      this.graceDays,
      this.timezone,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fallback sla tier in status idle. */
export function newFallbackSlaTier(code: string, name: string): FallbackSlaTier {
  return new FallbackSlaTier(code, name, "", "", 0, 0, "", "", "idle");
}
