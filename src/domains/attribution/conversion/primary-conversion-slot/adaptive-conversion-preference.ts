import * as text from "../../../../kit/text.js";

/** Where a adaptive conversion preference is in its life cycle. */
export type AdaptiveConversionPreferenceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A adaptive conversion preference as the conversion team keeps it. */
export class AdaptiveConversionPreference {
  code: string;
  name: string;
  margin: number;
  locale: string;
  region: string;
  endsAt: number;
  priority: number;
  utmSource: string;
  batchSize: number;
  version: number;
  floorValue: number;
  status: AdaptiveConversionPreferenceStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    locale: string,
    region: string,
    endsAt: number,
    priority: number,
    utmSource: string,
    batchSize: number,
    version: number,
    floorValue: number,
    status: AdaptiveConversionPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.locale = locale;
    this.region = region;
    this.endsAt = endsAt;
    this.priority = priority;
    this.utmSource = utmSource;
    this.batchSize = batchSize;
    this.version = version;
    this.floorValue = floorValue;
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

  canMoveTo(next: AdaptiveConversionPreferenceStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: AdaptiveConversionPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive conversion preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netTotal(): number {
    return Math.round((this.floorValue - this.margin) * 100) / 100;
  }

  copy(): AdaptiveConversionPreference {
    return new AdaptiveConversionPreference(
      this.code,
      this.name,
      this.margin,
      this.locale,
      this.region,
      this.endsAt,
      this.priority,
      this.utmSource,
      this.batchSize,
      this.version,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a adaptive conversion preference in status proposed. */
export function newAdaptiveConversionPreference(code: string, name: string): AdaptiveConversionPreference {
  return new AdaptiveConversionPreference(code, name, 0, "", "", 0, 0, "", 0, 0, 0, "proposed");
}
