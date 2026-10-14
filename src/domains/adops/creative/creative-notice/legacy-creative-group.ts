import * as text from "../../../../kit/text.js";

/** Where a legacy creative group is in its life cycle. */
export type LegacyCreativeGroupStatus = "created" | "validated" | "published" | "retired";

/** One legacy creative group, with what the planners need to act on it. */
export class LegacyCreativeGroup {
  code: string;
  name: string;
  cost: number;
  budget: number;
  updatedAt: number;
  sendAt: number;
  priority: number;
  margin: number;
  rate: number;
  locale: string;
  channel: string;
  status: LegacyCreativeGroupStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    budget: number,
    updatedAt: number,
    sendAt: number,
    priority: number,
    margin: number,
    rate: number,
    locale: string,
    channel: string,
    status: LegacyCreativeGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.budget = budget;
    this.updatedAt = updatedAt;
    this.sendAt = sendAt;
    this.priority = priority;
    this.margin = margin;
    this.rate = rate;
    this.locale = locale;
    this.channel = channel;
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

  canMoveTo(next: LegacyCreativeGroupStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyCreativeGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy creative group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"legacy creative group"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.margin - this.priority) * 100) / 100;
  }

  copy(): LegacyCreativeGroup {
    return new LegacyCreativeGroup(
      this.code,
      this.name,
      this.cost,
      this.budget,
      this.updatedAt,
      this.sendAt,
      this.priority,
      this.margin,
      this.rate,
      this.locale,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a legacy creative group in status created. */
export function newLegacyCreativeGroup(code: string, name: string): LegacyCreativeGroup {
  return new LegacyCreativeGroup(code, name, 0, 0, 0, 0, 0, 0, 0, "", "", "created");
}
