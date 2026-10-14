/**
 * The placement assignment records of adops's placement work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a placement assignment is in its life cycle. */
export type PlacementAssignmentStatus = "created" | "validated" | "published" | "retired";

/** One placement assignment, with what the planners need to act on it. */
export class PlacementAssignment {
  code: string;
  name: string;
  approved: boolean;
  contactEmail: string;
  currency: string;
  campaignRef: string;
  cost: number;
  attributes: Map<string, string>;
  status: PlacementAssignmentStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    contactEmail: string,
    currency: string,
    campaignRef: string,
    cost: number,
    attributes: Map<string, string>,
    status: PlacementAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.contactEmail = contactEmail;
    this.currency = currency;
    this.campaignRef = campaignRef;
    this.cost = cost;
    this.attributes = attributes;
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

  canMoveTo(next: PlacementAssignmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PlacementAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.cost;
  }

  copy(): PlacementAssignment {
    return new PlacementAssignment(
      this.code,
      this.name,
      this.approved,
      this.contactEmail,
      this.currency,
      this.campaignRef,
      this.cost,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a placement assignment in status created. */
export function newPlacementAssignment(code: string, name: string): PlacementAssignment {
  return new PlacementAssignment(code, name, false, "", "", "", 0, new Map<string, string>(), "created");
}
