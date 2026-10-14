/**
 * The default flight ledger records of adops's flight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default flight ledger is in its life cycle. */
export type DefaultFlightLedgerStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A default flight ledger. Its code is unique within a tenant. */
export class DefaultFlightLedger {
  code: string;
  label: string;
  threshold: number;
  tags: string[];
  contactEmail: string;
  title: string;
  attributes: Map<string, string>;
  status: DefaultFlightLedgerStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    tags: string[],
    contactEmail: string,
    title: string,
    attributes: Map<string, string>,
    status: DefaultFlightLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.tags = tags;
    this.contactEmail = contactEmail;
    this.title = title;
    this.attributes = attributes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultFlightLedgerStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: DefaultFlightLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default flight ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
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
    return this.threshold;
  }

  copy(): DefaultFlightLedger {
    return new DefaultFlightLedger(
      this.code,
      this.label,
      this.threshold,
      this.tags,
      this.contactEmail,
      this.title,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default flight ledger in status planned. */
export function newDefaultFlightLedger(code: string, label: string): DefaultFlightLedger {
  return new DefaultFlightLedger(code, label, 0, [], "", "", new Map<string, string>(), "planned");
}
