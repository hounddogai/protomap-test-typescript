import * as text from "../../../../kit/text.js";

/** Where a double opt in rule is in its life cycle. */
export type DoubleOptInRuleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A double opt in rule. Its code is unique within a tenant. */
export class DoubleOptInRule {
  code: string;
  name: string;
  tags: string[];
  checksum: string;
  graceDays: number;
  status: DoubleOptInRuleStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    checksum: string,
    graceDays: number,
    status: DoubleOptInRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.checksum = checksum;
    this.graceDays = graceDays;
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

  canMoveTo(next: DoubleOptInRuleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: DoubleOptInRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in rule ${this.code} cannot move from ${this.status} to ${next}`);
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

  measuredValue(): number {
    return this.graceDays;
  }

  copy(): DoubleOptInRule {
    return new DoubleOptInRule(this.code, this.name, this.tags, this.checksum, this.graceDays, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a double opt in rule in status new. */
export function newDoubleOptInRule(code: string, name: string): DoubleOptInRule {
  return new DoubleOptInRule(code, name, [], "", 0, "new");
}
