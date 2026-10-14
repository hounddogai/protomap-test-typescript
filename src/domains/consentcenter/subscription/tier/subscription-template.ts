import * as text from "../../../../kit/text.js";

/** Where a subscription template is in its life cycle. */
export type SubscriptionTemplateStatus = "created" | "validated" | "published" | "retired";

/** The record of a subscription template and its current status. */
export class SubscriptionTemplate {
  code: string;
  name: string;
  impressions: number;
  attributes: Map<string, string>;
  visible: boolean;
  reviewer: string;
  ceiling: number;
  expiresAt: number;
  budget: number;
  status: SubscriptionTemplateStatus;

  constructor(
    code: string,
    name: string,
    impressions: number,
    attributes: Map<string, string>,
    visible: boolean,
    reviewer: string,
    ceiling: number,
    expiresAt: number,
    budget: number,
    status: SubscriptionTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.impressions = impressions;
    this.attributes = attributes;
    this.visible = visible;
    this.reviewer = reviewer;
    this.ceiling = ceiling;
    this.expiresAt = expiresAt;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SubscriptionTemplateStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SubscriptionTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"subscription template"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netExposure(): number {
    return Math.round(this.expiresAt * this.impressions * 100) / 100;
  }

  copy(): SubscriptionTemplate {
    return new SubscriptionTemplate(
      this.code,
      this.name,
      this.impressions,
      this.attributes,
      this.visible,
      this.reviewer,
      this.ceiling,
      this.expiresAt,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a subscription template in status created. */
export function newSubscriptionTemplate(code: string, name: string): SubscriptionTemplate {
  return new SubscriptionTemplate(code, name, 0, new Map<string, string>(), false, "", 0, 0, 0, "created");
}
