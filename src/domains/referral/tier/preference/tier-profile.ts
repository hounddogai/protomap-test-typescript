import * as text from "../../../../kit/text.js";

/** Where a tier profile is in its life cycle. */
export type TierProfileStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One tier profile, with what the planners need to act on it. */
export class TierProfile {
  code: string;
  name: string;
  floorValue: number;
  tags: string[];
  segment: string;
  category: string;
  status: TierProfileStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    tags: string[],
    segment: string,
    category: string,
    status: TierProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.tags = tags;
    this.segment = segment;
    this.category = category;
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

  canMoveTo(next: TierProfileStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TierProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier profile ${this.code} cannot move from ${this.status} to ${next}`);
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
    return this.floorValue;
  }

  copy(): TierProfile {
    return new TierProfile(this.code, this.name, this.floorValue, this.tags, this.segment, this.category, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a tier profile in status planned. */
export function newTierProfile(code: string, name: string): TierProfile {
  return new TierProfile(code, name, 0, [], "", "", "planned");
}
