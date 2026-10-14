import * as text from "../../../../kit/text.js";

/** Where a fallback retention bundle is in its life cycle. */
export type FallbackRetentionBundleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A fallback retention bundle as the retention team keeps it. */
export class FallbackRetentionBundle {
  code: string;
  name: string;
  tags: string[];
  frequencyCap: number;
  endsAt: number;
  budget: number;
  createdAt: number;
  priority: number;
  threshold: number;
  status: FallbackRetentionBundleStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    frequencyCap: number,
    endsAt: number,
    budget: number,
    createdAt: number,
    priority: number,
    threshold: number,
    status: FallbackRetentionBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.frequencyCap = frequencyCap;
    this.endsAt = endsAt;
    this.budget = budget;
    this.createdAt = createdAt;
    this.priority = priority;
    this.threshold = threshold;
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

  canMoveTo(next: FallbackRetentionBundleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
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

  moveTo(next: FallbackRetentionBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback retention bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"fallback retention bundle"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedLoad(): number {
    return Math.round((this.createdAt + this.frequencyCap) * 100) / 100;
  }

  copy(): FallbackRetentionBundle {
    return new FallbackRetentionBundle(
      this.code,
      this.name,
      this.tags,
      this.frequencyCap,
      this.endsAt,
      this.budget,
      this.createdAt,
      this.priority,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback retention bundle in status planned. */
export function newFallbackRetentionBundle(code: string, name: string): FallbackRetentionBundle {
  return new FallbackRetentionBundle(code, name, [], 0, 0, 0, 0, 0, 0, "planned");
}
