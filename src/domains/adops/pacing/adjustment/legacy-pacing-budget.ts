import * as text from "../../../../kit/text.js";

/** Where a legacy pacing budget is in its life cycle. */
export type LegacyPacingBudgetStatus = "requested" | "granted" | "revoked" | "expired";

/** A legacy pacing budget as the pacing team keeps it. */
export class LegacyPacingBudget {
  code: string;
  name: string;
  phone: string;
  ceiling: number;
  tags: string[];
  status: LegacyPacingBudgetStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    ceiling: number,
    tags: string[],
    status: LegacyPacingBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.ceiling = ceiling;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyPacingBudgetStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyPacingBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy pacing budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"legacy pacing budget"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.ceiling;
  }

  copy(): LegacyPacingBudget {
    return new LegacyPacingBudget(this.code, this.name, this.phone, this.ceiling, this.tags, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a legacy pacing budget in status requested. */
export function newLegacyPacingBudget(code: string, name: string): LegacyPacingBudget {
  return new LegacyPacingBudget(code, name, "", 0, [], "requested");
}
