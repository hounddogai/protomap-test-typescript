import * as text from "../../../../kit/text.js";

/** Where a sender plan is in its life cycle. */
export type SenderPlanStatus = "created" | "validated" | "published" | "retired";

/** One sender plan, with what the planners need to act on it. */
export class SenderPlan {
  code: string;
  title: string;
  source: string;
  maximum: number;
  reviewer: string;
  audienceId: string;
  channel: string;
  status: SenderPlanStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    maximum: number,
    reviewer: string,
    audienceId: string,
    channel: string,
    status: SenderPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.maximum = maximum;
    this.reviewer = reviewer;
    this.audienceId = audienceId;
    this.channel = channel;
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

  canMoveTo(next: SenderPlanStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: SenderPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"sender plan"} ${this.code}`;
  }

  measuredValue(): number {
    return this.maximum;
  }

  copy(): SenderPlan {
    return new SenderPlan(
      this.code,
      this.title,
      this.source,
      this.maximum,
      this.reviewer,
      this.audienceId,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a sender plan in status created. */
export function newSenderPlan(code: string, title: string): SenderPlan {
  return new SenderPlan(code, title, "", 0, "", "", "", "created");
}
