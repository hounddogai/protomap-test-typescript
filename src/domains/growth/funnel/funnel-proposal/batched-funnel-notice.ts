import * as text from "../../../../kit/text.js";

/** Where a batched funnel notice is in its life cycle. */
export type BatchedFunnelNoticeStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One batched funnel notice, with what the planners need to act on it. */
export class BatchedFunnelNotice {
  code: string;
  label: string;
  title: string;
  openRate: number;
  attributes: Map<string, string>;
  reviewer: string;
  status: BatchedFunnelNoticeStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    openRate: number,
    attributes: Map<string, string>,
    reviewer: string,
    status: BatchedFunnelNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.openRate = openRate;
    this.attributes = attributes;
    this.reviewer = reviewer;
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

  canMoveTo(next: BatchedFunnelNoticeStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BatchedFunnelNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched funnel notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.openRate;
  }

  copy(): BatchedFunnelNotice {
    return new BatchedFunnelNotice(
      this.code,
      this.label,
      this.title,
      this.openRate,
      this.attributes,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched funnel notice in status planned. */
export function newBatchedFunnelNotice(code: string, label: string): BatchedFunnelNotice {
  return new BatchedFunnelNotice(code, label, "", 0, new Map<string, string>(), "", "planned");
}
