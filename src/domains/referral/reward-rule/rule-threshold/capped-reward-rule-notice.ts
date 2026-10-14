import * as text from "../../../../kit/text.js";

/** Where a capped reward rule notice is in its life cycle. */
export type CappedRewardRuleNoticeStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A capped reward rule notice. Its code is unique within a tenant. */
export class CappedRewardRuleNotice {
  code: string;
  label: string;
  archived: boolean;
  name: string;
  externalRef: string;
  expiresAt: number;
  ownerId: string;
  sequence: number;
  status: CappedRewardRuleNoticeStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    name: string,
    externalRef: string,
    expiresAt: number,
    ownerId: string,
    sequence: number,
    status: CappedRewardRuleNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.name = name;
    this.externalRef = externalRef;
    this.expiresAt = expiresAt;
    this.ownerId = ownerId;
    this.sequence = sequence;
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

  canMoveTo(next: CappedRewardRuleNoticeStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: CappedRewardRuleNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped reward rule notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedValue(): number {
    return Math.round((this.expiresAt - this.sequence) * 100) / 100;
  }

  copy(): CappedRewardRuleNotice {
    return new CappedRewardRuleNotice(
      this.code,
      this.label,
      this.archived,
      this.name,
      this.externalRef,
      this.expiresAt,
      this.ownerId,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a capped reward rule notice in status open. */
export function newCappedRewardRuleNotice(code: string, label: string): CappedRewardRuleNotice {
  return new CappedRewardRuleNotice(code, label, false, "", "", 0, "", 0, "open");
}
