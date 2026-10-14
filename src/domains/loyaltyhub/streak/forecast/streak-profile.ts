import * as text from "../../../../kit/text.js";

/** Where a streak profile is in its life cycle. */
export type StreakProfileStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a streak profile and its current status. */
export class StreakProfile {
  code: string;
  label: string;
  pinned: boolean;
  currency: string;
  weight: number;
  channel: string;
  utmSource: string;
  attributes: Map<string, string>;
  status: StreakProfileStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    currency: string,
    weight: number,
    channel: string,
    utmSource: string,
    attributes: Map<string, string>,
    status: StreakProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.currency = currency;
    this.weight = weight;
    this.channel = channel;
    this.utmSource = utmSource;
    this.attributes = attributes;
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

  canMoveTo(next: StreakProfileStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: StreakProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.weight;
  }

  copy(): StreakProfile {
    return new StreakProfile(
      this.code,
      this.label,
      this.pinned,
      this.currency,
      this.weight,
      this.channel,
      this.utmSource,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a streak profile in status new. */
export function newStreakProfile(code: string, label: string): StreakProfile {
  return new StreakProfile(code, label, false, "", 0, "", "", new Map<string, string>(), "new");
}
