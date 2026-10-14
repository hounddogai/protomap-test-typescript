import * as text from "../../../../kit/text.js";

/** Where a post agreement is in its life cycle. */
export type PostAgreementStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One post agreement, with what the planners need to act on it. */
export class PostAgreement {
  code: string;
  label: string;
  maximum: number;
  expiresAt: number;
  category: string;
  rate: number;
  region: string;
  status: PostAgreementStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    expiresAt: number,
    category: string,
    rate: number,
    region: string,
    status: PostAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.expiresAt = expiresAt;
    this.category = category;
    this.rate = rate;
    this.region = region;
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

  canMoveTo(next: PostAgreementStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PostAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round(this.rate * this.maximum * 100) / 100;
  }

  copy(): PostAgreement {
    return new PostAgreement(
      this.code,
      this.label,
      this.maximum,
      this.expiresAt,
      this.category,
      this.rate,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a post agreement in status open. */
export function newPostAgreement(code: string, label: string): PostAgreement {
  return new PostAgreement(code, label, 0, 0, "", 0, "", "open");
}
