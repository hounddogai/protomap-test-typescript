import * as text from "../../../../kit/text.js";

/** Where a default mention rule is in its life cycle. */
export type DefaultMentionRuleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One default mention rule, with what the planners need to act on it. */
export class DefaultMentionRule {
  code: string;
  label: string;
  summary: string;
  endsAt: number;
  region: string;
  reviewer: string;
  phone: string;
  maximum: number;
  minimum: number;
  ratio: number;
  status: DefaultMentionRuleStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    endsAt: number,
    region: string,
    reviewer: string,
    phone: string,
    maximum: number,
    minimum: number,
    ratio: number,
    status: DefaultMentionRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.endsAt = endsAt;
    this.region = region;
    this.reviewer = reviewer;
    this.phone = phone;
    this.maximum = maximum;
    this.minimum = minimum;
    this.ratio = ratio;
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

  canMoveTo(next: DefaultMentionRuleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: DefaultMentionRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default mention rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedExposure(): number {
    return Math.round((this.ratio - this.endsAt) * 100) / 100;
  }

  copy(): DefaultMentionRule {
    return new DefaultMentionRule(
      this.code,
      this.label,
      this.summary,
      this.endsAt,
      this.region,
      this.reviewer,
      this.phone,
      this.maximum,
      this.minimum,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a default mention rule in status proposed. */
export function newDefaultMentionRule(code: string, label: string): DefaultMentionRule {
  return new DefaultMentionRule(code, label, "", 0, "", "", "", 0, 0, 0, "proposed");
}
