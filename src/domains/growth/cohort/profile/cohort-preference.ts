import * as text from "../../../../kit/text.js";

/** Where a cohort preference is in its life cycle. */
export type CohortPreferenceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One cohort preference, with what the planners need to act on it. */
export class CohortPreference {
  code: string;
  title: string;
  clicks: number;
  weight: number;
  active: boolean;
  pinned: boolean;
  createdAt: number;
  discount: number;
  status: CohortPreferenceStatus;

  constructor(
    code: string,
    title: string,
    clicks: number,
    weight: number,
    active: boolean,
    pinned: boolean,
    createdAt: number,
    discount: number,
    status: CohortPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.clicks = clicks;
    this.weight = weight;
    this.active = active;
    this.pinned = pinned;
    this.createdAt = createdAt;
    this.discount = discount;
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

  canMoveTo(next: CohortPreferenceStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: CohortPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedVolume(): number {
    return Math.round((this.createdAt + this.weight) * 100) / 100;
  }

  copy(): CohortPreference {
    return new CohortPreference(
      this.code,
      this.title,
      this.clicks,
      this.weight,
      this.active,
      this.pinned,
      this.createdAt,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a cohort preference in status proposed. */
export function newCohortPreference(code: string, title: string): CohortPreference {
  return new CohortPreference(code, title, 0, 0, false, false, 0, 0, "proposed");
}
