import * as text from "../../../../kit/text.js";

/** Where a post plan is in its life cycle. */
export type PostPlanStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One post plan, with what the planners need to act on it. */
export class PostPlan {
  code: string;
  label: string;
  sequence: number;
  locale: string;
  source: string;
  externalRef: string;
  batchSize: number;
  rate: number;
  visible: boolean;
  status: PostPlanStatus;

  constructor(
    code: string,
    label: string,
    sequence: number,
    locale: string,
    source: string,
    externalRef: string,
    batchSize: number,
    rate: number,
    visible: boolean,
    status: PostPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.locale = locale;
    this.source = source;
    this.externalRef = externalRef;
    this.batchSize = batchSize;
    this.rate = rate;
    this.visible = visible;
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

  canMoveTo(next: PostPlanStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PostPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netLoad(): number {
    return Math.round(this.batchSize * this.sequence * 100) / 100;
  }

  copy(): PostPlan {
    return new PostPlan(
      this.code,
      this.label,
      this.sequence,
      this.locale,
      this.source,
      this.externalRef,
      this.batchSize,
      this.rate,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a post plan in status planned. */
export function newPostPlan(code: string, label: string): PostPlan {
  return new PostPlan(code, label, 0, "", "", "", 0, 0, false, "planned");
}
