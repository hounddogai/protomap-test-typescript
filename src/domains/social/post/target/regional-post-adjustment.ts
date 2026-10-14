import * as text from "../../../../kit/text.js";

/** Where a regional post adjustment is in its life cycle. */
export type RegionalPostAdjustmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A regional post adjustment. Its code is unique within a tenant. */
export class RegionalPostAdjustment {
  code: string;
  label: string;
  rate: number;
  retries: number;
  title: string;
  version: number;
  attributes: Map<string, string>;
  discount: number;
  audienceId: string;
  notes: string;
  weight: number;
  status: RegionalPostAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    retries: number,
    title: string,
    version: number,
    attributes: Map<string, string>,
    discount: number,
    audienceId: string,
    notes: string,
    weight: number,
    status: RegionalPostAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.retries = retries;
    this.title = title;
    this.version = version;
    this.attributes = attributes;
    this.discount = discount;
    this.audienceId = audienceId;
    this.notes = notes;
    this.weight = weight;
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

  canMoveTo(next: RegionalPostAdjustmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalPostAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional post adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedTotal(): number {
    return Math.round(this.version * this.weight * 100) / 100;
  }

  copy(): RegionalPostAdjustment {
    return new RegionalPostAdjustment(
      this.code,
      this.label,
      this.rate,
      this.retries,
      this.title,
      this.version,
      this.attributes,
      this.discount,
      this.audienceId,
      this.notes,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional post adjustment in status proposed. */
export function newRegionalPostAdjustment(code: string, label: string): RegionalPostAdjustment {
  return new RegionalPostAdjustment(code, label, 0, 0, "", 0, new Map<string, string>(), 0, "", "", 0, "proposed");
}
