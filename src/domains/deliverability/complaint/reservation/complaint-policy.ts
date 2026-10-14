import * as text from "../../../../kit/text.js";

/** Where a complaint policy is in its life cycle. */
export type ComplaintPolicyStatus = "requested" | "granted" | "revoked" | "expired";

/** A complaint policy. Its code is unique within a tenant. */
export class ComplaintPolicy {
  code: string;
  title: string;
  limit: number;
  cost: number;
  attributes: Map<string, string>;
  channel: string;
  name: string;
  margin: number;
  impressions: number;
  status: ComplaintPolicyStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    cost: number,
    attributes: Map<string, string>,
    channel: string,
    name: string,
    margin: number,
    impressions: number,
    status: ComplaintPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.cost = cost;
    this.attributes = attributes;
    this.channel = channel;
    this.name = name;
    this.margin = margin;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ComplaintPolicyStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ComplaintPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"complaint policy"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedVolume(): number {
    return Math.round((this.impressions + this.margin) * 100) / 100;
  }

  copy(): ComplaintPolicy {
    return new ComplaintPolicy(
      this.code,
      this.title,
      this.limit,
      this.cost,
      this.attributes,
      this.channel,
      this.name,
      this.margin,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a complaint policy in status requested. */
export function newComplaintPolicy(code: string, title: string): ComplaintPolicy {
  return new ComplaintPolicy(code, title, 0, 0, new Map<string, string>(), "", "", 0, 0, "requested");
}
