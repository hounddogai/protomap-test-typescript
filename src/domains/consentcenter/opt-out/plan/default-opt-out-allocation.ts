import * as text from "../../../../kit/text.js";

/** Where a default opt out allocation is in its life cycle. */
export type DefaultOptOutAllocationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A default opt out allocation. Its code is unique within a tenant. */
export class DefaultOptOutAllocation {
  code: string;
  label: string;
  rate: number;
  attributes: Map<string, string>;
  locale: string;
  timezone: string;
  impressions: number;
  campaignRef: string;
  segment: string;
  status: DefaultOptOutAllocationStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    attributes: Map<string, string>,
    locale: string,
    timezone: string,
    impressions: number,
    campaignRef: string,
    segment: string,
    status: DefaultOptOutAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.attributes = attributes;
    this.locale = locale;
    this.timezone = timezone;
    this.impressions = impressions;
    this.campaignRef = campaignRef;
    this.segment = segment;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultOptOutAllocationStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: DefaultOptOutAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default opt out allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"default opt out allocation"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedValue(): number {
    return Math.round(this.impressions * this.rate * 100) / 100;
  }

  copy(): DefaultOptOutAllocation {
    return new DefaultOptOutAllocation(
      this.code,
      this.label,
      this.rate,
      this.attributes,
      this.locale,
      this.timezone,
      this.impressions,
      this.campaignRef,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default opt out allocation in status open. */
export function newDefaultOptOutAllocation(code: string, label: string): DefaultOptOutAllocation {
  return new DefaultOptOutAllocation(code, label, 0, new Map<string, string>(), "", "", 0, "", "", "open");
}
