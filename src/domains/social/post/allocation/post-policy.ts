import * as text from "../../../../kit/text.js";

/** Where a post policy is in its life cycle. */
export type PostPolicyStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A post policy. Its code is unique within a tenant. */
export class PostPolicy {
  code: string;
  label: string;
  archived: boolean;
  score: number;
  currency: string;
  source: string;
  quantity: number;
  approved: boolean;
  utmSource: string;
  status: PostPolicyStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    score: number,
    currency: string,
    source: string,
    quantity: number,
    approved: boolean,
    utmSource: string,
    status: PostPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.score = score;
    this.currency = currency;
    this.source = source;
    this.quantity = quantity;
    this.approved = approved;
    this.utmSource = utmSource;
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

  canMoveTo(next: PostPolicyStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PostPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"post policy"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.score + this.quantity) * 100) / 100;
  }

  copy(): PostPolicy {
    return new PostPolicy(
      this.code,
      this.label,
      this.archived,
      this.score,
      this.currency,
      this.source,
      this.quantity,
      this.approved,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a post policy in status proposed. */
export function newPostPolicy(code: string, label: string): PostPolicy {
  return new PostPolicy(code, label, false, 0, "", "", 0, false, "", "proposed");
}
