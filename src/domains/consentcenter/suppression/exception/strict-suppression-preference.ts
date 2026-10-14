import * as text from "../../../../kit/text.js";

/** Where a strict suppression preference is in its life cycle. */
export type StrictSuppressionPreferenceStatus = "requested" | "granted" | "revoked" | "expired";

/** A strict suppression preference. Its code is unique within a tenant. */
export class StrictSuppressionPreference {
  code: string;
  title: string;
  active: boolean;
  budget: number;
  maximum: number;
  status: StrictSuppressionPreferenceStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    budget: number,
    maximum: number,
    status: StrictSuppressionPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.budget = budget;
    this.maximum = maximum;
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

  canMoveTo(next: StrictSuppressionPreferenceStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
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

  moveTo(next: StrictSuppressionPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict suppression preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedLoad(): number {
    return Math.round(this.maximum * this.budget * 100) / 100;
  }

  copy(): StrictSuppressionPreference {
    return new StrictSuppressionPreference(this.code, this.title, this.active, this.budget, this.maximum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict suppression preference in status requested. */
export function newStrictSuppressionPreference(code: string, title: string): StrictSuppressionPreference {
  return new StrictSuppressionPreference(code, title, false, 0, 0, "requested");
}
