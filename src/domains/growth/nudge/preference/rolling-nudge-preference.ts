import * as text from "../../../../kit/text.js";

/** Where a rolling nudge preference is in its life cycle. */
export type RollingNudgePreferenceStatus = "requested" | "granted" | "revoked" | "expired";

/** A rolling nudge preference as the nudge team keeps it. */
export class RollingNudgePreference {
  code: string;
  label: string;
  utmSource: string;
  quantity: number;
  createdAt: number;
  unit: string;
  status: RollingNudgePreferenceStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    quantity: number,
    createdAt: number,
    unit: string,
    status: RollingNudgePreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.quantity = quantity;
    this.createdAt = createdAt;
    this.unit = unit;
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

  canMoveTo(next: RollingNudgePreferenceStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingNudgePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling nudge preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netExposure(): number {
    return Math.round((this.quantity + this.createdAt) * 100) / 100;
  }

  copy(): RollingNudgePreference {
    return new RollingNudgePreference(
      this.code,
      this.label,
      this.utmSource,
      this.quantity,
      this.createdAt,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a rolling nudge preference in status requested. */
export function newRollingNudgePreference(code: string, label: string): RollingNudgePreference {
  return new RollingNudgePreference(code, label, "", 0, 0, "", "requested");
}
