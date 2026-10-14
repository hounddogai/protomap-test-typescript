import * as text from "../../../../kit/text.js";

/** Where a paywall template is in its life cycle. */
export type PaywallTemplateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a paywall template and its current status. */
export class PaywallTemplate {
  code: string;
  label: string;
  segment: string;
  attributes: Map<string, string>;
  budget: number;
  reviewer: string;
  journeyId: string;
  source: string;
  status: PaywallTemplateStatus;

  constructor(
    code: string,
    label: string,
    segment: string,
    attributes: Map<string, string>,
    budget: number,
    reviewer: string,
    journeyId: string,
    source: string,
    status: PaywallTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.attributes = attributes;
    this.budget = budget;
    this.reviewer = reviewer;
    this.journeyId = journeyId;
    this.source = source;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PaywallTemplateStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PaywallTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"paywall template"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): PaywallTemplate {
    return new PaywallTemplate(
      this.code,
      this.label,
      this.segment,
      this.attributes,
      this.budget,
      this.reviewer,
      this.journeyId,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a paywall template in status draft. */
export function newPaywallTemplate(code: string, label: string): PaywallTemplate {
  return new PaywallTemplate(code, label, "", new Map<string, string>(), 0, "", "", "", "draft");
}
