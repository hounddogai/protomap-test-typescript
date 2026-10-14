import * as text from "../../../../kit/text.js";

/** Where a adaptive csat threshold is in its life cycle. */
export type AdaptiveCsatThresholdStatus = "requested" | "granted" | "revoked" | "expired";

/** A adaptive csat threshold. Its code is unique within a tenant. */
export class AdaptiveCsatThreshold {
  code: string;
  label: string;
  locale: string;
  audienceId: string;
  checksum: string;
  visible: boolean;
  updatedAt: number;
  status: AdaptiveCsatThresholdStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    audienceId: string,
    checksum: string,
    visible: boolean,
    updatedAt: number,
    status: AdaptiveCsatThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.audienceId = audienceId;
    this.checksum = checksum;
    this.visible = visible;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: AdaptiveCsatThresholdStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: AdaptiveCsatThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive csat threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.updatedAt;
  }

  copy(): AdaptiveCsatThreshold {
    return new AdaptiveCsatThreshold(
      this.code,
      this.label,
      this.locale,
      this.audienceId,
      this.checksum,
      this.visible,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a adaptive csat threshold in status requested. */
export function newAdaptiveCsatThreshold(code: string, label: string): AdaptiveCsatThreshold {
  return new AdaptiveCsatThreshold(code, label, "", "", "", false, 0, "requested");
}
