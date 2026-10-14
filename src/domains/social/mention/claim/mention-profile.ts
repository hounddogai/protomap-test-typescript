import * as text from "../../../../kit/text.js";

/** Where a mention profile is in its life cycle. */
export type MentionProfileStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a mention profile and its current status. */
export class MentionProfile {
  code: string;
  name: string;
  tags: string[];
  currency: string;
  maximum: number;
  description: string;
  minimum: number;
  status: MentionProfileStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    currency: string,
    maximum: number,
    description: string,
    minimum: number,
    status: MentionProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.currency = currency;
    this.maximum = maximum;
    this.description = description;
    this.minimum = minimum;
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

  canMoveTo(next: MentionProfileStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
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
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MentionProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netLoad(): number {
    return Math.round((this.minimum - this.maximum) * 100) / 100;
  }

  copy(): MentionProfile {
    return new MentionProfile(
      this.code,
      this.name,
      this.tags,
      this.currency,
      this.maximum,
      this.description,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a mention profile in status new. */
export function newMentionProfile(code: string, name: string): MentionProfile {
  return new MentionProfile(code, name, [], "", 0, "", 0, "new");
}
