import * as text from "../../../../kit/text.js";

/** Where a fallback creative preference is in its life cycle. */
export type FallbackCreativePreferenceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One fallback creative preference, with what the planners need to act on it. */
export class FallbackCreativePreference {
  code: string;
  title: string;
  limit: number;
  version: number;
  summary: string;
  region: string;
  journeyId: string;
  revision: number;
  locale: string;
  quantity: number;
  capacity: number;
  status: FallbackCreativePreferenceStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    version: number,
    summary: string,
    region: string,
    journeyId: string,
    revision: number,
    locale: string,
    quantity: number,
    capacity: number,
    status: FallbackCreativePreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.version = version;
    this.summary = summary;
    this.region = region;
    this.journeyId = journeyId;
    this.revision = revision;
    this.locale = locale;
    this.quantity = quantity;
    this.capacity = capacity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackCreativePreferenceStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackCreativePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback creative preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"fallback creative preference"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.limit + this.capacity) * 100) / 100;
  }

  copy(): FallbackCreativePreference {
    return new FallbackCreativePreference(
      this.code,
      this.title,
      this.limit,
      this.version,
      this.summary,
      this.region,
      this.journeyId,
      this.revision,
      this.locale,
      this.quantity,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a fallback creative preference in status proposed. */
export function newFallbackCreativePreference(code: string, title: string): FallbackCreativePreference {
  return new FallbackCreativePreference(code, title, 0, 0, "", "", "", 0, "", 0, 0, "proposed");
}
