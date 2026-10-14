import * as text from "../../../../kit/text.js";

/** Where a primary payout override is in its life cycle. */
export type PrimaryPayoutOverrideStatus = "new" | "queued" | "running" | "done" | "failed";

/** One primary payout override, with what the planners need to act on it. */
export class PrimaryPayoutOverride {
  code: string;
  label: string;
  journeyId: string;
  floorValue: number;
  attributes: Map<string, string>;
  status: PrimaryPayoutOverrideStatus;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    floorValue: number,
    attributes: Map<string, string>,
    status: PrimaryPayoutOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.floorValue = floorValue;
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

  canMoveTo(next: PrimaryPayoutOverrideStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
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

  moveTo(next: PrimaryPayoutOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary payout override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.floorValue;
  }

  copy(): PrimaryPayoutOverride {
    return new PrimaryPayoutOverride(
      this.code,
      this.label,
      this.journeyId,
      this.floorValue,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a primary payout override in status new. */
export function newPrimaryPayoutOverride(code: string, label: string): PrimaryPayoutOverride {
  return new PrimaryPayoutOverride(code, label, "", 0, new Map<string, string>(), "new");
}
