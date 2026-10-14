import * as text from "../../../../kit/text.js";

/** Where a fallback queue rule is in its life cycle. */
export type FallbackQueueRuleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One fallback queue rule, with what the planners need to act on it. */
export class FallbackQueueRule {
  code: string;
  name: string;
  archived: boolean;
  country: string;
  checksum: string;
  notes: string;
  attributes: Map<string, string>;
  pinned: boolean;
  score: number;
  status: FallbackQueueRuleStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    country: string,
    checksum: string,
    notes: string,
    attributes: Map<string, string>,
    pinned: boolean,
    score: number,
    status: FallbackQueueRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.country = country;
    this.checksum = checksum;
    this.notes = notes;
    this.attributes = attributes;
    this.pinned = pinned;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackQueueRuleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackQueueRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback queue rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback queue rule"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): FallbackQueueRule {
    return new FallbackQueueRule(
      this.code,
      this.name,
      this.archived,
      this.country,
      this.checksum,
      this.notes,
      this.attributes,
      this.pinned,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a fallback queue rule in status idle. */
export function newFallbackQueueRule(code: string, name: string): FallbackQueueRule {
  return new FallbackQueueRule(code, name, false, "", "", "", new Map<string, string>(), false, 0, "idle");
}
