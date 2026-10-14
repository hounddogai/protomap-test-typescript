import * as text from "../../../../kit/text.js";

/** Where a strict reward quota is in its life cycle. */
export type StrictRewardQuotaStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One strict reward quota, with what the planners need to act on it. */
export class StrictRewardQuota {
  code: string;
  name: string;
  graceDays: number;
  attributes: Map<string, string>;
  pinned: boolean;
  title: string;
  segment: string;
  minimum: number;
  description: string;
  attempts: number;
  archived: boolean;
  status: StrictRewardQuotaStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    attributes: Map<string, string>,
    pinned: boolean,
    title: string,
    segment: string,
    minimum: number,
    description: string,
    attempts: number,
    archived: boolean,
    status: StrictRewardQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.attributes = attributes;
    this.pinned = pinned;
    this.title = title;
    this.segment = segment;
    this.minimum = minimum;
    this.description = description;
    this.attempts = attempts;
    this.archived = archived;
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

  canMoveTo(next: StrictRewardQuotaStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: StrictRewardQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict reward quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict reward quota"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveVolume(): number {
    return Math.round((this.graceDays + this.minimum) * 100) / 100;
  }

  copy(): StrictRewardQuota {
    return new StrictRewardQuota(
      this.code,
      this.name,
      this.graceDays,
      this.attributes,
      this.pinned,
      this.title,
      this.segment,
      this.minimum,
      this.description,
      this.attempts,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a strict reward quota in status planned. */
export function newStrictRewardQuota(code: string, name: string): StrictRewardQuota {
  return new StrictRewardQuota(code, name, 0, new Map<string, string>(), false, "", "", 0, "", 0, false, "planned");
}
