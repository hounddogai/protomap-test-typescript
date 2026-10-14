import * as text from "../../../../kit/text.js";

/** Where a lenient path preference is in its life cycle. */
export type LenientPathPreferenceStatus = "new" | "queued" | "running" | "done" | "failed";

/** A lenient path preference as the path team keeps it. */
export class LenientPathPreference {
  code: string;
  name: string;
  tags: string[];
  summary: string;
  attributes: Map<string, string>;
  description: string;
  impressions: number;
  currency: string;
  status: LenientPathPreferenceStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    summary: string,
    attributes: Map<string, string>,
    description: string,
    impressions: number,
    currency: string,
    status: LenientPathPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.summary = summary;
    this.attributes = attributes;
    this.description = description;
    this.impressions = impressions;
    this.currency = currency;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientPathPreferenceStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientPathPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient path preference ${this.code} cannot move from ${this.status} to ${next}`);
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

  measuredValue(): number {
    return this.impressions;
  }

  copy(): LenientPathPreference {
    return new LenientPathPreference(
      this.code,
      this.name,
      this.tags,
      this.summary,
      this.attributes,
      this.description,
      this.impressions,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient path preference in status new. */
export function newLenientPathPreference(code: string, name: string): LenientPathPreference {
  return new LenientPathPreference(code, name, [], "", new Map<string, string>(), "", 0, "", "new");
}
