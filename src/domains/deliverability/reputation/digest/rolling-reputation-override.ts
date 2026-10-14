import * as text from "../../../../kit/text.js";

/** Where a rolling reputation override is in its life cycle. */
export type RollingReputationOverrideStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a rolling reputation override and its current status. */
export class RollingReputationOverride {
  code: string;
  name: string;
  expiresAt: number;
  tags: string[];
  channel: string;
  journeyId: string;
  segment: string;
  status: RollingReputationOverrideStatus;

  constructor(
    code: string,
    name: string,
    expiresAt: number,
    tags: string[],
    channel: string,
    journeyId: string,
    segment: string,
    status: RollingReputationOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.tags = tags;
    this.channel = channel;
    this.journeyId = journeyId;
    this.segment = segment;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingReputationOverrideStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingReputationOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling reputation override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.expiresAt;
  }

  copy(): RollingReputationOverride {
    return new RollingReputationOverride(
      this.code,
      this.name,
      this.expiresAt,
      this.tags,
      this.channel,
      this.journeyId,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a rolling reputation override in status open. */
export function newRollingReputationOverride(code: string, name: string): RollingReputationOverride {
  return new RollingReputationOverride(code, name, 0, [], "", "", "", "open");
}
