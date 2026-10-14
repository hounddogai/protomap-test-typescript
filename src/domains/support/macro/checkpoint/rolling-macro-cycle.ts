import * as text from "../../../../kit/text.js";

/** Where a rolling macro cycle is in its life cycle. */
export type RollingMacroCycleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One rolling macro cycle, with what the planners need to act on it. */
export class RollingMacroCycle {
  code: string;
  label: string;
  variant: string;
  attributes: Map<string, string>;
  ownerId: string;
  minimum: number;
  journeyId: string;
  contactEmail: string;
  status: RollingMacroCycleStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    attributes: Map<string, string>,
    ownerId: string,
    minimum: number,
    journeyId: string,
    contactEmail: string,
    status: RollingMacroCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.attributes = attributes;
    this.ownerId = ownerId;
    this.minimum = minimum;
    this.journeyId = journeyId;
    this.contactEmail = contactEmail;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingMacroCycleStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        return next === "suspended";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RollingMacroCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling macro cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.minimum;
  }

  copy(): RollingMacroCycle {
    return new RollingMacroCycle(
      this.code,
      this.label,
      this.variant,
      this.attributes,
      this.ownerId,
      this.minimum,
      this.journeyId,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling macro cycle in status draft. */
export function newRollingMacroCycle(code: string, label: string): RollingMacroCycle {
  return new RollingMacroCycle(code, label, "", new Map<string, string>(), "", 0, "", "", "draft");
}
