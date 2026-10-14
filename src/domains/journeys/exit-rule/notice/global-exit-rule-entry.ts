import * as text from "../../../../kit/text.js";

/** Where a global exit rule entry is in its life cycle. */
export type GlobalExitRuleEntryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A global exit rule entry as the exit rule team keeps it. */
export class GlobalExitRuleEntry {
  code: string;
  label: string;
  openRate: number;
  attributes: Map<string, string>;
  updatedAt: number;
  status: GlobalExitRuleEntryStatus;

  constructor(
    code: string,
    label: string,
    openRate: number,
    attributes: Map<string, string>,
    updatedAt: number,
    status: GlobalExitRuleEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.attributes = attributes;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: GlobalExitRuleEntryStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalExitRuleEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global exit rule entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"global exit rule entry"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedLoad(): number {
    return Math.round(this.updatedAt * this.openRate * 100) / 100;
  }

  copy(): GlobalExitRuleEntry {
    return new GlobalExitRuleEntry(this.code, this.label, this.openRate, this.attributes, this.updatedAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global exit rule entry in status planned. */
export function newGlobalExitRuleEntry(code: string, label: string): GlobalExitRuleEntry {
  return new GlobalExitRuleEntry(code, label, 0, new Map<string, string>(), 0, "planned");
}
