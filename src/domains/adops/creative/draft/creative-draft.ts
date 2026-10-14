/**
 * The creative draft records of adops's creative work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a creative draft is in its life cycle. */
export type CreativeDraftStatus = "requested" | "granted" | "revoked" | "expired";

/** A creative draft. Its code is unique within a tenant. */
export class CreativeDraft {
  code: string;
  name: string;
  priority: number;
  discount: number;
  title: string;
  floorValue: number;
  status: CreativeDraftStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    discount: number,
    title: string,
    floorValue: number,
    status: CreativeDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.discount = discount;
    this.title = title;
    this.floorValue = floorValue;
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

  canMoveTo(next: CreativeDraftStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: CreativeDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveExposure(): number {
    return Math.round(this.discount * this.priority * 100) / 100;
  }

  copy(): CreativeDraft {
    return new CreativeDraft(
      this.code,
      this.name,
      this.priority,
      this.discount,
      this.title,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a creative draft in status requested. */
export function newCreativeDraft(code: string, name: string): CreativeDraft {
  return new CreativeDraft(code, name, 0, 0, "", 0, "requested");
}
