import * as text from "../../../../kit/text.js";

/** Where a exit rule notice is in its life cycle. */
export type ExitRuleNoticeStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a exit rule notice and its current status. */
export class ExitRuleNotice {
  code: string;
  label: string;
  threshold: number;
  campaignRef: string;
  bid: number;
  description: string;
  name: string;
  channel: string;
  attributes: Map<string, string>;
  status: ExitRuleNoticeStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    campaignRef: string,
    bid: number,
    description: string,
    name: string,
    channel: string,
    attributes: Map<string, string>,
    status: ExitRuleNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.campaignRef = campaignRef;
    this.bid = bid;
    this.description = description;
    this.name = name;
    this.channel = channel;
    this.attributes = attributes;
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

  canMoveTo(next: ExitRuleNoticeStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ExitRuleNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule notice ${this.code} cannot move from ${this.status} to ${next}`);
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

  effectiveVolume(): number {
    return Math.round((this.threshold - this.bid) * 100) / 100;
  }

  copy(): ExitRuleNotice {
    return new ExitRuleNotice(
      this.code,
      this.label,
      this.threshold,
      this.campaignRef,
      this.bid,
      this.description,
      this.name,
      this.channel,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a exit rule notice in status proposed. */
export function newExitRuleNotice(code: string, label: string): ExitRuleNotice {
  return new ExitRuleNotice(code, label, 0, "", 0, "", "", "", new Map<string, string>(), "proposed");
}
