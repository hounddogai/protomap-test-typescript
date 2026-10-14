import * as text from "../../../../kit/text.js";

/** Where a rolling flight budget is in its life cycle. */
export type RollingFlightBudgetStatus = "created" | "validated" | "published" | "retired";

/** One rolling flight budget, with what the planners need to act on it. */
export class RollingFlightBudget {
  code: string;
  label: string;
  archived: boolean;
  attributes: Map<string, string>;
  channel: string;
  tags: string[];
  quantity: number;
  status: RollingFlightBudgetStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    attributes: Map<string, string>,
    channel: string,
    tags: string[],
    quantity: number,
    status: RollingFlightBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.attributes = attributes;
    this.channel = channel;
    this.tags = tags;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingFlightBudgetStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RollingFlightBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling flight budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
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
    return this.quantity;
  }

  copy(): RollingFlightBudget {
    return new RollingFlightBudget(
      this.code,
      this.label,
      this.archived,
      this.attributes,
      this.channel,
      this.tags,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a rolling flight budget in status created. */
export function newRollingFlightBudget(code: string, label: string): RollingFlightBudget {
  return new RollingFlightBudget(code, label, false, new Map<string, string>(), "", [], 0, "created");
}
