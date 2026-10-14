import * as text from "../../../../kit/text.js";

/** Where a adaptive suppression policy is in its life cycle. */
export type AdaptiveSuppressionPolicyStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A adaptive suppression policy as the suppression team keeps it. */
export class AdaptiveSuppressionPolicy {
  code: string;
  label: string;
  minimum: number;
  locale: string;
  ceiling: number;
  quantity: number;
  region: string;
  discount: number;
  title: string;
  attributes: Map<string, string>;
  frequencyCap: number;
  status: AdaptiveSuppressionPolicyStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    locale: string,
    ceiling: number,
    quantity: number,
    region: string,
    discount: number,
    title: string,
    attributes: Map<string, string>,
    frequencyCap: number,
    status: AdaptiveSuppressionPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.locale = locale;
    this.ceiling = ceiling;
    this.quantity = quantity;
    this.region = region;
    this.discount = discount;
    this.title = title;
    this.attributes = attributes;
    this.frequencyCap = frequencyCap;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveSuppressionPolicyStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: AdaptiveSuppressionPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive suppression policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"adaptive suppression policy"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedTotal(): number {
    return Math.round(this.frequencyCap * this.ceiling * 100) / 100;
  }

  copy(): AdaptiveSuppressionPolicy {
    return new AdaptiveSuppressionPolicy(
      this.code,
      this.label,
      this.minimum,
      this.locale,
      this.ceiling,
      this.quantity,
      this.region,
      this.discount,
      this.title,
      this.attributes,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a adaptive suppression policy in status idle. */
export function newAdaptiveSuppressionPolicy(code: string, label: string): AdaptiveSuppressionPolicy {
  return new AdaptiveSuppressionPolicy(code, label, 0, "", 0, 0, "", 0, "", new Map<string, string>(), 0, "idle");
}
