/**
 * The pending opt out assignment records of consentcenter's opt out work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending opt out assignment is in its life cycle. */
export type PendingOptOutAssignmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A pending opt out assignment. Its code is unique within a tenant. */
export class PendingOptOutAssignment {
  code: string;
  title: string;
  frequencyCap: number;
  campaignRef: string;
  cohort: string;
  attributes: Map<string, string>;
  retries: number;
  visible: boolean;
  category: string;
  description: string;
  channel: string;
  status: PendingOptOutAssignmentStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    campaignRef: string,
    cohort: string,
    attributes: Map<string, string>,
    retries: number,
    visible: boolean,
    category: string,
    description: string,
    channel: string,
    status: PendingOptOutAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.campaignRef = campaignRef;
    this.cohort = cohort;
    this.attributes = attributes;
    this.retries = retries;
    this.visible = visible;
    this.category = category;
    this.description = description;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingOptOutAssignmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingOptOutAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending opt out assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending opt out assignment"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedValue(): number {
    return Math.round((this.retries - this.frequencyCap) * 100) / 100;
  }

  copy(): PendingOptOutAssignment {
    return new PendingOptOutAssignment(
      this.code,
      this.title,
      this.frequencyCap,
      this.campaignRef,
      this.cohort,
      this.attributes,
      this.retries,
      this.visible,
      this.category,
      this.description,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a pending opt out assignment in status proposed. */
export function newPendingOptOutAssignment(code: string, title: string): PendingOptOutAssignment {
  return new PendingOptOutAssignment(
    code,
    title,
    0,
    "",
    "",
    new Map<string, string>(),
    0,
    false,
    "",
    "",
    "",
    "proposed",
  );
}
