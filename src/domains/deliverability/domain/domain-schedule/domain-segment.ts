import * as text from "../../../../kit/text.js";

/** Where a domain segment is in its life cycle. */
export type DomainSegmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One domain segment, with what the planners need to act on it. */
export class DomainSegment {
  code: string;
  label: string;
  retries: number;
  minimum: number;
  country: string;
  cost: number;
  tags: string[];
  weight: number;
  status: DomainSegmentStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    minimum: number,
    country: string,
    cost: number,
    tags: string[],
    weight: number,
    status: DomainSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.minimum = minimum;
    this.country = country;
    this.cost = cost;
    this.tags = tags;
    this.weight = weight;
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

  canMoveTo(next: DomainSegmentStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: DomainSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round((this.cost + this.minimum) * 100) / 100;
  }

  copy(): DomainSegment {
    return new DomainSegment(
      this.code,
      this.label,
      this.retries,
      this.minimum,
      this.country,
      this.cost,
      this.tags,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a domain segment in status draft. */
export function newDomainSegment(code: string, label: string): DomainSegment {
  return new DomainSegment(code, label, 0, 0, "", 0, [], 0, "draft");
}
