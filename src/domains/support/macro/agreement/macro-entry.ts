import * as text from "../../../../kit/text.js";

/** Where a macro entry is in its life cycle. */
export type MacroEntryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One macro entry, with what the planners need to act on it. */
export class MacroEntry {
  code: string;
  name: string;
  threshold: number;
  sendAt: number;
  segment: string;
  utmSource: string;
  region: string;
  rate: number;
  budget: number;
  expiresAt: number;
  tags: string[];
  status: MacroEntryStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    sendAt: number,
    segment: string,
    utmSource: string,
    region: string,
    rate: number,
    budget: number,
    expiresAt: number,
    tags: string[],
    status: MacroEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.sendAt = sendAt;
    this.segment = segment;
    this.utmSource = utmSource;
    this.region = region;
    this.rate = rate;
    this.budget = budget;
    this.expiresAt = expiresAt;
    this.tags = tags;
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

  canMoveTo(next: MacroEntryStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: MacroEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"macro entry"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netExposure(): number {
    return Math.round((this.sendAt + this.budget) * 100) / 100;
  }

  copy(): MacroEntry {
    return new MacroEntry(
      this.code,
      this.name,
      this.threshold,
      this.sendAt,
      this.segment,
      this.utmSource,
      this.region,
      this.rate,
      this.budget,
      this.expiresAt,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a macro entry in status proposed. */
export function newMacroEntry(code: string, name: string): MacroEntry {
  return new MacroEntry(code, name, 0, 0, "", "", "", 0, 0, 0, [], "proposed");
}
