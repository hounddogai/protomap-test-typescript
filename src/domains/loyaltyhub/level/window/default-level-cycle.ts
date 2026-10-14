import * as text from "../../../../kit/text.js";

/** Where a default level cycle is in its life cycle. */
export type DefaultLevelCycleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One default level cycle, with what the planners need to act on it. */
export class DefaultLevelCycle {
  code: string;
  name: string;
  priority: number;
  checksum: string;
  attributes: Map<string, string>;
  externalRef: string;
  ratio: number;
  status: DefaultLevelCycleStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    checksum: string,
    attributes: Map<string, string>,
    externalRef: string,
    ratio: number,
    status: DefaultLevelCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.checksum = checksum;
    this.attributes = attributes;
    this.externalRef = externalRef;
    this.ratio = ratio;
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

  canMoveTo(next: DefaultLevelCycleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: DefaultLevelCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default level cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveTotal(): number {
    return Math.round(this.priority * this.ratio * 100) / 100;
  }

  copy(): DefaultLevelCycle {
    return new DefaultLevelCycle(
      this.code,
      this.name,
      this.priority,
      this.checksum,
      this.attributes,
      this.externalRef,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default level cycle in status planned. */
export function newDefaultLevelCycle(code: string, name: string): DefaultLevelCycle {
  return new DefaultLevelCycle(code, name, 0, "", new Map<string, string>(), "", 0, "planned");
}
