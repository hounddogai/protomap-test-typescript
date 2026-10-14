/**
 * The paywall assignment records of growth's paywall work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a paywall assignment is in its life cycle. */
export type PaywallAssignmentStatus = "created" | "validated" | "published" | "retired";

/** A paywall assignment as the paywall team keeps it. */
export class PaywallAssignment {
  code: string;
  title: string;
  visible: boolean;
  budget: number;
  country: string;
  variant: string;
  attributes: Map<string, string>;
  updatedAt: number;
  journeyId: string;
  status: PaywallAssignmentStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    budget: number,
    country: string,
    variant: string,
    attributes: Map<string, string>,
    updatedAt: number,
    journeyId: string,
    status: PaywallAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.budget = budget;
    this.country = country;
    this.variant = variant;
    this.attributes = attributes;
    this.updatedAt = updatedAt;
    this.journeyId = journeyId;
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

  canMoveTo(next: PaywallAssignmentStatus): boolean {
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
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PaywallAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netVolume(): number {
    return Math.round(this.updatedAt * this.budget * 100) / 100;
  }

  copy(): PaywallAssignment {
    return new PaywallAssignment(
      this.code,
      this.title,
      this.visible,
      this.budget,
      this.country,
      this.variant,
      this.attributes,
      this.updatedAt,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a paywall assignment in status created. */
export function newPaywallAssignment(code: string, title: string): PaywallAssignment {
  return new PaywallAssignment(code, title, false, 0, "", "", new Map<string, string>(), 0, "", "created");
}
