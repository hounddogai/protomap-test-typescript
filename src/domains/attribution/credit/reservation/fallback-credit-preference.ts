import * as text from "../../../../kit/text.js";

/** Where a fallback credit preference is in its life cycle. */
export type FallbackCreditPreferenceStatus = "requested" | "granted" | "revoked" | "expired";

/** One fallback credit preference, with what the planners need to act on it. */
export class FallbackCreditPreference {
  code: string;
  name: string;
  batchSize: number;
  unit: string;
  revision: number;
  status: FallbackCreditPreferenceStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    unit: string,
    revision: number,
    status: FallbackCreditPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.unit = unit;
    this.revision = revision;
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

  canMoveTo(next: FallbackCreditPreferenceStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackCreditPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback credit preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round((this.revision + this.batchSize) * 100) / 100;
  }

  copy(): FallbackCreditPreference {
    return new FallbackCreditPreference(this.code, this.name, this.batchSize, this.unit, this.revision, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a fallback credit preference in status requested. */
export function newFallbackCreditPreference(code: string, name: string): FallbackCreditPreference {
  return new FallbackCreditPreference(code, name, 0, "", 0, "requested");
}
