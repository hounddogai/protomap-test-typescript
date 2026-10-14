/**
 * The seasonal creative notice records of adops's creative work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal creative notice is in its life cycle. */
export type SeasonalCreativeNoticeStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One seasonal creative notice, with what the planners need to act on it. */
export class SeasonalCreativeNotice {
  code: string;
  name: string;
  maximum: number;
  priority: number;
  floorValue: number;
  frequencyCap: number;
  tags: string[];
  attributes: Map<string, string>;
  variant: string;
  status: SeasonalCreativeNoticeStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    priority: number,
    floorValue: number,
    frequencyCap: number,
    tags: string[],
    attributes: Map<string, string>,
    variant: string,
    status: SeasonalCreativeNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.priority = priority;
    this.floorValue = floorValue;
    this.frequencyCap = frequencyCap;
    this.tags = tags;
    this.attributes = attributes;
    this.variant = variant;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalCreativeNoticeStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalCreativeNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal creative notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
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

  weightedValue(): number {
    return Math.round(this.priority * this.maximum * 100) / 100;
  }

  copy(): SeasonalCreativeNotice {
    return new SeasonalCreativeNotice(
      this.code,
      this.name,
      this.maximum,
      this.priority,
      this.floorValue,
      this.frequencyCap,
      this.tags,
      this.attributes,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal creative notice in status proposed. */
export function newSeasonalCreativeNotice(code: string, name: string): SeasonalCreativeNotice {
  return new SeasonalCreativeNotice(code, name, 0, 0, 0, 0, [], new Map<string, string>(), "", "proposed");
}
