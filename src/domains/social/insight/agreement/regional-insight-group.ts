import * as text from "../../../../kit/text.js";

/** Where a regional insight group is in its life cycle. */
export type RegionalInsightGroupStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a regional insight group and its current status. */
export class RegionalInsightGroup {
  code: string;
  label: string;
  discount: number;
  maximum: number;
  durationMinutes: number;
  amount: number;
  attributes: Map<string, string>;
  phone: string;
  description: string;
  status: RegionalInsightGroupStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    maximum: number,
    durationMinutes: number,
    amount: number,
    attributes: Map<string, string>,
    phone: string,
    description: string,
    status: RegionalInsightGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.maximum = maximum;
    this.durationMinutes = durationMinutes;
    this.amount = amount;
    this.attributes = attributes;
    this.phone = phone;
    this.description = description;
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

  canMoveTo(next: RegionalInsightGroupStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
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

  moveTo(next: RegionalInsightGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional insight group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"regional insight group"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedLoad(): number {
    return Math.round((this.maximum + this.durationMinutes) * 100) / 100;
  }

  copy(): RegionalInsightGroup {
    return new RegionalInsightGroup(
      this.code,
      this.label,
      this.discount,
      this.maximum,
      this.durationMinutes,
      this.amount,
      this.attributes,
      this.phone,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional insight group in status requested. */
export function newRegionalInsightGroup(code: string, label: string): RegionalInsightGroup {
  return new RegionalInsightGroup(code, label, 0, 0, 0, 0, new Map<string, string>(), "", "", "requested");
}
