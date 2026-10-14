/**
 * The regional ticket view bundle records of support's ticket view work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional ticket view bundle is in its life cycle. */
export type RegionalTicketViewBundleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A regional ticket view bundle. Its code is unique within a tenant. */
export class RegionalTicketViewBundle {
  code: string;
  label: string;
  quantity: number;
  summary: string;
  region: string;
  attributes: Map<string, string>;
  status: RegionalTicketViewBundleStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    summary: string,
    region: string,
    attributes: Map<string, string>,
    status: RegionalTicketViewBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.summary = summary;
    this.region = region;
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

  canMoveTo(next: RegionalTicketViewBundleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
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

  moveTo(next: RegionalTicketViewBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional ticket view bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
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

  copy(): RegionalTicketViewBundle {
    return new RegionalTicketViewBundle(
      this.code,
      this.label,
      this.quantity,
      this.summary,
      this.region,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a regional ticket view bundle in status open. */
export function newRegionalTicketViewBundle(code: string, label: string): RegionalTicketViewBundle {
  return new RegionalTicketViewBundle(code, label, 0, "", "", new Map<string, string>(), "open");
}
