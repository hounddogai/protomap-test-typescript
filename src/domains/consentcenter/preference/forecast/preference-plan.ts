import * as text from "../../../../kit/text.js";

/** Where a preference plan is in its life cycle. */
export type PreferencePlanStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A preference plan. Its code is unique within a tenant. */
export class PreferencePlan {
  code: string;
  label: string;
  category: string;
  title: string;
  ceiling: number;
  revision: number;
  rate: number;
  minimum: number;
  weight: number;
  country: string;
  status: PreferencePlanStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    title: string,
    ceiling: number,
    revision: number,
    rate: number,
    minimum: number,
    weight: number,
    country: string,
    status: PreferencePlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.title = title;
    this.ceiling = ceiling;
    this.revision = revision;
    this.rate = rate;
    this.minimum = minimum;
    this.weight = weight;
    this.country = country;
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

  canMoveTo(next: PreferencePlanStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PreferencePlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedVolume(): number {
    return Math.round((this.rate - this.ceiling) * 100) / 100;
  }

  copy(): PreferencePlan {
    return new PreferencePlan(
      this.code,
      this.label,
      this.category,
      this.title,
      this.ceiling,
      this.revision,
      this.rate,
      this.minimum,
      this.weight,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a preference plan in status proposed. */
export function newPreferencePlan(code: string, label: string): PreferencePlan {
  return new PreferencePlan(code, label, "", "", 0, 0, 0, 0, 0, "", "proposed");
}
