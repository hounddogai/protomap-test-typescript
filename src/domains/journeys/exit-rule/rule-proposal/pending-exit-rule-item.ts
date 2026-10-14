import * as text from "../../../../kit/text.js";

/** Where a pending exit rule item is in its life cycle. */
export type PendingExitRuleItemStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A pending exit rule item as the exit rule team keeps it. */
export class PendingExitRuleItem {
  code: string;
  label: string;
  batchSize: number;
  reviewer: string;
  openRate: number;
  country: string;
  active: boolean;
  cost: number;
  frequencyCap: number;
  title: string;
  attributes: Map<string, string>;
  status: PendingExitRuleItemStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    reviewer: string,
    openRate: number,
    country: string,
    active: boolean,
    cost: number,
    frequencyCap: number,
    title: string,
    attributes: Map<string, string>,
    status: PendingExitRuleItemStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.reviewer = reviewer;
    this.openRate = openRate;
    this.country = country;
    this.active = active;
    this.cost = cost;
    this.frequencyCap = frequencyCap;
    this.title = title;
    this.attributes = attributes;
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

  canMoveTo(next: PendingExitRuleItemStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
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

  moveTo(next: PendingExitRuleItemStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending exit rule item ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"pending exit rule item"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netLoad(): number {
    return Math.round(this.openRate * this.frequencyCap * 100) / 100;
  }

  copy(): PendingExitRuleItem {
    return new PendingExitRuleItem(
      this.code,
      this.label,
      this.batchSize,
      this.reviewer,
      this.openRate,
      this.country,
      this.active,
      this.cost,
      this.frequencyCap,
      this.title,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a pending exit rule item in status open. */
export function newPendingExitRuleItem(code: string, label: string): PendingExitRuleItem {
  return new PendingExitRuleItem(code, label, 0, "", 0, "", false, 0, 0, "", new Map<string, string>(), "open");
}
