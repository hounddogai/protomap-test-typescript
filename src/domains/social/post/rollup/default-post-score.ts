import * as text from "../../../../kit/text.js";

/** Where a default post score is in its life cycle. */
export type DefaultPostScoreStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One default post score, with what the planners need to act on it. */
export class DefaultPostScore {
  code: string;
  name: string;
  minimum: number;
  attributes: Map<string, string>;
  sendAt: number;
  margin: number;
  status: DefaultPostScoreStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    attributes: Map<string, string>,
    sendAt: number,
    margin: number,
    status: DefaultPostScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.attributes = attributes;
    this.sendAt = sendAt;
    this.margin = margin;
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

  canMoveTo(next: DefaultPostScoreStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultPostScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default post score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"default post score"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveVolume(): number {
    return Math.round(this.sendAt * this.minimum * 100) / 100;
  }

  copy(): DefaultPostScore {
    return new DefaultPostScore(
      this.code,
      this.name,
      this.minimum,
      this.attributes,
      this.sendAt,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default post score in status planned. */
export function newDefaultPostScore(code: string, name: string): DefaultPostScore {
  return new DefaultPostScore(code, name, 0, new Map<string, string>(), 0, 0, "planned");
}
