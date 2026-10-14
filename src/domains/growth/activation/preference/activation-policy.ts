import * as text from "../../../../kit/text.js";

/** Where a activation policy is in its life cycle. */
export type ActivationPolicyStatus = "created" | "validated" | "published" | "retired";

/** A activation policy as the activation team keeps it. */
export class ActivationPolicy {
  code: string;
  title: string;
  limit: number;
  clicks: number;
  budget: number;
  tags: string[];
  locale: string;
  ceiling: number;
  source: string;
  status: ActivationPolicyStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    clicks: number,
    budget: number,
    tags: string[],
    locale: string,
    ceiling: number,
    source: string,
    status: ActivationPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.clicks = clicks;
    this.budget = budget;
    this.tags = tags;
    this.locale = locale;
    this.ceiling = ceiling;
    this.source = source;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ActivationPolicyStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ActivationPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"activation policy"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round((this.clicks + this.limit) * 100) / 100;
  }

  copy(): ActivationPolicy {
    return new ActivationPolicy(
      this.code,
      this.title,
      this.limit,
      this.clicks,
      this.budget,
      this.tags,
      this.locale,
      this.ceiling,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a activation policy in status created. */
export function newActivationPolicy(code: string, title: string): ActivationPolicy {
  return new ActivationPolicy(code, title, 0, 0, 0, [], "", 0, "", "created");
}
