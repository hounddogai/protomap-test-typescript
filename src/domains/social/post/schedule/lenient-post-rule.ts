import * as text from "../../../../kit/text.js";

/** Where a lenient post rule is in its life cycle. */
export type LenientPostRuleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One lenient post rule, with what the planners need to act on it. */
export class LenientPostRule {
  code: string;
  title: string;
  channel: string;
  score: number;
  visible: boolean;
  approved: boolean;
  description: string;
  status: LenientPostRuleStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    score: number,
    visible: boolean,
    approved: boolean,
    description: string,
    status: LenientPostRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.score = score;
    this.visible = visible;
    this.approved = approved;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientPostRuleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientPostRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient post rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): LenientPostRule {
    return new LenientPostRule(
      this.code,
      this.title,
      this.channel,
      this.score,
      this.visible,
      this.approved,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient post rule in status proposed. */
export function newLenientPostRule(code: string, title: string): LenientPostRule {
  return new LenientPostRule(code, title, "", 0, false, false, "", "proposed");
}
