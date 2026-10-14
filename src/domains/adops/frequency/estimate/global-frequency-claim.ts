import * as text from "../../../../kit/text.js";

/** Where a global frequency claim is in its life cycle. */
export type GlobalFrequencyClaimStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One global frequency claim, with what the planners need to act on it. */
export class GlobalFrequencyClaim {
  code: string;
  label: string;
  attributes: Map<string, string>;
  revision: number;
  pinned: boolean;
  externalRef: string;
  ceiling: number;
  tags: string[];
  quantity: number;
  frequencyCap: number;
  cost: number;
  status: GlobalFrequencyClaimStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    revision: number,
    pinned: boolean,
    externalRef: string,
    ceiling: number,
    tags: string[],
    quantity: number,
    frequencyCap: number,
    cost: number,
    status: GlobalFrequencyClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.revision = revision;
    this.pinned = pinned;
    this.externalRef = externalRef;
    this.ceiling = ceiling;
    this.tags = tags;
    this.quantity = quantity;
    this.frequencyCap = frequencyCap;
    this.cost = cost;
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

  canMoveTo(next: GlobalFrequencyClaimStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalFrequencyClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global frequency claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
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

  netLoad(): number {
    return Math.round(this.revision * this.quantity * 100) / 100;
  }

  copy(): GlobalFrequencyClaim {
    return new GlobalFrequencyClaim(
      this.code,
      this.label,
      this.attributes,
      this.revision,
      this.pinned,
      this.externalRef,
      this.ceiling,
      this.tags,
      this.quantity,
      this.frequencyCap,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global frequency claim in status idle. */
export function newGlobalFrequencyClaim(code: string, label: string): GlobalFrequencyClaim {
  return new GlobalFrequencyClaim(code, label, new Map<string, string>(), 0, false, "", 0, [], 0, 0, 0, "idle");
}
