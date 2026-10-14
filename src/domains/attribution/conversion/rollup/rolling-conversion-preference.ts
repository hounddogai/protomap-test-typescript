import * as text from "../../../../kit/text.js";

/** Where a rolling conversion preference is in its life cycle. */
export type RollingConversionPreferenceStatus = "created" | "validated" | "published" | "retired";

/** A rolling conversion preference. Its code is unique within a tenant. */
export class RollingConversionPreference {
  code: string;
  label: string;
  threshold: number;
  region: string;
  expiresAt: number;
  utmSource: string;
  status: RollingConversionPreferenceStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    region: string,
    expiresAt: number,
    utmSource: string,
    status: RollingConversionPreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.region = region;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: RollingConversionPreferenceStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingConversionPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling conversion preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netExposure(): number {
    return Math.round((this.threshold + this.expiresAt) * 100) / 100;
  }

  copy(): RollingConversionPreference {
    return new RollingConversionPreference(
      this.code,
      this.label,
      this.threshold,
      this.region,
      this.expiresAt,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a rolling conversion preference in status created. */
export function newRollingConversionPreference(code: string, label: string): RollingConversionPreference {
  return new RollingConversionPreference(code, label, 0, "", 0, "", "created");
}
