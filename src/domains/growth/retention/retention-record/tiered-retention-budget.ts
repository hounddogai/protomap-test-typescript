import * as text from "../../../../kit/text.js";

/** Where a tiered retention budget is in its life cycle. */
export type TieredRetentionBudgetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tiered retention budget. Its code is unique within a tenant. */
export class TieredRetentionBudget {
  code: string;
  label: string;
  channel: string;
  discount: number;
  tags: string[];
  attributes: Map<string, string>;
  approved: boolean;
  campaignRef: string;
  status: TieredRetentionBudgetStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    discount: number,
    tags: string[],
    attributes: Map<string, string>,
    approved: boolean,
    campaignRef: string,
    status: TieredRetentionBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.discount = discount;
    this.tags = tags;
    this.attributes = attributes;
    this.approved = approved;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: TieredRetentionBudgetStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredRetentionBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered retention budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.discount;
  }

  copy(): TieredRetentionBudget {
    return new TieredRetentionBudget(
      this.code,
      this.label,
      this.channel,
      this.discount,
      this.tags,
      this.attributes,
      this.approved,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered retention budget in status planned. */
export function newTieredRetentionBudget(code: string, label: string): TieredRetentionBudget {
  return new TieredRetentionBudget(code, label, "", 0, [], new Map<string, string>(), false, "", "planned");
}
