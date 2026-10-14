import * as text from "../../../../kit/text.js";

/** Where a rolling bid rule profile is in its life cycle. */
export type RollingBidRuleProfileStatus = "new" | "queued" | "running" | "done" | "failed";

/** A rolling bid rule profile. Its code is unique within a tenant. */
export class RollingBidRuleProfile {
  code: string;
  label: string;
  floorValue: number;
  timezone: string;
  attributes: Map<string, string>;
  status: RollingBidRuleProfileStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    timezone: string,
    attributes: Map<string, string>,
    status: RollingBidRuleProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.timezone = timezone;
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

  canMoveTo(next: RollingBidRuleProfileStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingBidRuleProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling bid rule profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
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

  copy(): RollingBidRuleProfile {
    return new RollingBidRuleProfile(
      this.code,
      this.label,
      this.floorValue,
      this.timezone,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling bid rule profile in status new. */
export function newRollingBidRuleProfile(code: string, label: string): RollingBidRuleProfile {
  return new RollingBidRuleProfile(code, label, 0, "", new Map<string, string>(), "new");
}
