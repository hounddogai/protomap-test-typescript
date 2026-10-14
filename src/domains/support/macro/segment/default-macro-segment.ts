import * as text from "../../../../kit/text.js";

/** Where a default macro segment is in its life cycle. */
export type DefaultMacroSegmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a default macro segment and its current status. */
export class DefaultMacroSegment {
  code: string;
  label: string;
  version: number;
  rate: number;
  ceiling: number;
  tags: string[];
  name: string;
  weight: number;
  status: DefaultMacroSegmentStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    rate: number,
    ceiling: number,
    tags: string[],
    name: string,
    weight: number,
    status: DefaultMacroSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.rate = rate;
    this.ceiling = ceiling;
    this.tags = tags;
    this.name = name;
    this.weight = weight;
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

  canMoveTo(next: DefaultMacroSegmentStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: DefaultMacroSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default macro segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"default macro segment"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedTotal(): number {
    return Math.round(this.weight * this.ceiling * 100) / 100;
  }

  copy(): DefaultMacroSegment {
    return new DefaultMacroSegment(
      this.code,
      this.label,
      this.version,
      this.rate,
      this.ceiling,
      this.tags,
      this.name,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default macro segment in status planned. */
export function newDefaultMacroSegment(code: string, label: string): DefaultMacroSegment {
  return new DefaultMacroSegment(code, label, 0, 0, 0, [], "", 0, "planned");
}
