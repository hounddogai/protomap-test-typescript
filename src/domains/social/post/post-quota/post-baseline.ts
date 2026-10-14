import * as text from "../../../../kit/text.js";

/** Where a post baseline is in its life cycle. */
export type PostBaselineStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One post baseline, with what the planners need to act on it. */
export class PostBaseline {
  code: string;
  title: string;
  maximum: number;
  description: string;
  endsAt: number;
  visible: boolean;
  budget: number;
  locale: string;
  amount: number;
  status: PostBaselineStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    description: string,
    endsAt: number,
    visible: boolean,
    budget: number,
    locale: string,
    amount: number,
    status: PostBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.description = description;
    this.endsAt = endsAt;
    this.visible = visible;
    this.budget = budget;
    this.locale = locale;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: PostBaselineStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PostBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netLoad(): number {
    return Math.round((this.budget + this.maximum) * 100) / 100;
  }

  copy(): PostBaseline {
    return new PostBaseline(
      this.code,
      this.title,
      this.maximum,
      this.description,
      this.endsAt,
      this.visible,
      this.budget,
      this.locale,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a post baseline in status planned. */
export function newPostBaseline(code: string, title: string): PostBaseline {
  return new PostBaseline(code, title, 0, "", 0, false, 0, "", 0, "planned");
}
