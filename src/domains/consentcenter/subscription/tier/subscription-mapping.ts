import * as text from "../../../../kit/text.js";

/** Where a subscription mapping is in its life cycle. */
export type SubscriptionMappingStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One subscription mapping, with what the planners need to act on it. */
export class SubscriptionMapping {
  code: string;
  title: string;
  label: string;
  region: string;
  name: string;
  checksum: string;
  attributes: Map<string, string>;
  score: number;
  status: SubscriptionMappingStatus;

  constructor(
    code: string,
    title: string,
    label: string,
    region: string,
    name: string,
    checksum: string,
    attributes: Map<string, string>,
    score: number,
    status: SubscriptionMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.region = region;
    this.name = name;
    this.checksum = checksum;
    this.attributes = attributes;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: SubscriptionMappingStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SubscriptionMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"subscription mapping"} ${this.code}`;
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

  copy(): SubscriptionMapping {
    return new SubscriptionMapping(
      this.code,
      this.title,
      this.label,
      this.region,
      this.name,
      this.checksum,
      this.attributes,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a subscription mapping in status open. */
export function newSubscriptionMapping(code: string, title: string): SubscriptionMapping {
  return new SubscriptionMapping(code, title, "", "", "", "", new Map<string, string>(), 0, "open");
}
