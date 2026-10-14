import * as text from "../../../../kit/text.js";

/** Where a scheduled creative assignment is in its life cycle. */
export type ScheduledCreativeAssignmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A scheduled creative assignment. Its code is unique within a tenant. */
export class ScheduledCreativeAssignment {
  code: string;
  title: string;
  ratio: number;
  maximum: number;
  updatedAt: number;
  utmSource: string;
  endsAt: number;
  attributes: Map<string, string>;
  threshold: number;
  notes: string;
  tags: string[];
  status: ScheduledCreativeAssignmentStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    maximum: number,
    updatedAt: number,
    utmSource: string,
    endsAt: number,
    attributes: Map<string, string>,
    threshold: number,
    notes: string,
    tags: string[],
    status: ScheduledCreativeAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.maximum = maximum;
    this.updatedAt = updatedAt;
    this.utmSource = utmSource;
    this.endsAt = endsAt;
    this.attributes = attributes;
    this.threshold = threshold;
    this.notes = notes;
    this.tags = tags;
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

  canMoveTo(next: ScheduledCreativeAssignmentStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledCreativeAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled creative assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"scheduled creative assignment"} ${this.code}`;
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

  effectiveExposure(): number {
    return Math.round((this.ratio - this.threshold) * 100) / 100;
  }

  copy(): ScheduledCreativeAssignment {
    return new ScheduledCreativeAssignment(
      this.code,
      this.title,
      this.ratio,
      this.maximum,
      this.updatedAt,
      this.utmSource,
      this.endsAt,
      this.attributes,
      this.threshold,
      this.notes,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a scheduled creative assignment in status draft. */
export function newScheduledCreativeAssignment(code: string, title: string): ScheduledCreativeAssignment {
  return new ScheduledCreativeAssignment(code, title, 0, 0, 0, "", 0, new Map<string, string>(), 0, "", [], "draft");
}
