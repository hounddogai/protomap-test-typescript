import * as text from "../../../../kit/text.js";

/** Where a insight policy is in its life cycle. */
export type InsightPolicyStatus = "new" | "queued" | "running" | "done" | "failed";

/** A insight policy as the insight team keeps it. */
export class InsightPolicy {
  code: string;
  title: string;
  category: string;
  reviewer: string;
  tags: string[];
  visible: boolean;
  archived: boolean;
  notes: string;
  attributes: Map<string, string>;
  externalRef: string;
  cohort: string;
  quantity: number;
  status: InsightPolicyStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    reviewer: string,
    tags: string[],
    visible: boolean,
    archived: boolean,
    notes: string,
    attributes: Map<string, string>,
    externalRef: string,
    cohort: string,
    quantity: number,
    status: InsightPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.reviewer = reviewer;
    this.tags = tags;
    this.visible = visible;
    this.archived = archived;
    this.notes = notes;
    this.attributes = attributes;
    this.externalRef = externalRef;
    this.cohort = cohort;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: InsightPolicyStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: InsightPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"insight policy"} ${this.code}`;
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
    return this.quantity;
  }

  copy(): InsightPolicy {
    return new InsightPolicy(
      this.code,
      this.title,
      this.category,
      this.reviewer,
      this.tags,
      this.visible,
      this.archived,
      this.notes,
      this.attributes,
      this.externalRef,
      this.cohort,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a insight policy in status new. */
export function newInsightPolicy(code: string, title: string): InsightPolicy {
  return new InsightPolicy(code, title, "", "", [], false, false, "", new Map<string, string>(), "", "", 0, "new");
}
