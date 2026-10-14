/**
 * The tiered wait group records of journeys's wait work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered wait group is in its life cycle. */
export type TieredWaitGroupStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a tiered wait group and its current status. */
export class TieredWaitGroup {
  code: string;
  name: string;
  phone: string;
  country: string;
  margin: number;
  attributes: Map<string, string>;
  approved: boolean;
  title: string;
  status: TieredWaitGroupStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    country: string,
    margin: number,
    attributes: Map<string, string>,
    approved: boolean,
    title: string,
    status: TieredWaitGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.country = country;
    this.margin = margin;
    this.attributes = attributes;
    this.approved = approved;
    this.title = title;
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

  canMoveTo(next: TieredWaitGroupStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredWaitGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered wait group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"tiered wait group"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.margin;
  }

  copy(): TieredWaitGroup {
    return new TieredWaitGroup(
      this.code,
      this.name,
      this.phone,
      this.country,
      this.margin,
      this.attributes,
      this.approved,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a tiered wait group in status open. */
export function newTieredWaitGroup(code: string, name: string): TieredWaitGroup {
  return new TieredWaitGroup(code, name, "", "", 0, new Map<string, string>(), false, "", "open");
}
