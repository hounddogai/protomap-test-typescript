/**
 * The default frequency draft records of adops's frequency work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default frequency draft is in its life cycle. */
export type DefaultFrequencyDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a default frequency draft and its current status. */
export class DefaultFrequencyDraft {
  code: string;
  label: string;
  attributes: Map<string, string>;
  source: string;
  category: string;
  quantity: number;
  status: DefaultFrequencyDraftStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    source: string,
    category: string,
    quantity: number,
    status: DefaultFrequencyDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.source = source;
    this.category = category;
    this.quantity = quantity;
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

  canMoveTo(next: DefaultFrequencyDraftStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        return next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultFrequencyDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default frequency draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"default frequency draft"} ${this.code}`;
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

  copy(): DefaultFrequencyDraft {
    return new DefaultFrequencyDraft(
      this.code,
      this.label,
      this.attributes,
      this.source,
      this.category,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a default frequency draft in status open. */
export function newDefaultFrequencyDraft(code: string, label: string): DefaultFrequencyDraft {
  return new DefaultFrequencyDraft(code, label, new Map<string, string>(), "", "", 0, "open");
}
