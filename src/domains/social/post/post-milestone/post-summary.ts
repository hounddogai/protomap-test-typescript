import * as text from "../../../../kit/text.js";

/** Where a post summary is in its life cycle. */
export type PostSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** A post summary. Its code is unique within a tenant. */
export class PostSummary {
  code: string;
  name: string;
  unit: string;
  timezone: string;
  label: string;
  amount: number;
  status: PostSummaryStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    timezone: string,
    label: string,
    amount: number,
    status: PostSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.timezone = timezone;
    this.label = label;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PostSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PostSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"post summary"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): PostSummary {
    return new PostSummary(this.code, this.name, this.unit, this.timezone, this.label, this.amount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a post summary in status new. */
export function newPostSummary(code: string, name: string): PostSummary {
  return new PostSummary(code, name, "", "", "", 0, "new");
}
