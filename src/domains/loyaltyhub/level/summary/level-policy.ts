import * as text from "../../../../kit/text.js";

/** Where a level policy is in its life cycle. */
export type LevelPolicyStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a level policy and its current status. */
export class LevelPolicy {
  code: string;
  name: string;
  timezone: string;
  limit: number;
  externalRef: string;
  status: LevelPolicyStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    limit: number,
    externalRef: string,
    status: LevelPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.limit = limit;
    this.externalRef = externalRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: LevelPolicyStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LevelPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.limit;
  }

  copy(): LevelPolicy {
    return new LevelPolicy(this.code, this.name, this.timezone, this.limit, this.externalRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a level policy in status idle. */
export function newLevelPolicy(code: string, name: string): LevelPolicy {
  return new LevelPolicy(code, name, "", 0, "", "idle");
}
