import * as text from "../../../../kit/text.js";

/** Where a strict subscription bundle is in its life cycle. */
export type StrictSubscriptionBundleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One strict subscription bundle, with what the planners need to act on it. */
export class StrictSubscriptionBundle {
  code: string;
  name: string;
  label: string;
  cost: number;
  tags: string[];
  sendAt: number;
  description: string;
  minimum: number;
  status: StrictSubscriptionBundleStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    cost: number,
    tags: string[],
    sendAt: number,
    description: string,
    minimum: number,
    status: StrictSubscriptionBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.cost = cost;
    this.tags = tags;
    this.sendAt = sendAt;
    this.description = description;
    this.minimum = minimum;
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

  canMoveTo(next: StrictSubscriptionBundleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: StrictSubscriptionBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict subscription bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"strict subscription bundle"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedVolume(): number {
    return Math.round((this.cost + this.sendAt) * 100) / 100;
  }

  copy(): StrictSubscriptionBundle {
    return new StrictSubscriptionBundle(
      this.code,
      this.name,
      this.label,
      this.cost,
      this.tags,
      this.sendAt,
      this.description,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict subscription bundle in status open. */
export function newStrictSubscriptionBundle(code: string, name: string): StrictSubscriptionBundle {
  return new StrictSubscriptionBundle(code, name, "", 0, [], 0, "", 0, "open");
}
