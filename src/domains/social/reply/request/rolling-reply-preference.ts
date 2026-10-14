import * as text from "../../../../kit/text.js";

/** Where a rolling reply preference is in its life cycle. */
export type RollingReplyPreferenceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A rolling reply preference. Its code is unique within a tenant. */
export class RollingReplyPreference {
  code: string;
  label: string;
  campaignRef: string;
  region: string;
  attributes: Map<string, string>;
  amount: number;
  status: RollingReplyPreferenceStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    region: string,
    attributes: Map<string, string>,
    amount: number,
    status: RollingReplyPreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.region = region;
    this.attributes = attributes;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingReplyPreferenceStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RollingReplyPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling reply preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): RollingReplyPreference {
    return new RollingReplyPreference(
      this.code,
      this.label,
      this.campaignRef,
      this.region,
      this.attributes,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a rolling reply preference in status planned. */
export function newRollingReplyPreference(code: string, label: string): RollingReplyPreference {
  return new RollingReplyPreference(code, label, "", "", new Map<string, string>(), 0, "planned");
}
