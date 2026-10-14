import * as text from "../../../../kit/text.js";

/** Where a csat allocation is in its life cycle. */
export type CsatAllocationStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A csat allocation as the csat team keeps it. */
export class CsatAllocation {
  code: string;
  name: string;
  startsAt: number;
  floorValue: number;
  ownerId: string;
  weight: number;
  source: string;
  attributes: Map<string, string>;
  status: CsatAllocationStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    floorValue: number,
    ownerId: string,
    weight: number,
    source: string,
    attributes: Map<string, string>,
    status: CsatAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.floorValue = floorValue;
    this.ownerId = ownerId;
    this.weight = weight;
    this.source = source;
    this.attributes = attributes;
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

  canMoveTo(next: CsatAllocationStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: CsatAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveExposure(): number {
    return Math.round((this.startsAt - this.weight) * 100) / 100;
  }

  copy(): CsatAllocation {
    return new CsatAllocation(
      this.code,
      this.name,
      this.startsAt,
      this.floorValue,
      this.ownerId,
      this.weight,
      this.source,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a csat allocation in status draft. */
export function newCsatAllocation(code: string, name: string): CsatAllocation {
  return new CsatAllocation(code, name, 0, 0, "", 0, "", new Map<string, string>(), "draft");
}
