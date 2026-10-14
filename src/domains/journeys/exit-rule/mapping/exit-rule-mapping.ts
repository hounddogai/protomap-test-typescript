/**
 * The exit rule mapping records of journeys's exit rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a exit rule mapping is in its life cycle. */
export type ExitRuleMappingStatus = "requested" | "granted" | "revoked" | "expired";

/** One exit rule mapping, with what the planners need to act on it. */
export class ExitRuleMapping {
  code: string;
  title: string;
  phone: string;
  attributes: Map<string, string>;
  sequence: number;
  contactEmail: string;
  status: ExitRuleMappingStatus;

  constructor(
    code: string,
    title: string,
    phone: string,
    attributes: Map<string, string>,
    sequence: number,
    contactEmail: string,
    status: ExitRuleMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.attributes = attributes;
    this.sequence = sequence;
    this.contactEmail = contactEmail;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ExitRuleMappingStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ExitRuleMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"exit rule mapping"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.sequence;
  }

  copy(): ExitRuleMapping {
    return new ExitRuleMapping(
      this.code,
      this.title,
      this.phone,
      this.attributes,
      this.sequence,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a exit rule mapping in status requested. */
export function newExitRuleMapping(code: string, title: string): ExitRuleMapping {
  return new ExitRuleMapping(code, title, "", new Map<string, string>(), 0, "", "requested");
}
