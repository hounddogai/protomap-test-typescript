/**
 * The macro claim records of support's macro work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a macro claim is in its life cycle. */
export type MacroClaimStatus = "requested" | "granted" | "revoked" | "expired";

/** One macro claim, with what the planners need to act on it. */
export class MacroClaim {
  code: string;
  name: string;
  endsAt: number;
  ownerId: string;
  attributes: Map<string, string>;
  status: MacroClaimStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    ownerId: string,
    attributes: Map<string, string>,
    status: MacroClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.ownerId = ownerId;
    this.attributes = attributes;
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

  canMoveTo(next: MacroClaimStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: MacroClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
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
    return this.endsAt;
  }

  copy(): MacroClaim {
    return new MacroClaim(this.code, this.name, this.endsAt, this.ownerId, this.attributes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a macro claim in status requested. */
export function newMacroClaim(code: string, name: string): MacroClaim {
  return new MacroClaim(code, name, 0, "", new Map<string, string>(), "requested");
}
