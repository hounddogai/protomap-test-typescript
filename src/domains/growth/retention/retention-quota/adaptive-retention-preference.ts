import * as text from "../../../../kit/text.js";

/** Where a adaptive retention preference is in its life cycle. */
export type AdaptiveRetentionPreferenceStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a adaptive retention preference and its current status. */
export class AdaptiveRetentionPreference {
  code: string;
  label: string;
  sendAt: number;
  limit: number;
  sequence: number;
  durationMinutes: number;
  description: string;
  floorValue: number;
  status: AdaptiveRetentionPreferenceStatus;

  constructor(
    code: string,
    label: string,
    sendAt: number,
    limit: number,
    sequence: number,
    durationMinutes: number,
    description: string,
    floorValue: number,
    status: AdaptiveRetentionPreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.limit = limit;
    this.sequence = sequence;
    this.durationMinutes = durationMinutes;
    this.description = description;
    this.floorValue = floorValue;
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

  canMoveTo(next: AdaptiveRetentionPreferenceStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
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

  moveTo(next: AdaptiveRetentionPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive retention preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"adaptive retention preference"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.sendAt - this.sequence) * 100) / 100;
  }

  copy(): AdaptiveRetentionPreference {
    return new AdaptiveRetentionPreference(
      this.code,
      this.label,
      this.sendAt,
      this.limit,
      this.sequence,
      this.durationMinutes,
      this.description,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive retention preference in status requested. */
export function newAdaptiveRetentionPreference(code: string, label: string): AdaptiveRetentionPreference {
  return new AdaptiveRetentionPreference(code, label, 0, 0, 0, 0, "", 0, "requested");
}
