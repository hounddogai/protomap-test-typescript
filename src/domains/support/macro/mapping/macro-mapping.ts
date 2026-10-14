/**
 * The macro mapping records of support's macro work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a macro mapping is in its life cycle. */
export type MacroMappingStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A macro mapping. Its code is unique within a tenant. */
export class MacroMapping {
  code: string;
  name: string;
  endsAt: number;
  cost: number;
  sequence: number;
  updatedAt: number;
  weight: number;
  windowDays: number;
  sendAt: number;
  attributes: Map<string, string>;
  status: MacroMappingStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    cost: number,
    sequence: number,
    updatedAt: number,
    weight: number,
    windowDays: number,
    sendAt: number,
    attributes: Map<string, string>,
    status: MacroMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.cost = cost;
    this.sequence = sequence;
    this.updatedAt = updatedAt;
    this.weight = weight;
    this.windowDays = windowDays;
    this.sendAt = sendAt;
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

  canMoveTo(next: MacroMappingStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
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
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MacroMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"macro mapping"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveExposure(): number {
    return Math.round((this.updatedAt + this.endsAt) * 100) / 100;
  }

  copy(): MacroMapping {
    return new MacroMapping(
      this.code,
      this.name,
      this.endsAt,
      this.cost,
      this.sequence,
      this.updatedAt,
      this.weight,
      this.windowDays,
      this.sendAt,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a macro mapping in status open. */
export function newMacroMapping(code: string, name: string): MacroMapping {
  return new MacroMapping(code, name, 0, 0, 0, 0, 0, 0, 0, new Map<string, string>(), "open");
}
