/**
 * The flight summary records of adops's flight work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a flight summary is in its life cycle. */
export type FlightSummaryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A flight summary. Its code is unique within a tenant. */
export class FlightSummary {
  code: string;
  name: string;
  utmSource: string;
  budget: number;
  contactEmail: string;
  active: boolean;
  attributes: Map<string, string>;
  channel: string;
  description: string;
  status: FlightSummaryStatus;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    budget: number,
    contactEmail: string,
    active: boolean,
    attributes: Map<string, string>,
    channel: string,
    description: string,
    status: FlightSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.budget = budget;
    this.contactEmail = contactEmail;
    this.active = active;
    this.attributes = attributes;
    this.channel = channel;
    this.description = description;
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

  canMoveTo(next: FlightSummaryStatus): boolean {
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
          case "reopened":
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

  moveTo(next: FlightSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"flight summary"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): FlightSummary {
    return new FlightSummary(
      this.code,
      this.name,
      this.utmSource,
      this.budget,
      this.contactEmail,
      this.active,
      this.attributes,
      this.channel,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a flight summary in status open. */
export function newFlightSummary(code: string, name: string): FlightSummary {
  return new FlightSummary(code, name, "", 0, "", false, new Map<string, string>(), "", "", "open");
}
