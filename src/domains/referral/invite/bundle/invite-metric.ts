import * as text from "../../../../kit/text.js";

/** Where a invite metric is in its life cycle. */
export type InviteMetricStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A invite metric. Its code is unique within a tenant. */
export class InviteMetric {
  code: string;
  label: string;
  title: string;
  ratio: number;
  ceiling: number;
  locale: string;
  createdAt: number;
  status: InviteMetricStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    ratio: number,
    ceiling: number,
    locale: string,
    createdAt: number,
    status: InviteMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.ratio = ratio;
    this.ceiling = ceiling;
    this.locale = locale;
    this.createdAt = createdAt;
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

  canMoveTo(next: InviteMetricStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: InviteMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedLoad(): number {
    return Math.round((this.createdAt - this.ratio) * 100) / 100;
  }

  copy(): InviteMetric {
    return new InviteMetric(
      this.code,
      this.label,
      this.title,
      this.ratio,
      this.ceiling,
      this.locale,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a invite metric in status proposed. */
export function newInviteMetric(code: string, label: string): InviteMetric {
  return new InviteMetric(code, label, "", 0, 0, "", 0, "proposed");
}
