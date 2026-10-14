import * as text from "../../../../kit/text.js";

/** Where a mention rule is in its life cycle. */
export type MentionRuleStatus = "requested" | "granted" | "revoked" | "expired";

/** A mention rule as the mention team keeps it. */
export class MentionRule {
  code: string;
  title: string;
  version: number;
  country: string;
  pinned: boolean;
  status: MentionRuleStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    country: string,
    pinned: boolean,
    status: MentionRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.country = country;
    this.pinned = pinned;
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

  canMoveTo(next: MentionRuleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: MentionRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"mention rule"} ${this.code}`;
  }

  measuredValue(): number {
    return this.version;
  }

  copy(): MentionRule {
    return new MentionRule(this.code, this.title, this.version, this.country, this.pinned, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a mention rule in status requested. */
export function newMentionRule(code: string, title: string): MentionRule {
  return new MentionRule(code, title, 0, "", false, "requested");
}
