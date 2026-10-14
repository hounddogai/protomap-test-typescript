/**
 * The adaptive placement template records of adops's placement work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive placement template is in its life cycle. */
export type AdaptivePlacementTemplateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A adaptive placement template. Its code is unique within a tenant. */
export class AdaptivePlacementTemplate {
  code: string;
  name: string;
  createdAt: number;
  budget: number;
  checksum: string;
  label: string;
  score: number;
  notes: string;
  attributes: Map<string, string>;
  approved: boolean;
  status: AdaptivePlacementTemplateStatus;

  constructor(
    code: string,
    name: string,
    createdAt: number,
    budget: number,
    checksum: string,
    label: string,
    score: number,
    notes: string,
    attributes: Map<string, string>,
    approved: boolean,
    status: AdaptivePlacementTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.budget = budget;
    this.checksum = checksum;
    this.label = label;
    this.score = score;
    this.notes = notes;
    this.attributes = attributes;
    this.approved = approved;
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

  canMoveTo(next: AdaptivePlacementTemplateStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptivePlacementTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive placement template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"adaptive placement template"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedExposure(): number {
    return Math.round((this.budget - this.score) * 100) / 100;
  }

  copy(): AdaptivePlacementTemplate {
    return new AdaptivePlacementTemplate(
      this.code,
      this.name,
      this.createdAt,
      this.budget,
      this.checksum,
      this.label,
      this.score,
      this.notes,
      this.attributes,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive placement template in status open. */
export function newAdaptivePlacementTemplate(code: string, name: string): AdaptivePlacementTemplate {
  return new AdaptivePlacementTemplate(code, name, 0, 0, "", "", 0, "", new Map<string, string>(), false, "open");
}
