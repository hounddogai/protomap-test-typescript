import * as text from "../../../../kit/text.js";

/** Where a mention policy is in its life cycle. */
export type MentionPolicyStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a mention policy and its current status. */
export class MentionPolicy {
  code: string;
  label: string;
  retries: number;
  ceiling: number;
  tags: string[];
  channel: string;
  phone: string;
  status: MentionPolicyStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    ceiling: number,
    tags: string[],
    channel: string,
    phone: string,
    status: MentionPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.ceiling = ceiling;
    this.tags = tags;
    this.channel = channel;
    this.phone = phone;
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

  canMoveTo(next: MentionPolicyStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MentionPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention policy ${this.code} cannot move from ${this.status} to ${next}`);
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

  projectedValue(): number {
    return Math.round((this.ceiling - this.retries) * 100) / 100;
  }

  copy(): MentionPolicy {
    return new MentionPolicy(
      this.code,
      this.label,
      this.retries,
      this.ceiling,
      this.tags,
      this.channel,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a mention policy in status idle. */
export function newMentionPolicy(code: string, label: string): MentionPolicy {
  return new MentionPolicy(code, label, 0, 0, [], "", "", "idle");
}
