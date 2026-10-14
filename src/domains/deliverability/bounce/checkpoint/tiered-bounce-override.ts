import * as text from "../../../../kit/text.js";

/** Where a tiered bounce override is in its life cycle. */
export type TieredBounceOverrideStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tiered bounce override. Its code is unique within a tenant. */
export class TieredBounceOverride {
  code: string;
  name: string;
  channel: string;
  source: string;
  budget: number;
  status: TieredBounceOverrideStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    source: string,
    budget: number,
    status: TieredBounceOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.source = source;
    this.budget = budget;
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

  canMoveTo(next: TieredBounceOverrideStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: TieredBounceOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered bounce override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): TieredBounceOverride {
    return new TieredBounceOverride(this.code, this.name, this.channel, this.source, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered bounce override in status planned. */
export function newTieredBounceOverride(code: string, name: string): TieredBounceOverride {
  return new TieredBounceOverride(code, name, "", "", 0, "planned");
}
