import * as text from "../../../../kit/text.js";

/** Where a fallback preference rule is in its life cycle. */
export type FallbackPreferenceRuleStatus = "created" | "validated" | "published" | "retired";

/** A fallback preference rule. Its code is unique within a tenant. */
export class FallbackPreferenceRule {
  code: string;
  title: string;
  tags: string[];
  createdAt: number;
  campaignRef: string;
  status: FallbackPreferenceRuleStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    createdAt: number,
    campaignRef: string,
    status: FallbackPreferenceRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.createdAt = createdAt;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: FallbackPreferenceRuleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: FallbackPreferenceRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback preference rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): FallbackPreferenceRule {
    return new FallbackPreferenceRule(this.code, this.title, this.tags, this.createdAt, this.campaignRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a fallback preference rule in status created. */
export function newFallbackPreferenceRule(code: string, title: string): FallbackPreferenceRule {
  return new FallbackPreferenceRule(code, title, [], 0, "", "created");
}
