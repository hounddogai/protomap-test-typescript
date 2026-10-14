import * as text from "../../../../kit/text.js";

/** Where a primary sla plan is in its life cycle. */
export type PrimarySlaPlanStatus = "created" | "validated" | "published" | "retired";

/** A primary sla plan. Its code is unique within a tenant. */
export class PrimarySlaPlan {
  code: string;
  name: string;
  bid: number;
  country: string;
  description: string;
  tags: string[];
  status: PrimarySlaPlanStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    country: string,
    description: string,
    tags: string[],
    status: PrimarySlaPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.country = country;
    this.description = description;
    this.tags = tags;
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

  canMoveTo(next: PrimarySlaPlanStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PrimarySlaPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary sla plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.bid;
  }

  copy(): PrimarySlaPlan {
    return new PrimarySlaPlan(this.code, this.name, this.bid, this.country, this.description, this.tags, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a primary sla plan in status created. */
export function newPrimarySlaPlan(code: string, name: string): PrimarySlaPlan {
  return new PrimarySlaPlan(code, name, 0, "", "", [], "created");
}
