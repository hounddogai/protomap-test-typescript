import * as text from "../../../../kit/text.js";

/** Where a capped streak policy is in its life cycle. */
export type CappedStreakPolicyStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a capped streak policy and its current status. */
export class CappedStreakPolicy {
  code: string;
  label: string;
  visible: boolean;
  updatedAt: number;
  maximum: number;
  minimum: number;
  pinned: boolean;
  amount: number;
  contactEmail: string;
  tags: string[];
  status: CappedStreakPolicyStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    updatedAt: number,
    maximum: number,
    minimum: number,
    pinned: boolean,
    amount: number,
    contactEmail: string,
    tags: string[],
    status: CappedStreakPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.updatedAt = updatedAt;
    this.maximum = maximum;
    this.minimum = minimum;
    this.pinned = pinned;
    this.amount = amount;
    this.contactEmail = contactEmail;
    this.tags = tags;
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

  canMoveTo(next: CappedStreakPolicyStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: CappedStreakPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped streak policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"capped streak policy"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netTotal(): number {
    return Math.round((this.maximum - this.amount) * 100) / 100;
  }

  copy(): CappedStreakPolicy {
    return new CappedStreakPolicy(
      this.code,
      this.label,
      this.visible,
      this.updatedAt,
      this.maximum,
      this.minimum,
      this.pinned,
      this.amount,
      this.contactEmail,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a capped streak policy in status open. */
export function newCappedStreakPolicy(code: string, label: string): CappedStreakPolicy {
  return new CappedStreakPolicy(code, label, false, 0, 0, 0, false, 0, "", [], "open");
}
